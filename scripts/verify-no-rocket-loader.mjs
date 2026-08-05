#!/usr/bin/env node
/**
 * Production check: Cloudflare Rocket Loader must not rewrite Astro modules.
 *
 * Rocket Loader is a Cloudflare zone setting (Dashboard → Speed → Optimization →
 * Content Optimization). When enabled, it rewrites Astro's generated
 * `<script type="module">` tags (including the Expressive Code runtime under
 * `/_astro/`) into tokenized `<script type="<hex>-module">` scripts, injects
 * `rocket-loader.min.js` with a `data-cf-settings` attribute, and strips the
 * module preload links. That invalidates preload reuse, which Chrome reports
 * as "preloaded resource was not used because the eventual request uses a
 * different credentials mode."
 *
 * This script fetches a live production page and fails only when Rocket Loader
 * markers are present. It deliberately does NOT treat Zaraz (`/cdn-cgi/zaraz/`)
 * or blocked analytics requests (e.g. a browser privacy blocker) as failures —
 * those are unrelated to Rocket Loader.
 *
 * OPT-IN SCRIPT — NOT part of CI. The repository has no post-deployment
 * verification workflow; run this manually after a Cloudflare dashboard change
 * or cache purge.
 *
 * Exit codes:
 *   0  PASS — no Rocket Loader markers in the fetched HTML.
 *   1  FAIL — Rocket Loader markers detected (configuration regression).
 *   2  ERROR — could not verify: invalid URL, network failure, or non-2xx
 *              response. Not a Rocket Loader regression.
 *
 * Usage:
 *   node scripts/verify-no-rocket-loader.mjs [url]
 *   node scripts/verify-no-rocket-loader.mjs --url=https://ericcarlisle.com/
 *   ROCKET_LOADER_URL=https://ericcarlisle.com node scripts/verify-no-rocket-loader.mjs
 *
 * Examples:
 *   pnpm verify:no-rocket-loader
 *   pnpm verify:no-rocket-loader https://ericcarlisle.com/blog/better-agent-results-start-with-better-context/
 */

const DEFAULT_URL = 'https://ericcarlisle.com/';
const FETCH_TIMEOUT_MS = 20000;

// Rocket Loader markers. The Cloudflare token is a variable-length lowercase
// hex string (observed 24-32 chars), so the module-type regex must not assume
// a fixed length.
const MARKERS = [
  {
    id: 'rocket-loader.min.js',
    label: 'rocket-loader.min.js loader script',
    regex: /rocket-loader\.min\.js/i,
  },
  {
    id: 'data-cf-settings',
    label: 'data-cf-settings attribute',
    regex: /data-cf-settings\s*=/i,
  },
  {
    id: 'rewritten-module-type',
    label: 'rewritten module script type (<hex>-module)',
    regex: /<script[^>]*type="[a-f0-9]{24,32}-module"/i,
  },
  {
    id: 'rewritten-classic-type',
    label: 'rewritten classic script type (<hex>-text/javascript)',
    regex: /<script[^>]*type="[a-f0-9]{24,32}-text\/javascript"/i,
  },
];

function help() {
  console.log(`Rocket Loader Production Check
${'='.repeat(50)}
Fetches a live ericcarlisle.com page and fails if Cloudflare Rocket Loader
markers are present (rocket-loader.min.js, data-cf-settings, or rewritten
script types such as <hex>-module). Rocket Loader rewrites Astro's module
scripts and invalidates preload reuse; it must remain disabled.

Zaraz (/cdn-cgi/zaraz/) and privacy-blocked analytics are NOT failures.

Options:
  [url]                Page to check (default: ${DEFAULT_URL})
  --url=URL            Same as positional URL
  --help               Print this message

Exit codes: 0 = pass, 1 = Rocket Loader detected, 2 = could not verify.

Examples:
  node scripts/verify-no-rocket-loader.mjs
  node scripts/verify-no-rocket-loader.mjs https://ericcarlisle.com/blog/better-agent-results-start-with-better-context/
`);
}

function parseArgs() {
  const args = { url: process.env.ROCKET_LOADER_URL || DEFAULT_URL };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    const m = arg.match(/^--url=(.+)$/);
    if (m) {
      args.url = m[1];
      continue;
    }
    if (arg.startsWith('--')) continue;
    // First non-flag argument is the URL.
    if (args.positional === undefined) args.positional = arg;
  }
  if (args.positional !== undefined) args.url = args.positional;
  return args;
}

/** Detect Rocket Loader markers in rendered HTML. Returns a list of hits. */
export function findRocketLoaderMarkers(html) {
  const hits = [];
  for (const marker of MARKERS) {
    let count = 0;
    let example = null;
    const re = new RegExp(
      marker.regex.source,
      marker.regex.flags.includes('g') ? marker.regex.flags : `${marker.regex.flags}g`,
    );
    for (const match of html.matchAll(re)) {
      count++;
      if (!example) example = match[0].slice(0, 140);
    }
    if (count > 0) hits.push({ id: marker.id, label: marker.label, count, example });
  }
  return hits;
}

/** Collect rewritten /_astro/ module srcs for the failure report. */
function rewrittenAstroModules(html) {
  const srcs = new Set();
  for (const m of html.matchAll(/<script[^>]*type="[a-f0-9]{24,32}-module"[^>]*src="([^"]+)"/gi)) {
    srcs.add(m[1]);
  }
  return [...srcs].slice(0, 5);
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    help();
    return;
  }

  let parsed;
  try {
    parsed = new URL(args.url);
  } catch {
    console.error(`  ✗ "${args.url}" is not a valid URL.`);
    console.error(`  This is a usage error, not a Rocket Loader regression.`);
    process.exit(2);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    console.error(`  ✗ "${args.url}" must use http(s).`);
    process.exit(2);
  }

  console.log(`Rocket Loader Production Check
${'='.repeat(50)}
URL:    ${parsed.href}
`);

  let res;
  try {
    res = await fetch(parsed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const reason =
      err?.name === 'TimeoutError'
        ? `timed out after ${FETCH_TIMEOUT_MS} ms`
        : err?.message || String(err);
    console.log(`  ✗ Could not verify: network failure (${reason}).`);
    console.log(`  This is a delivery/network issue, not a Rocket Loader regression.`);
    console.log(`  Retry, or check DNS/availability for ${parsed.origin}.`);
    process.exit(2);
  }

  if (!res.ok) {
    console.log(`  ✗ Could not verify: HTTP ${res.status} from ${parsed.href}.`);
    console.log(`  This is a delivery issue, not a Rocket Loader regression.`);
    process.exit(2);
  }

  const html = await res.text();
  console.log(`Status: HTTP ${res.status} (${html.length.toLocaleString('en-US')} bytes)`);

  const hits = findRocketLoaderMarkers(html);
  if (hits.length === 0) {
    console.log(`  ✓ No Rocket Loader markers found. Astro module scripts are untouched.`);
    process.exit(0);
  }

  console.log(`  ✗ Rocket Loader markers detected (${hits.length} marker type(s)): `);
  for (const hit of hits) {
    console.log(`    - ${hit.label}: ${hit.count} occurrence(s)`);
    if (hit.example) console.log(`      e.g. ${hit.example}`);
  }
  const astroModules = rewrittenAstroModules(html);
  if (astroModules.length > 0) {
    console.log(`    Rewritten /_astro/ module scripts: ${astroModules.join(', ')}`);
  }
  console.log(`
  Cloudflare Rocket Loader is rewriting Astro's generated module scripts,
  which invalidates preload reuse. Disable it in the Cloudflare Dashboard:
  Speed → Optimization → Content Optimization → Rocket Loader = Off, for the
  ericcarlisle.com zone (covers www via redirect), then purge the cache and
  re-run this check.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
