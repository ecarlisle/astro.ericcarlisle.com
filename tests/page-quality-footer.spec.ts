/**
 * Page quality footer tests.
 *
 * All tests use deterministic fixture data injected via environment
 * variables. No conditional skips, early returns, or expect(true).
 * The real generated file is never read, overwritten, or deleted.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import type { LighthouseScoresFile } from '../src/lib/lighthouse-utils';
import {
  extractScores,
  findPageData,
  hasAnyScore,
  normalizeReportUrl,
  normalizeRoute,
  selectRepresentative,
} from '../src/lib/lighthouse-utils';

const REPO_ROOT = join(import.meta.dirname, '..');
const FIXTURE_PATH = join(import.meta.dirname, 'fixtures', 'lighthouse-index.json');

// ── Fixture helpers ────────────────────────────────────────────────────────

const VALID_FIXTURE: LighthouseScoresFile = {
  generatedAt: '2026-07-29T12:00:00.000Z',
  commitSha: 'test',
  lighthouseVersion: '13.4.0',
  pages: [
    {
      route: '/',
      scores: { performance: 84, accessibility: 100, bestPractices: 96, seo: 100 },
      timestamp: '2026-07-29T12:00:00.000Z',
      lighthouseVersion: '13.4.0',
      formFactor: 'mobile',
    },
    {
      route: '/about/',
      scores: { performance: 88, accessibility: 100, bestPractices: 96, seo: 100 },
      timestamp: null,
      lighthouseVersion: null,
      formFactor: 'mobile',
    },
    {
      route: '/blog/250mm-trading-card-box/',
      scores: { performance: 85, accessibility: 100, bestPractices: 96, seo: 100 },
      timestamp: null,
      lighthouseVersion: null,
      formFactor: 'mobile',
    },
  ],
};

const NULL_FIXTURE: LighthouseScoresFile = {
  generatedAt: '2026-07-29T12:00:00.000Z',
  commitSha: 'test',
  lighthouseVersion: '13.4.0',
  pages: [
    {
      route: '/',
      scores: { performance: null, accessibility: 100, bestPractices: 96, seo: 100 },
      timestamp: null,
      lighthouseVersion: null,
      formFactor: 'mobile',
    },
  ],
};

/** Run pnpm build with a specific LIGHTHOUSE_SCORES_PATH. */
function buildWithScores(scoresPath: string): void {
  // Set the env var via process.env directly before spawning the build,
  // then restore it after. This is the most reliable cross-platform method.
  const prev = process.env.LIGHTHOUSE_SCORES_PATH;
  process.env.LIGHTHOUSE_SCORES_PATH = scoresPath;
  try {
    execSync('pnpm build', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60_000,
    });
  } finally {
    if (prev === undefined) {
      delete process.env.LIGHTHOUSE_SCORES_PATH;
    } else {
      process.env.LIGHTHOUSE_SCORES_PATH = prev;
    }
  }
}

// ─── Score extraction ─────────────────────────────────────────────────────

test('extracts valid category scores from Lighthouse JSON fixture', () => {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));
  const scores = extractScores(raw.categories);
  expect(scores.performance).toBe(84);
  expect(scores.accessibility).toBe(100);
  expect(scores.bestPractices).toBe(96);
  expect(scores.seo).toBe(100);
});

test('extractScores returns null for null category score', () => {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));
  fixture.categories.performance.score = null;
  expect(extractScores(fixture.categories).performance).toBeNull();
});

test('extractScores returns null for missing category', () => {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));
  delete fixture.categories.performance;
  expect(extractScores(fixture.categories).performance).toBeNull();
});

test('extractScores returns all null for undefined categories', () => {
  const s = extractScores(undefined);
  expect(s.performance).toBeNull();
  expect(s.accessibility).toBeNull();
  expect(s.bestPractices).toBeNull();
  expect(s.seo).toBeNull();
});

test('hasAnyScore false when all null', () => {
  expect(
    hasAnyScore({ performance: null, accessibility: null, bestPractices: null, seo: null }),
  ).toBe(false);
});

test('hasAnyScore true when one present', () => {
  expect(
    hasAnyScore({ performance: 80, accessibility: null, bestPractices: null, seo: null }),
  ).toBe(true);
});

// ─── Route normalization ─────────────────────────────────────────────────

test('normalizeRoute: /', () => expect(normalizeRoute('/')).toBe('/'));
test('normalizeRoute: trailing slash preserved', () =>
  expect(normalizeRoute('/about/')).toBe('/about/'));
test('normalizeRoute: missing slash added', () => expect(normalizeRoute('/about')).toBe('/about/'));
test('normalizeRoute: index.html stripped', () =>
  expect(normalizeRoute('/about/index.html')).toBe('/about/'));
test('normalizeRoute: nested', () =>
  expect(normalizeRoute('/blog/my-post/')).toBe('/blog/my-post/'));
test('normalizeRoute: 404.html', () => expect(normalizeRoute('/404.html')).toBe('/404.html/'));
test('normalizeReportUrl: full URL', () =>
  expect(normalizeReportUrl('http://localhost:4321/about/')).toBe('/about/'));
test('normalizeReportUrl: index.html', () =>
  expect(normalizeReportUrl('http://localhost:4321/about/index.html')).toBe('/about/'));
test('normalizeReportUrl: invalid', () => expect(normalizeReportUrl('not-a-url')).toBeNull());

// ─── Score lookup ────────────────────────────────────────────────────────

test('findPageData exact match', () => {
  const page = findPageData(VALID_FIXTURE, '/');
  expect(page?.scores.performance).toBe(84);
});

test('findPageData matches despite missing trailing slash', () => {
  expect(findPageData(VALID_FIXTURE, '/about')?.scores.performance).toBe(88);
});

test('findPageData returns null for unmatched route', () => {
  expect(findPageData(VALID_FIXTURE, '/nonexistent/')).toBeNull();
});

test('findPageData returns null for empty pages', () => {
  expect(findPageData({ ...VALID_FIXTURE, pages: [] }, '/')).toBeNull();
});

// ─── Representative-run selection ────────────────────────────────────────

const mkEntry = (perf: number, file: string) => ({
  route: '/' as const,
  scores: { performance: perf, accessibility: 100, bestPractices: 96, seo: 100 },
  timestamp: null as string | null,
  lighthouseVersion: null as string | null,
  formFactor: 'mobile' as const,
  _file: file,
});

test('selectRepresentative: odd count picks middle', () => {
  const r = selectRepresentative([mkEntry(80, 'a'), mkEntry(90, 'b'), mkEntry(85, 'c')]);
  expect(r.scores.performance).toBe(85);
});

test('selectRepresentative: even 4 picks upper-middle (index 2)', () => {
  // Sorted: 75(a), 80(d), 85(c), 95(b) → floor(4/2)=2 → index 2 = 85(c)
  const r = selectRepresentative([
    mkEntry(75, 'a'),
    mkEntry(95, 'b'),
    mkEntry(85, 'c'),
    mkEntry(80, 'd'),
  ]);
  expect(r.scores.performance).toBe(85);
});

test('selectRepresentative: filename tie-breaking picks median by filename', () => {
  // Three entries with same Performance score.
  // Sorted by filename: a.json (99), m.json (92), z.json (90).
  // floor(3/2) = 1 -> index 1 -> m.json with accessibility=92.
  const entries = [
    {
      route: '/' as const,
      scores: { performance: 80, accessibility: 90, bestPractices: 85, seo: 95 },
      timestamp: null as string | null,
      lighthouseVersion: null as string | null,
      formFactor: 'mobile' as const,
      _file: 'z.json',
    },
    {
      route: '/' as const,
      scores: { performance: 80, accessibility: 92, bestPractices: 95, seo: 97 },
      timestamp: null as string | null,
      lighthouseVersion: null as string | null,
      formFactor: 'mobile' as const,
      _file: 'm.json',
    },
    {
      route: '/' as const,
      scores: { performance: 80, accessibility: 99, bestPractices: 99, seo: 99 },
      timestamp: null as string | null,
      lighthouseVersion: null as string | null,
      formFactor: 'mobile' as const,
      _file: 'a.json',
    },
  ];
  const r = selectRepresentative(entries);
  expect(r.scores.accessibility).toBe(92);
});

test('selectRepresentative: strips _file', () => {
  const r = selectRepresentative([mkEntry(80, 'x')]);
  expect(r).not.toHaveProperty('_file');
});

// ─── Score-absent build ──────────────────────────────────────────────────

test('build with absent and present scores produces correct output', async () => {
  // Absent: build with nonexistent path
  const nonePath = join(tmpdir(), 'lh-scores-none.json');
  buildWithScores(nonePath);
  let html = readFileSync(join(REPO_ROOT, 'dist', 'index.html'), 'utf-8');
  expect(html).not.toContain('page-quality-footer');
  expect(html).toContain('Eric Carlisle');

  // Present: build with fixture
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-pres-test-'));
  const fixturePath = join(tmpDir, 'scores.json');
  writeFileSync(fixturePath, JSON.stringify(VALID_FIXTURE), 'utf-8');
  buildWithScores(fixturePath);
  rmSync(tmpDir, { recursive: true, force: true });

  html = readFileSync(join(REPO_ROOT, 'dist', 'index.html'), 'utf-8');
  expect(html).toContain('page-quality-footer');
  expect(html).toContain('Page quality:');
  // Verify exact fixture values appear
  expect(html).toContain('Performance');
  expect(html).toContain('Accessibility');
  expect(html).toContain('Best practices');
  expect(html).toContain('SEO');
  expect(html).toContain('class="page-quality-score"');
});

// ─── Rendering via served build ──────────────────────────────────────────

// ─── Generator integration tests ─────────────────────────────────────────

function runGenerator(opts: {
  lhReportsDir: string;
  outputDir: string;
  env?: Record<string, string>;
}): { exitCode: number; stderr: string } {
  try {
    const r = execSync('node scripts/generate-lighthouse-scores.mjs', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15_000,
      env: {
        ...process.env,
        LH_REPORTS_DIR: opts.lhReportsDir,
        GENERATED_SCORES_DIR: opts.outputDir,
        ...opts.env,
      },
    });
    return { exitCode: 0, stderr: '' };
  } catch (e: unknown) {
    const err = e as { status?: number; stderr?: string | Buffer; message?: string };
    return {
      exitCode: err.status ?? 1,
      stderr:
        typeof err.stderr === 'string'
          ? err.stderr
          : err.stderr
            ? err.stderr.toString()
            : (err.message ?? ''),
    };
  }
}

/** Create a minimal Lighthouse JSON report in a temp lh-reports directory. */
function writeLhReport(
  reportsDir: string,
  filename: string,
  overrides: Record<string, unknown> = {},
): void {
  const report = {
    lighthouseVersion: '13.4.0',
    requestedUrl: 'http://localhost:4321/',
    finalUrl: 'http://localhost:4321/',
    fetchTime: '2026-07-29T12:00:00.000Z',
    configSettings: { formFactor: 'mobile' },
    categories: {
      performance: { score: 0.84 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 0.96 },
      seo: { score: 1.0 },
    },
    ...overrides,
  };
  writeFileSync(join(reportsDir, filename), JSON.stringify(report), 'utf-8');
}

test('generator writes scores for valid .report.json', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-gen-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  writeLhReport(reportsDir, 'index.report.json', {
    requestedUrl: 'http://localhost:4321/',
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);

  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages).toHaveLength(1);
  expect(out.pages[0].route).toBe('/');
  expect(out.pages[0].scores.performance).toBe(84);
  expect(out.pages[0].scores.accessibility).toBe(100);

  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator prefers .report.json over other .json', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-pref-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  // Both exist — generator should prefer .report.json
  writeLhReport(reportsDir, 'index.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.9 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'index.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.5 },
      accessibility: { score: 0.5 },
      'best-practices': { score: 0.5 },
      seo: { score: 0.5 },
    },
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);

  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages[0].scores.performance).toBe(90);
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator falls back to plain .json when no .report.json exists', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-fb-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  writeLhReport(reportsDir, 'index.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.75 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);

  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages[0].scores.performance).toBe(75);
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator selects median by Performance, filename tie-break', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-med-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  // Three reports: P=80, P=90, P=85 — median is 85
  writeLhReport(reportsDir, 'a.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.8 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'b.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.9 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'c.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);

  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages[0].scores.performance).toBe(85);
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator skips malformed reports', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-mal-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  // Valid report
  writeLhReport(reportsDir, 'good.report.json', {
    requestedUrl: 'http://localhost:4321/about/',
  });

  // Invalid JSON
  writeFileSync(join(reportsDir, 'bad.report.json'), 'not json', 'utf-8');

  // Missing URL — both requestedUrl and finalUrl are undefined
  writeLhReport(reportsDir, 'nourl.report.json', { requestedUrl: undefined, finalUrl: undefined });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);
  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages).toHaveLength(1);
  expect(out.pages[0].route).toBe('/about/');
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator handles empty reports directory', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-empty-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);
  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages).toHaveLength(0);
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator output is sorted by route deterministically', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-sort-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  writeLhReport(reportsDir, 'z.report.json', {
    requestedUrl: 'http://localhost:4321/zzz/',
    categories: {
      performance: { score: 0.8 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'a.report.json', {
    requestedUrl: 'http://localhost:4321/aaa/',
    categories: {
      performance: { score: 0.9 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'm.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);
  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  const routes = out.pages.map((p: { route: string }) => p.route);
  expect(routes).toEqual(['/', '/aaa/', '/zzz/']);
  rmSync(tmpDir, { recursive: true, force: true });
});

test('generator even-count picks upper-middle (index 2 of 4)', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-even-'));
  const reportsDir = join(tmpDir, 'lh-reports');
  const outputDir = join(tmpDir, 'output');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  // Sorted by Performance: 75(a), 80(d), 85(c), 95(b) → floor(4/2)=2 → index 2 (85)
  writeLhReport(reportsDir, 'a.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.75 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'b.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.95 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'c.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });
  writeLhReport(reportsDir, 'd.report.json', {
    requestedUrl: 'http://localhost:4321/',
    categories: {
      performance: { score: 0.8 },
      accessibility: { score: 1.0 },
      'best-practices': { score: 1.0 },
      seo: { score: 1.0 },
    },
  });

  const r = runGenerator({ lhReportsDir: reportsDir, outputDir });
  expect(r.exitCode).toBe(0);
  const out = JSON.parse(readFileSync(join(outputDir, 'lighthouse-scores.json'), 'utf-8'));
  expect(out.pages[0].scores.performance).toBe(85);
  rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Validator tests ─────────────────────────────────────────────────────

test('validate-lighthouse-scores.mjs fails when file missing', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-val-'));
  try {
    execSync('node scripts/validate-lighthouse-scores.mjs', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
      env: { ...process.env, DATA_PATH: join(tmpDir, 'nonexistent.json') },
    });
    throw new Error('Expected validator to fail but it succeeded');
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    // Validator should exit non-zero (file missing). If it succeeded,
    // the throw above will be caught here and re-thrown.
    if (err.status === undefined && err.message?.includes('Expected validator')) {
      throw e;
    }
    expect(err.status).not.toBe(0);
  }
  rmSync(tmpDir, { recursive: true, force: true });
});

test('validate-lighthouse-scores.mjs fails when pages empty', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-val2-'));
  const dataPath = join(tmpDir, 'scores.json');
  writeFileSync(
    dataPath,
    JSON.stringify({ pages: [], generatedAt: 't', commitSha: 't', lighthouseVersion: null }),
    'utf-8',
  );
  try {
    execSync('node scripts/validate-lighthouse-scores.mjs', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
      env: { ...process.env, DATA_PATH: dataPath },
    });
    throw new Error('Expected validator to fail but it succeeded');
  } catch (e: unknown) {
    const err = e as { status?: number; stderr?: string | Buffer; message?: string };
    if (
      err.status === undefined &&
      (err as { message?: string }).message?.includes('Expected validator')
    ) {
      throw e;
    }
    expect(err.status).not.toBe(0);
    const errText =
      typeof err.stderr === 'string' ? err.stderr : err.stderr ? err.stderr.toString() : '';
    expect(errText).toContain('empty');
  }
  rmSync(tmpDir, { recursive: true, force: true });
});
