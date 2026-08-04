#!/usr/bin/env node
/**
 * test-generate-site-quality.mjs
 *
 * Tests the generate-site-quality.mjs generator against fixture directories.
 * Exits 0 if all tests pass, 1 otherwise.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');
const GENERATOR = join(ROOT, 'scripts', 'generate-site-quality.mjs');
const FIXTURE_BASE = join(ROOT, 'tests', 'fixtures', 'site-quality-generator');

function runGenerator(cwd, env = {}) {
  try {
    execSync(`node ${GENERATOR}`, {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, ...env },
      timeout: 30000,
    });
    return { exitCode: 0, stdout: '', stderr: '' };
  } catch (e) {
    return {
      exitCode: e.status || 1,
      stdout: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || '',
    };
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function createFixtureDir(name, files) {
  const dir = join(FIXTURE_BASE, name);
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(dir, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return dir;
}

function cleanup() {
  if (existsSync(FIXTURE_BASE)) rmSync(FIXTURE_BASE, { recursive: true });
}

// ── Fixture factories ──────────────────────────────────────────────────────

function minimalAstroBuild() {
  return {
    'dist/_astro/page.DGY5I_Vn.js': 'console.log("page script");',
    'dist/_astro/page.DGY5I_Vn.js.map': '{}',
    'dist/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/blog/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/portfolio/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/portfolio/design-system/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/portfolio/site-quality/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/blog/better-agent-results-start-with-better-context/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/search/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
    'dist/contact/index.html': `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script></body></html>`,
  };
}

function minimalStorybookBuild() {
  return {
    'storybook-static/index.json': JSON.stringify({
      entries: {
        'components-card--default': {},
        'navigation-header--default': {},
        'foundations-colors--default': {},
      },
    }),
    'storybook-static/sb-manager/runtime.js': 'console.log("manager");',
    'storybook-static/sb-preview/runtime.js': 'console.log("preview");',
  };
}

function testResultsFixture(_totalTests = 34, _failed = 0, _skipped = 0) {
  const storybookSpecs = [];
  // 27 storybook tests
  for (let i = 0; i < 27; i++) {
    storybookSpecs.push({
      file: 'tests/storybook-a11y.spec.ts',
      title: `Storybook a11y: Test ${i}`,
      ok: true,
      tests: [{ expectedStatus: 'passed' }],
    });
  }
  // 7 route tests
  const routeSpecs = [];
  for (let i = 0; i < 7; i++) {
    routeSpecs.push({
      file: 'tests/accessibility.spec.ts',
      title: `Route a11y: Test ${i}`,
      ok: true,
      tests: [{ expectedStatus: 'passed' }],
    });
  }
  return {
    'test-results/test-results.json': JSON.stringify({
      suites: [
        { specs: storybookSpecs, file: 'tests/storybook-a11y.spec.ts' },
        { specs: routeSpecs, file: 'tests/accessibility.spec.ts' },
      ],
    }),
  };
}

function lighthouseReportsFixture() {
  return {
    'lh-reports/index.report.json': JSON.stringify({
      requestedUrl: 'http://localhost:4321/',
      finalUrl: 'http://localhost:4321/',
      fetchTime: new Date().toISOString(),
      configSettings: { formFactor: 'desktop', throttlingMethod: 'provided' },
      categories: {
        performance: { score: 0.98 },
        accessibility: { score: 1.0 },
        'best-practices': { score: 0.98 },
        seo: { score: 1.0 },
      },
      audits: {
        'largest-contentful-paint': { numericValue: 1200 },
        'cumulative-layout-shift': { numericValue: 0.01 },
        'total-blocking-time': { numericValue: 50 },
        'first-contentful-paint': { numericValue: 800 },
      },
    }),
  };
}

function contaminatedProductionBuild() {
  const files = minimalAstroBuild();
  files['dist/_astro/contaminated.js'] = 'import { render } from "storybook/internal";';
  return files;
}

// ── Tests ──────────────────────────────────────────────────────────────────

const tests = [];

// Test 1: Required top-level fields are generated
tests.push({
  name: 'generates required top-level fields',
  setup: () =>
    createFixtureDir('required-fields', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    const required = [
      'generatedAt',
      'commit',
      'environment',
      'routes',
      'staticDeployment',
      'routeMeasurements',
      'componentLab',
      'stories',
      'accessibility',
      'validation',
      'isolation',
      'limitations',
      'provenance',
    ];
    for (const field of required) {
      if (!(field in output)) throw new Error(`Missing required field: ${field}`);
    }
  },
});

// Test 2: Story counts read from storybook-static/index.json
tests.push({
  name: 'reads story counts from Storybook metadata',
  setup: () =>
    createFixtureDir('story-counts', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (output.stories.total !== 3)
      throw new Error(`Expected 3 total stories, got ${output.stories.total}`);
    if (output.stories.componentStories !== 2)
      throw new Error(`Expected 2 component stories, got ${output.stories.componentStories}`);
    if (output.stories.foundationStories !== 1)
      throw new Error(`Expected 1 foundation story, got ${output.stories.foundationStories}`);
  },
});

// Test 3: Source maps excluded from file counts
tests.push({
  name: 'excludes source maps from file counts',
  setup: () => {
    const dir = createFixtureDir('no-sourcemaps', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    });
    writeFileSync(join(dir, 'dist/_astro/extra.js.map'), '{}');
    writeFileSync(join(dir, 'dist/_astro/another.js.map'), '{}');
    return dir;
  },
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (output.staticDeployment.totalJavaScript.fileCount !== 1) {
      throw new Error(
        `Expected 1 JS file (no source maps), got ${output.staticDeployment.totalJavaScript.fileCount}`,
      );
    }
  },
});

// Test 4: Missing dist/ fails with clear message
tests.push({
  name: 'fails with clear message when dist/ missing',
  setup: () =>
    createFixtureDir('missing-dist', {
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'), // doesn't exist
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result) => {
    if (result.exitCode === 0) throw new Error('Expected generator to fail when dist/ missing');
    if (!result.stderr.includes('dist/ not found'))
      throw new Error(`Expected "dist/ not found" error, got: ${result.stderr}`);
  },
});

// Test 5: Malformed Lighthouse JSON is skipped gracefully
tests.push({
  name: 'handles malformed Lighthouse JSON gracefully',
  setup: () =>
    createFixtureDir('bad-lighthouse', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      'lh-reports/bad.report.json': '{ not valid json',
      'lh-reports/good.report.json': JSON.stringify({
        requestedUrl: 'http://localhost:4321/',
        finalUrl: 'http://localhost:4321/',
        fetchTime: new Date().toISOString(),
        configSettings: { formFactor: 'desktop', throttlingMethod: 'provided' },
        categories: {
          performance: { score: 0.9 },
          accessibility: { score: 1.0 },
          'best-practices': { score: 0.95 },
          seo: { score: 1.0 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 1500 },
          'cumulative-layout-shift': { numericValue: 0.02 },
          'total-blocking-time': { numericValue: 100 },
          'first-contentful-paint': { numericValue: 1000 },
        },
      }),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0)
      throw new Error(`Generator should not crash on malformed JSON: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (!output.lighthouse || output.lighthouse.length === 0)
      throw new Error('Expected at least one valid Lighthouse report to be parsed');
  },
});

// Test 6: Missing Lighthouse data represented honestly (null)
tests.push({
  name: 'represents missing Lighthouse data as null',
  setup: () =>
    createFixtureDir('no-lighthouse', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'), // doesn't exist
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (output.lighthouse !== null)
      throw new Error(`Expected lighthouse: null, got ${JSON.stringify(output.lighthouse)}`);
  },
});

// Test 7: Route-level asset references derived from generated HTML
tests.push({
  name: 'derives route-level asset references from HTML',
  setup: () => {
    const dir = createFixtureDir('route-assets', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    });
    writeFileSync(
      join(dir, 'dist/search/index.html'),
      `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script><script src="/pagefind/pagefind.js"></script></body></html>`,
    );
    return dir;
  },
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    const searchRoute = output.routeMeasurements['/search/'];
    if (!searchRoute) throw new Error('Missing /search/ route measurement');
    const hasPagefind = searchRoute.assets.some((a) => a.url.includes('pagefind'));
    if (!hasPagefind) throw new Error('Expected /search/ to reference pagefind asset');
  },
});

// Test 8: Storybook leakage into production route causes isolation check to fail
tests.push({
  name: 'detects Storybook leakage in production assets',
  setup: () =>
    createFixtureDir('storybook-leak', {
      ...contaminatedProductionBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (output.isolation.isolated !== false)
      throw new Error(
        'Expected isolation.isolated = false when Storybook refs found in production JS',
      );
    if (output.isolation.contaminatedFiles < 1)
      throw new Error('Expected at least 1 contaminated file');
  },
});

// Test 9: Generated timestamp and commit provenance present
tests.push({
  name: 'includes generated timestamp and commit provenance',
  setup: () =>
    createFixtureDir('provenance', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (!output.generatedAt || !output.commit) throw new Error('Missing generatedAt or commit');
    if (!output.provenance?.measurements || output.provenance.measurements.length === 0)
      throw new Error('Missing provenance measurements');
    for (const m of output.provenance.measurements) {
      if (!m.group || !m.type || !m.source || !m.description)
        throw new Error(`Incomplete provenance entry: ${JSON.stringify(m)}`);
    }
  },
});

// Test 10: Accessibility counts derived from Playwright JSON (not hardcoded)
tests.push({
  name: 'accessibility counts derived from Playwright JSON results',
  setup: () =>
    createFixtureDir('a11y-counts', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(34, 0, 0),
      ...lighthouseReportsFixture(),
    }),
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (output.accessibility.totalTests !== 34)
      throw new Error(
        `Expected 34 total tests (27 storybook + 7 route), got ${output.accessibility.totalTests}`,
      );
    if (output.accessibility.storybookTests !== 27)
      throw new Error(`Expected 27 storybook tests, got ${output.accessibility.storybookTests}`);
    if (output.accessibility.routeTests !== 7)
      throw new Error(`Expected 7 route tests, got ${output.accessibility.routeTests}`);
    if (output.accessibility.status !== 'parsed from Playwright JSON report')
      throw new Error(`Expected parsed status, got ${output.accessibility.status}`);
  },
});

// Test 11: Feature loading behavior correctly identified
tests.push({
  name: 'identifies Pagefind/Partytown/Turnstile loading behavior per route',
  setup: () => {
    const dir = createFixtureDir('feature-loading', {
      ...minimalAstroBuild(),
      ...minimalStorybookBuild(),
      ...testResultsFixture(),
      ...lighthouseReportsFixture(),
    });
    // Add pagefind to search route
    writeFileSync(
      join(dir, 'dist/search/index.html'),
      `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script><script src="/pagefind/pagefind.js"></script></body></html>`,
    );
    // Add turnstile to contact route
    writeFileSync(
      join(dir, 'dist/contact/index.html'),
      `<html><head></head><body><script src="/_astro/page.DGY5I_Vn.js"></script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script></body></html>`,
    );
    // Add partytown to all routes
    const routes = [
      '/',
      '/blog/',
      '/portfolio/',
      '/portfolio/design-system/',
      '/portfolio/site-quality/',
      '/blog/better-agent-results-start-with-better-context/',
      '/search/',
      '/contact/',
    ];
    for (const route of routes) {
      const path = route === '/' ? 'dist/index.html' : `dist${route}index.html`;
      const html = readFileSync(join(dir, path), 'utf-8');
      writeFileSync(
        join(dir, path),
        html.replace(
          '<head></head>',
          '<head><script src="/~partytown/partytown.js"></script></head>',
        ),
      );
    }
    return dir;
  },
  run: (dir) =>
    runGenerator(dir, {
      QUALITY_ROOT: dir,
      QUALITY_DIST: join(dir, 'dist'),
      QUALITY_SB_STATIC: join(dir, 'storybook-static'),
      QUALITY_TEST_RESULTS: join(dir, 'test-results', 'test-results.json'),
      QUALITY_LH_REPORTS: join(dir, 'lh-reports'),
      QUALITY_OUTPUT_DIR: join(dir, 'output'),
    }),
  assert: (result, dir) => {
    if (result.exitCode !== 0) throw new Error(`Generator failed: ${result.stderr}`);
    const output = readJson(join(dir, 'output', 'site-quality.json'));
    if (!output.featureLoading.pagefind.routesRequesting.includes('/search/'))
      throw new Error('Pagefind should be requested on /search/');
    if (output.featureLoading.pagefind.routesRequesting.length !== 1)
      throw new Error('Pagefind should only be on one route');
    if (!output.featureLoading.turnstile.routesRequesting.includes('/contact/'))
      throw new Error('Turnstile should be requested on /contact/');
    if (output.featureLoading.partytown.routesRequesting.length < 2)
      throw new Error('Partytown should be on multiple routes');
    if (output.featureLoading.storybookLab.routesRequesting.length !== 0)
      throw new Error('Storybook lab should not be requested by normal routes');
  },
});

// ── Run all tests ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

cleanup();

for (const test of tests) {
  let dir;
  try {
    dir = test.setup();
    const result = test.run(dir);
    test.assert(result, dir);
    console.log(`\x1b[32m✓\x1b[0m ${test.name}`);
    passed++;
  } catch (e) {
    console.log(`\x1b[31m✖\x1b[0m ${test.name}: ${e.message}`);
    failed++;
  } finally {
    if (dir) cleanup();
  }
}

cleanup();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
