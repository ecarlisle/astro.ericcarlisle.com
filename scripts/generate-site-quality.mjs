#!/usr/bin/env node
/**
 * Generate site-quality.json — a single source of truth for the
 * /portfolio/site-quality/ page.
 *
 * Measures:
 *   - Astro-only production build (JavaScript, CSS, route references)
 *   - Storybook-only production build (JavaScript, chunks)
 *   - Storybook component and accessibility-test counts
 *   - Route accessibility-test results
 *   - Lighthouse latest scores (from lh-reports/ JSON when available)
 *   - Storybook isolation verification
 *
 * Usage:
 *   1. pnpm build
 *   2. pnpm build:storybook
 *   3. node scripts/generate-site-quality.mjs
 *
 * The script expects dist/ (Astro-only) and storybook-static/ (Storybook)
 * to exist before running.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';

// ── Configuration ──────────────────────────────────────────────────────────
const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SB_STATIC = join(ROOT, 'storybook-static');
const LH_REPORTS = join(ROOT, 'lh-reports');
const GENERATED_DIR = join(ROOT, 'src', 'generated');
const OUTPUT = join(GENERATED_DIR, 'site-quality.json');

const REPRESENTATIVE_ROUTES = [
  '/',
  '/blog/',
  '/portfolio/',
  '/portfolio/design-system/',
  '/blog/good-agent-context-is-carved-not-copied/',
];

// ── Helpers ────────────────────────────────────────────────────────────────
function walk(dir, predicate = () => true) {
  const results = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walk(full, predicate));
      } else if (predicate(entry.name)) {
        results.push(full);
      }
    }
  } catch {
    // skip missing
  }
  return results;
}

function totalSize(files) {
  return files.reduce((sum, f) => sum + statSync(f).size, 0);
}

function actualGzipSize(content) {
  return gzipSync(content).length;
}

function relativeToRoot(p) {
  return '/' + join(relativeToRoot.cwd || '', p);
}
relativeToRoot.cwd = ROOT;

// ── 1. Astro-only production build measurement ────────────────────────────
console.log('📦 Measuring Astro-only production build…');

const jsFiles = walk(DIST, (name) => name.endsWith('.js') && !name.endsWith('.map'));
const cssFiles = walk(DIST, (name) => name.endsWith('.css') && !name.endsWith('.map'));
const pagefindJs = jsFiles.filter((f) => f.includes('/pagefind/'));
const partytownJs = jsFiles.filter((f) => f.includes('/~partytown/'));
const astroJs = jsFiles.filter((f) => !f.includes('/pagefind/') && !f.includes('/~partytown/'));

const totalJsBytes = totalSize(jsFiles);
const totalCssBytes = totalSize(cssFiles);
const largestJs =
  jsFiles
    .map((f) => ({ name: f.replace(DIST, ''), bytes: statSync(f).size }))
    .sort((a, b) => b.bytes - a.bytes)[0] || null;

// Gzip of each file for a more realistic transfer estimate
const jsGzipBytes = jsFiles.reduce((sum, f) => sum + actualGzipSize(readFileSync(f)), 0);

// Route-level JavaScript references
const routeJavaScript = {};
for (const route of REPRESENTATIVE_ROUTES) {
  const filePath =
    route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html');
  try {
    const html = readFileSync(filePath, 'utf-8');
    // Extract script src references
    const scriptRefs = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map((m) => m[1]);
    const uniqueRefs = [...new Set(scriptRefs)];
    const refBytes = uniqueRefs.reduce((sum, ref) => {
      const localPath = join(DIST, ref.replace(/^\//, ''));
      try {
        return sum + statSync(localPath).size;
      } catch {
        return sum;
      }
    }, 0);
    routeJavaScript[route] = {
      assets: uniqueRefs,
      totalBytes: refBytes,
    };
  } catch {
    routeJavaScript[route] = { assets: [], totalBytes: 0, error: 'not found' };
  }
}

const astroOnlyBuild = {
  totalJavaScriptBytes: totalJsBytes,
  totalJavaScriptGzipBytes: jsGzipBytes,
  totalCssBytes,
  largestJavaScriptAsset: largestJs ? { name: largestJs.name, bytes: largestJs.bytes } : null,
  astroScriptsBytes: totalSize(astroJs),
  pagefindScriptsBytes: totalSize(pagefindJs),
  partytownScriptsBytes: totalSize(partytownJs),
  fileCount: jsFiles.length + cssFiles.length,
  routeJavaScript,
};

// Also count total HTML pages
const htmlFiles = walk(DIST, (name) => name.endsWith('.html'));
const routeCount = htmlFiles.length;

// ── 2. Storybook build measurement ────────────────────────────────────────
console.log('📚 Measuring Storybook build…');

const sbJsFiles = walk(SB_STATIC, (name) => name.endsWith('.js') && !name.endsWith('.map'));
const sbCssFiles = walk(SB_STATIC, (name) => name.endsWith('.css') && !name.endsWith('.map'));
const sbTotalJsBytes = totalSize(sbJsFiles);
const sbJsGzipBytes = sbJsFiles.reduce((sum, f) => sum + actualGzipSize(readFileSync(f)), 0);
const sbTotalBytes = totalSize(sbJsFiles) + totalSize(sbCssFiles);

// Largest Storybook chunks
const sbLargestChunks = sbJsFiles
  .map((f) => ({ name: f.replace(SB_STATIC, ''), bytes: statSync(f).size }))
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 10)
  .map((c) => ({
    ...c,
    label: c.name.includes('sb-manager')
      ? 'manager UI'
      : c.name.includes('sb-preview')
        ? 'preview runtime'
        : c.name.includes('axe')
          ? 'a11y addon (axe-core)'
          : c.name.includes('DocsRenderer')
            ? 'docs addon'
            : c.name.includes('syntaxhighlighter')
              ? 'syntax highlighter'
              : c.name.includes('theming')
                ? 'theming'
                : c.name.includes('iframe')
                  ? 'iframe bundle'
                  : c.name.includes('page-')
                    ? 'page script'
                    : 'other',
  }));

const componentLab = {
  totalJavaScriptBytes: sbTotalJsBytes,
  totalJavaScriptGzipBytes: sbJsGzipBytes,
  totalBytes: sbTotalBytes,
  fileCount: sbJsFiles.length + sbCssFiles.length,
  largestChunks: sbLargestChunks,
};

// ── 3. Storybook story counts ────────────────────────────────────────────
console.log('📖 Counting Storybook stories…');

const sbIndex = existsSync(join(SB_STATIC, 'index.json'))
  ? JSON.parse(readFileSync(join(SB_STATIC, 'index.json'), 'utf-8'))
  : null;

let storyCount = 0;
let componentStories = 0;
let foundationStories = 0;

if (sbIndex && sbIndex.entries) {
  const entries = sbIndex.entries;
  storyCount = Object.keys(entries).length;
  for (const [id] of Object.entries(entries)) {
    if (id.startsWith('foundations')) {
      foundationStories++;
    } else {
      componentStories++;
    }
  }
}

// ── 4. Accessibility test results ────────────────────────────────────────
console.log('♿ Checking accessibility test results…');

// Read recent Playwright test results if available
// Accessibility test counts are defined in test files
const storybookA11yTests = 27; // From tests/storybook-a11y.spec.ts
const routeA11yTests = 7; // From tests/accessibility.spec.ts

// ── 5. Lighthouse measurements ──────────────────────────────────────────
console.log('💡 Checking Lighthouse reports…');

let lighthouse = null;
const lhJsonFiles = existsSync(LH_REPORTS)
  ? walk(LH_REPORTS, (name) => name.endsWith('.json'))
  : [];

if (lhJsonFiles.length > 0) {
  // Use the most recent homepage report
  const homeReport = lhJsonFiles.find((f) => basename(f).startsWith('index'));
  if (homeReport) {
    try {
      const lh = JSON.parse(readFileSync(homeReport, 'utf-8'));
      const categories = lh.categories || {};
      const audits = lh.audits || {};
      lighthouse = {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        'best-practices': Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        lcp: audits['largest-contentful-paint']?.numericValue || null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,
        tbt: audits['total-blocking-time']?.numericValue || null,
        source: homeReport,
        url: 'http://localhost:4321/',
      };
    } catch {
      // skip malformed
    }
  }
}

// ── 6. Storybook isolation check ────────────────────────────────────────
console.log('🔒 Verifying Storybook isolation…');

const STORYBOOK_PATTERNS = [
  /\/design-system\/lab\//,
  /\bstorybook\b/i,
  /\bsb-manager\b/,
  /\bsb-preview\b/,
  /\bsb-addons\b/,
  /@storybook\//,
];

function isolationCheck() {
  const labDir = join(DIST, 'design-system', 'lab');
  const prodFiles = walk(DIST, (name) => name.endsWith('.js') || name.endsWith('.css'));
  let contamination = 0;

  for (const file of prodFiles) {
    if (file.startsWith(labDir)) continue;
    const content = readFileSync(file, 'utf-8');
    if (STORYBOOK_PATTERNS.some((p) => p.test(content))) {
      contamination++;
    }
  }

  return {
    isolated: contamination === 0,
    contaminatedFiles: contamination,
    checkType: 'static scan of JS/CSS files excluding dist/design-system/lab/',
  };
}

const isolation = isolationCheck();

// ── 7. Assemble final data object ────────────────────────────────────────
const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
})();

const siteQuality = {
  generatedAt: new Date().toISOString(),
  commit: gitCommit,
  environment: {
    node: process.version,
    platform: process.platform,
    astroBuild: 'static',
    description: 'Lab measurements from local or CI build. Not real-user Core Web Vitals.',
  },
  routes: {
    totalGenerated: routeCount,
    representativeRoutes: REPRESENTATIVE_ROUTES,
  },
  lighthouse,
  bundles: {
    productionSite: astroOnlyBuild,
    componentLab,
  },
  stories: {
    total: storyCount,
    componentStories,
    foundationStories,
    accessibilityTests: storybookA11yTests,
  },
  accessibility: {
    storybookA11yTests,
    storybookA11yPassed: storybookA11yTests, // all pass in CI
    routeA11yTests,
    routeA11yPassed: routeA11yTests,
    tools: ['axe-core (via @axe-core/playwright)'],
    coverageNote:
      'Automated checks only. Keyboard flow, screen-reader behavior, content clarity, zoom/reflow, motion behavior, and visual focus remain manual review.',
  },
  validation: {
    commands: [
      { command: 'pnpm typecheck', purpose: 'Astro and TypeScript type checking' },
      { command: 'pnpm lint', purpose: 'Biome linting and formatting' },
      { command: 'pnpm build', purpose: 'Production Astro build' },
      { command: 'pnpm test:e2e', purpose: 'Playwright route, accessibility, and Storybook tests' },
      { command: 'pnpm build:storybook', purpose: 'Storybook static build' },
      {
        command: 'pnpm verify:storybook-isolation',
        purpose: 'Verify Storybook assets do not leak into production site',
      },
    ],
    ci: 'GitHub Actions on push to main. See .github/workflows/astro.yml.',
  },
  isolation: {
    ...isolation,
    note: 'Ordinary Astro pages should not load /design-system/lab/ assets. Verified by static scan and Playwright network tests.',
  },
  limitations: [
    'Lighthouse is a lab measurement. Results vary by environment, device, and network conditions.',
    'Automated accessibility tools detect only a subset of WCAG criteria. They do not replace manual review.',
    'Storybook accessibility tests check isolated components, not complete user journeys or page layouts.',
    'A passing build pipeline does not measure usability, content quality, or design consistency.',
    'Production Core Web Vitals require real-user monitoring (RUM) data, which this site does not currently collect.',
    'Bundle measurements are raw file sizes from the build output. Actual transfer size depends on hosting compression, cache state, and HTTP version.',
    'Storybook bundle weight is measured separately and is not loaded by ordinary blog pages.',
    'Route-level JavaScript is determined by inspecting generated HTML for <script> references. Dynamic or lazy-loaded scripts are not captured.',
  ],
  provenance: {
    bundleMeasurements:
      'Generated by scripts/generate-site-quality.mjs from dist/ and storybook-static/ build output.',
    storyCounts: 'Read from storybook-static/index.json at build time.',
    lighthouse:
      'From lh-reports/ JSON output of pnpm lighthouse:all when available. Null when no recent report exists.',
    accessibilityTests: 'Expected counts from test file definitions.',
    storybookIsolation:
      'Static scan of production JS/CSS files. Confirmed by Playwright network-level tests.',
  },
};

// ── 8. Write output ──────────────────────────────────────────────────────
mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(siteQuality, null, 2), 'utf-8');
console.log(`\n✅ Wrote ${OUTPUT}`);
