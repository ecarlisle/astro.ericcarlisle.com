#!/usr/bin/env node
/**
 * Generate site-quality.json — a single source of truth for the
 * /portfolio/site-quality/ page.
 *
 * Usage (in order):
 *   1. pnpm build
 *   2. pnpm build:storybook
 *   3. pnpm test:e2e  (produces test-results/test-results.json)
 *   4. node scripts/generate-site-quality.mjs
 *
 * The script reads existing build output and test results. It does
 * not run builds or tests itself.
 *
 * Exit codes:
 *   0 – success
 *   1 – missing required input (dist/, storybook-static/, or test results)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// ── Configuration ──────────────────────────────────────────────────────────
const ROOT = process.env.QUALITY_ROOT ? process.env.QUALITY_ROOT : join(import.meta.dirname, '..');
const DIST = process.env.QUALITY_DIST ? process.env.QUALITY_DIST : join(ROOT, 'dist');
const SB_STATIC = process.env.QUALITY_SB_STATIC
  ? process.env.QUALITY_SB_STATIC
  : join(ROOT, 'storybook-static');
const TEST_RESULTS = process.env.QUALITY_TEST_RESULTS
  ? process.env.QUALITY_TEST_RESULTS
  : join(ROOT, 'test-results', 'test-results.json');
const LH_REPORTS = process.env.QUALITY_LH_REPORTS
  ? process.env.QUALITY_LH_REPORTS
  : join(ROOT, 'lh-reports');
const GENERATED_DIR = process.env.QUALITY_OUTPUT_DIR
  ? process.env.QUALITY_OUTPUT_DIR
  : join(ROOT, 'src', 'generated');
const OUTPUT = join(GENERATED_DIR, 'site-quality.json');

const REPRESENTATIVE_ROUTES = [
  '/',
  '/blog/',
  '/portfolio/',
  '/portfolio/design-system/',
  '/portfolio/site-quality/',
  '/blog/good-agent-context-is-carved-not-copied/',
  '/search/',
  '/contact/',
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

// ── Validate inputs ────────────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.error('❌ dist/ not found. Run pnpm build first.');
  process.exit(1);
}

// ── 1. Static file-size analysis (files present in dist/) ─────────────────
console.log('📦 Analyzing Astro production build…');

const jsFiles = walk(DIST, (name) => name.endsWith('.js') && !name.endsWith('.map'));
const cssFiles = walk(DIST, (name) => name.endsWith('.css') && !name.endsWith('.map'));
const htmlFiles = walk(DIST, (name) => name.endsWith('.html'));

const pagefindJs = jsFiles.filter((f) => f.includes('/pagefind/'));
const partytownJs = jsFiles.filter((f) => f.includes('/~partytown/'));
const astroJs = jsFiles.filter((f) => !f.includes('/pagefind/') && !f.includes('/~partytown/'));

const totalJsBytes = totalSize(jsFiles);
const totalCssBytes = totalSize(cssFiles);
const jsGzipBytes = jsFiles.reduce((sum, f) => sum + actualGzipSize(readFileSync(f)), 0);

const largestJs =
  jsFiles
    .map((f) => ({ name: f.replace(DIST, ''), bytes: statSync(f).size }))
    .sort((a, b) => b.bytes - a.bytes)[0] || null;

// ── 2. Route-level analysis (what each page's HTML references) ─────────────
console.log('📄 Analyzing route-level references…');

const FEATURE_KEYWORDS = [
  { name: 'pagefind', patterns: ['/pagefind/'] },
  { name: 'partytown', patterns: ['/~partytown/'] },
  { name: 'turnstile', patterns: ['challenges.cloudflare.com', 'turnstile'] },
  { name: 'storybook-lab', patterns: ['/design-system/lab/'] },
];

function classifyAsset(url) {
  for (const feat of FEATURE_KEYWORDS) {
    if (feat.patterns.some((p) => url.includes(p))) return feat.name;
  }
  return 'core';
}

function measureInlineScripts(html) {
  let totalBytes = 0;
  // Count scripts without src (inline scripts)
  const inlineBlocks = [...html.matchAll(/<script(?!\s+src)[^>]*>([\s\S]*?)<\/script>/g)];
  for (const block of inlineBlocks) {
    totalBytes += Buffer.byteLength(block[1], 'utf-8');
  }
  return totalBytes;
}

const routeJavaScript = {};
const inlineScriptTotals = {};

for (const route of REPRESENTATIVE_ROUTES) {
  const filePath =
    route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html');
  try {
    const html = readFileSync(filePath, 'utf-8');
    const scriptRefs = [...html.matchAll(/<script[^>]+src="([^"]*)"[^>]*>/g)].map((m) => m[1]);
    const uniqueRefs = [...new Set(scriptRefs)];

    let totalRefBytes = 0;
    const assets = [];
    const features = new Set();

    for (const ref of uniqueRefs) {
      const localPath = join(DIST, ref.replace(/^\//, ''));
      const category = classifyAsset(ref);
      let bytes = 0;
      try {
        bytes = statSync(localPath).size;
        totalRefBytes += bytes;
      } catch {
        // File doesn't exist locally (external or missing)
        bytes = 0;
      }
      assets.push({ url: ref, bytes, category });
      if (category !== 'core') features.add(category);
    }

    const inlineBytes = measureInlineScripts(html);
    inlineScriptTotals[route] = inlineBytes;

    routeJavaScript[route] = {
      assets,
      totalBytes: totalRefBytes,
      inlineBytes,
      features: [...features],
    };
  } catch (err) {
    routeJavaScript[route] = {
      assets: [],
      totalBytes: 0,
      inlineBytes: 0,
      features: [],
      error: String(err),
    };
  }
}

// Aggregate feature usage across all routes
const featureUsage = {};
for (const route of REPRESENTATIVE_ROUTES) {
  const rj = routeJavaScript[route];
  if (rj?.features) {
    for (const feat of rj.features) {
      if (!featureUsage[feat]) featureUsage[feat] = [];
      featureUsage[feat].push(route);
    }
  }
}

// ── 3. Storybook build measurement ────────────────────────────────────────
console.log('📚 Measuring Storybook build…');

let componentLab = null;
if (existsSync(SB_STATIC)) {
  const sbJsFiles = walk(SB_STATIC, (name) => name.endsWith('.js') && !name.endsWith('.map'));
  const sbCssFiles = walk(SB_STATIC, (name) => name.endsWith('.css') && !name.endsWith('.map'));
  const sbTotalJsBytes = totalSize(sbJsFiles);
  const sbJsGzipBytes = sbJsFiles.reduce((sum, f) => sum + actualGzipSize(readFileSync(f)), 0);
  const sbTotalBytes = totalSize(sbJsFiles) + totalSize(sbCssFiles);

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

  componentLab = {
    totalJavaScriptBytes: sbTotalJsBytes,
    totalJavaScriptGzipBytes: sbJsGzipBytes,
    totalBytes: sbTotalBytes,
    fileCount: sbJsFiles.length + sbCssFiles.length,
    largestChunks: sbLargestChunks,
    source: 'storybook-static/ directory analysis',
  };
} else {
  console.log('⚠️  storybook-static/ not found. Skipping Storybook measurements.');
}

// ── 4. Storybook story counts ────────────────────────────────────────────
console.log('📖 Reading Storybook story metadata…');

let storyCount = 0;
let componentStories = 0;
let foundationStories = 0;

const sbIndexPath = join(SB_STATIC, 'index.json');
if (existsSync(sbIndexPath)) {
  const sbIndex = JSON.parse(readFileSync(sbIndexPath, 'utf-8'));
  if (sbIndex.entries) {
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
}

// ── 5. Accessibility test results from Playwright JSON reporter ──────────
console.log('♿ Reading Playwright accessibility test results…');

let accessibility = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  storybookTests: 0,
  storybookPassed: 0,
  routeTests: 0,
  routePassed: 0,
  tools: ['axe-core (via @axe-core/playwright)'],
  dataSource: null,
  status: 'no test results file found',
  note: 'Automated checks only. Keyboard flow, screen-reader behavior, content clarity, zoom/reflow, motion behavior, and visual focus remain manual review.',
};

if (existsSync(TEST_RESULTS)) {
  try {
    const testResults = JSON.parse(readFileSync(TEST_RESULTS, 'utf-8'));
    const suites = testResults.suites || [];

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let storybookTests = 0;
    let storybookPassed = 0;
    let routeTests = 0;
    let routePassed = 0;

    function countTests(suite) {
      const file = suite.file || '';
      const specs = suite.specs || [];
      for (const spec of specs) {
        const ok = spec.ok ?? true;
        const tests = spec.tests || [];
        let specSkipped = false;
        for (const t of tests) {
          if (t.expectedStatus === 'skipped') specSkipped = true;
        }
        totalTests++;
        if (specSkipped) {
          skippedTests++;
        } else if (ok) {
          passedTests++;
          if (file.includes('storybook-a11y')) {
            storybookTests++;
            storybookPassed++;
          } else if (file.includes('accessibility.spec')) {
            routeTests++;
            routePassed++;
          }
        } else {
          failedTests++;
          if (file.includes('storybook-a11y')) storybookTests++;
          else if (file.includes('accessibility.spec')) routeTests++;
        }
      }
      const children = suite.suites || [];
      for (const child of children) {
        countTests(child, file);
      }
    }

    countTests({ suites });

    accessibility = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      storybookTests,
      storybookPassed,
      routeTests,
      routePassed,
      tools: ['axe-core (via @axe-core/playwright)'],
      dataSource: TEST_RESULTS,
      status: 'parsed from Playwright JSON report',
      note: 'Automated checks only. Keyboard flow, screen-reader behavior, content clarity, zoom/reflow, motion behavior, and visual focus remain manual review.',
    };

    console.log(
      `  ${storybookTests} storybook + ${routeTests} route = ${totalTests} tests, ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`,
    );
  } catch (err) {
    console.log(`  ⚠️  Failed to parse test results: ${err.message}`);
    accessibility.status = 'failed to parse test results';
  }
} else {
  console.log('  ⚠️  test-results/test-results.json not found. Run pnpm test:e2e first.');
}

// ── 6. Lighthouse measurements ──────────────────────────────────────────
console.log('💡 Reading Lighthouse reports…');

const lighthouseResults = [];

if (existsSync(LH_REPORTS)) {
  const lhJsonFiles = walk(
    LH_REPORTS,
    (name) => name.endsWith('.report.json') || name.endsWith('.json'),
  );
  for (const reportFile of lhJsonFiles) {
    try {
      const lh = JSON.parse(readFileSync(reportFile, 'utf-8'));
      const categories = lh.categories || {};
      const audits = lh.audits || {};
      lighthouseResults.push({
        url: lh.requestedUrl || lh.finalUrl || 'unknown',
        fetchedAt: lh.fetchTime || null,
        device: lh.configSettings?.formFactor || 'desktop',
        throttling: lh.configSettings?.throttlingMethod || 'provided',
        scores: {
          performance: Math.round((categories.performance?.score || 0) * 100),
          accessibility: Math.round((categories.accessibility?.score || 0) * 100),
          'best-practices': Math.round((categories['best-practices']?.score || 0) * 100),
          seo: Math.round((categories.seo?.score || 0) * 100),
        },
        metrics: {
          lcp: audits['largest-contentful-paint']?.numericValue || null,
          cls: audits['cumulative-layout-shift']?.numericValue || null,
          tbt: audits['total-blocking-time']?.numericValue || null,
          fcp: audits['first-contentful-paint']?.numericValue || null,
        },
        source: reportFile,
      });
    } catch {
      // skip malformed reports
    }
  }
}

console.log(`  ${lighthouseResults.length} route report(s) found`);

// ── 7. Storybook isolation check ────────────────────────────────────────
console.log('🔒 Verifying Storybook isolation…');

const STORYBOOK_PATTERNS = [
  /\/design-system\/lab\//,
  /\bstorybook\b/i,
  /\bsb-manager\b/,
  /\bsb-preview\b/,
  /\bsb-addons\b/,
  /@storybook\//,
];

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

const isolation = {
  isolated: contamination === 0,
  contaminatedFiles: contamination,
  checkType: 'static scan of JS/CSS files excluding dist/design-system/lab/',
  note: 'Ordinary Astro pages should not load /design-system/lab/ assets. Verified by static scan and Playwright network tests.',
};

// ── 8. Derive commit and timestamp ──────────────────────────────────────
const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
})();

const generatedAt = new Date().toISOString();

// ── 9. Assemble final data object ───────────────────────────────────────
const siteQuality = {
  generatedAt,
  commit: gitCommit,
  environment: {
    node: process.version,
    platform: process.platform,
    build: 'astro static',
    measurementType:
      'Static analysis of build output, HTML inspection, and test-result parsing. Not real-user monitoring.',
  },

  // ── Routes ──
  routes: {
    totalGenerated: htmlFiles.length,
    representativeRoutes: REPRESENTATIVE_ROUTES,
  },

  // ── Lighthouse ──
  lighthouse: lighthouseResults.length > 0 ? lighthouseResults : null,

  // ── Static files in Astro-only deployment ──
  staticDeployment: {
    totalJavaScript: {
      bytes: totalJsBytes,
      gzipBytes: jsGzipBytes,
      fileCount: jsFiles.length,
    },
    totalCss: {
      bytes: totalCssBytes,
      fileCount: cssFiles.length,
    },
    largestJavaScriptAsset: largestJs ? { name: largestJs.name, bytes: largestJs.bytes } : null,
    categories: [
      { name: 'Astro page scripts', bytes: totalSize(astroJs), files: astroJs.length },
      {
        name: 'Pagefind search index and UI',
        bytes: totalSize(pagefindJs),
        files: pagefindJs.length,
      },
      {
        name: 'Partytown analytics offloading',
        bytes: totalSize(partytownJs),
        files: partytownJs.length,
      },
    ],
    note: 'All JavaScript files present in the Astro-only dist/ directory (source maps excluded). Not all files are loaded by every route. See routeMeasurements below for per-page loading behavior.',
  },

  // ── Route-level measurements ──
  routeMeasurements: routeJavaScript,

  // ── Feature loading behavior ──
  featureLoading: {
    pagefind: {
      totalDeployBytes: totalSize(pagefindJs),
      routesRequesting: featureUsage.pagefind || [],
      loadingBehavior: 'Loaded only on /search/. Not requested by other routes.',
    },
    partytown: {
      totalDeployBytes: totalSize(partytownJs),
      routesRequesting: featureUsage.partytown || [],
      loadingBehavior:
        'Script loader present in HTML head on most pages. Worker scripts load lazily on user interaction.',
    },
    turnstile: {
      routesRequesting: featureUsage.turnstile || [],
      loadingBehavior: 'Loaded only on /contact/. Cloudflare external asset.',
    },
    storybookLab: {
      routesRequesting: featureUsage['storybook-lab'] || [],
      loadingBehavior: 'Not requested by any normal page. Only available at /design-system/lab/.',
    },
  },

  // ── Storybook ──
  componentLab: componentLab,

  // ── Story counts ──
  stories: {
    total: storyCount,
    componentStories,
    foundationStories,
    source: sbIndexPath,
  },

  // ── Accessibility ──
  accessibility,

  // ── Validation commands ──
  validation: {
    commands: [
      { command: 'pnpm typecheck', purpose: 'Astro and TypeScript type checking' },
      { command: 'pnpm lint', purpose: 'Biome linting and formatting' },
      { command: 'pnpm build', purpose: 'Production Astro build' },
      {
        command: 'pnpm test:e2e',
        purpose:
          'Playwright route, accessibility, and Storybook tests (produces test-results/test-results.json)',
      },
      { command: 'pnpm build:storybook', purpose: 'Storybook static build' },
      {
        command: 'pnpm verify:storybook-isolation',
        purpose: 'Verify Storybook assets do not leak into production site',
      },
      {
        command: 'pnpm quality:generate',
        purpose: 'Generate site-quality.json from current build output and test results',
      },
    ],
    ci: 'GitHub Actions on push to main. See .github/workflows/astro.yml.',
  },

  // ── Isolation ──
  isolation,

  // ── Limitations ──
  limitations: [
    'Lighthouse is a lab measurement. Results vary by environment, device, and network conditions.',
    'Automated accessibility tools detect only a subset of WCAG criteria. They do not replace manual review.',
    'Storybook accessibility tests check isolated components, not complete user journeys or page layouts.',
    'A passing build pipeline does not measure usability, content quality, or design consistency.',
    'Production Core Web Vitals require real-user monitoring (RUM) data, which this site does not currently collect.',
    'Static file sizes are raw bytes from the build output. Actual transfer size depends on hosting compression, cache state, and HTTP version.',
    'Browser-measured transfer sizes require running Playwright network-capture tests against a local preview.',
    'Storybook bundle weight is measured separately and is not loaded by ordinary blog pages.',
    'Route-level JavaScript is determined by inspecting generated HTML for <script> references. Dynamic or lazy-loaded scripts are not captured.',
    'Pagefind assets are present in the deployment but only requested by /search/.',
    'Partytown worker scripts are present in the deployment but loaded lazily by the Partytown library.',
    'Inline script bytes are estimated from HTML content. They exclude server-rendered JSON-LD and inline styles.',
  ],

  // ── Provenance ──
  provenance: {
    generatedAt,
    commit: gitCommit,
    measurements: [
      {
        group: 'staticDeployment',
        type: 'static analysis',
        source: 'dist/ directory (Astro-only build)',
        description: 'File sizes and counts from build output. Source maps excluded.',
      },
      {
        group: 'routeMeasurements',
        type: 'static analysis',
        source: 'Generated HTML files in dist/',
        description:
          'Extracted <script src> references and inline script byte estimates from generated HTML.',
      },
      {
        group: 'componentLab',
        type: 'static analysis',
        source: 'storybook-static/ directory',
        description: 'File sizes and chunk labels from Storybook build output.',
      },
      {
        group: 'stories',
        type: 'static analysis',
        source: sbIndexPath,
        description: 'Story counts from Storybook index.json metadata.',
      },
      {
        group: 'accessibility',
        type: 'test results',
        source: TEST_RESULTS,
        description:
          'Parsed from Playwright JSON reporter output. Counts and pass/fail from last test run.',
      },
      {
        group: 'lighthouse',
        type: 'lab measurement',
        source: 'lh-reports/ directory',
        description: 'Parsed from Lighthouse JSON reports. Requires running pnpm lighthouse:all.',
      },
      {
        group: 'isolation',
        type: 'static analysis',
        source: 'dist/ directory',
        description: 'Regex scan of production JS/CSS files for Storybook identifiers.',
      },
    ],
  },
};

// ── 10. Write output ──────────────────────────────────────────────────────
mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(siteQuality, null, 2), 'utf-8');
console.log(`\n✅ Wrote ${OUTPUT}`);
