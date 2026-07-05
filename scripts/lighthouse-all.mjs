/**
 * Lighthouse All Pages
 *
 * Builds the site, serves it, then runs Lighthouse on every HTML page
 * in the output. Writes individual HTML reports to `lh-reports/`.
 *
 * Usage:
 *   node scripts/lighthouse-all.mjs
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const REPORTS = join(import.meta.dirname, '..', 'lh-reports');
const PORT = '4321';
const BASE = `http://localhost:${PORT}`;

/** Walk a directory recursively, yielding relative file paths. */
function joinPath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name;
}

function* walk(dir, prefix = '') {
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const path = joinPath(prefix, entry.name);
    if (entry.isDirectory()) {
      yield* walk(dir, path);
    } else if (entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

/** Map a file path like "about/index.html" to a URL path like "/about/". */
function htmlPathToUrl(htmlPath) {
  let url = `/${htmlPath.replace(/\/?index\.html$/, '')}`;
  if (!url.endsWith('/')) url += '/';
  return url;
}

function slugFromUrl(url) {
  return url === '/' ? 'index' : url.replace(/[/?#]/g, '_').replace(/^_|_$/g, '') || 'root';
}

// ── Step 1: Build ──
// Build with the production site URL (Lighthouse audits the built output
// directly; it doesn't need canonical URLs to point to localhost).
console.log('🔨 Building site…');
execSync('npx astro build', { cwd: join(import.meta.dirname, '..'), stdio: 'inherit' });

if (!existsSync(DIST) || !readdirSync(DIST).length) {
  console.error('❌ Build produced no output. Aborting.');
  process.exit(1);
}

// ── Step 2: Discover pages ──
const pages = [];
for (const file of walk(DIST)) {
  const url = htmlPathToUrl(file);
  pages.push({ file, url });
}
console.log(
  `📄 Found ${pages.length} page(s) to audit:\n  ${pages.map((p) => p.url).join('\n  ')}`,
);

// ── Step 3: Start static file server ──
// Kill any previous server on this port first.
try {
  execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
} catch {}

// Using a pure static server rather than `astro preview`
// because astro preview may inject Vite dev-middleware, producing
// inflated asset sizes and unminified output that skew Lighthouse scores.
console.log(`\n🌐 Starting static server on port ${PORT}…`);
const serverScript = join(import.meta.dirname, 'static-server.mjs');
const server = spawn(process.execPath, [serverScript, DIST, PORT], { stdio: 'pipe' });

// Wait until the server responds or timeout
const SERVER_TIMEOUT_MS = 15_000;
const start = Date.now();
let serverReady = false;

while (Date.now() - start < SERVER_TIMEOUT_MS) {
  try {
    const res = await fetch(BASE);
    if (res.ok) {
      serverReady = true;
      break;
    }
  } catch {
    // server not ready yet
  }
  await new Promise((r) => setTimeout(r, 300));
}

if (!serverReady) {
  console.error('❌ Server failed to start. Aborting.');
  server.kill();
  process.exit(1);
}

console.log('✅ Server ready.\n');

// ── Step 4: Create reports directory ──
mkdirSync(REPORTS, { recursive: true });

// ── Step 5: Run Lighthouse on each page ──
let passed = 0;
let failed = 0;

for (const { url } of pages) {
  const slug = slugFromUrl(url);
  const reportPath = join(REPORTS, `${slug}.html`);
  const fullUrl = BASE + url;

  console.log(`  🔍 ${url}`);
  try {
    execSync(
      `npx lighthouse "${fullUrl}" --output=html --output-path="${reportPath}" --quiet --chrome-flags="--headless=new --no-sandbox"`,
      { cwd: join(import.meta.dirname, '..'), stdio: 'pipe', timeout: 120_000 },
    );
    console.log(`     ✅ Report → lh-reports/${slug}.html`);
    passed++;
  } catch (err) {
    console.error(`     ❌ Failed: ${err.stderr?.toString().slice(0, 200) || err.message}`);
    failed++;
  }
}

// ── Step 6: Cleanup ──
server.kill('SIGKILL');
try {
  execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
} catch {}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`  Reports: lh-reports/*.html`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

process.exit(failed > 0 ? 1 : 0);
