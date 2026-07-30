#!/usr/bin/env node
/**
 * Test page quality build output.
 *
 * Runs an absent-score build (no lighthouse-scores.json) and a present-score
 * build (deterministic fixture), then asserts the generated HTML.
 *
 * Runs entirely outside Playwright — no browser, no workers.
 *
 * Usage:
 *   node scripts/test-page-quality-build.mjs
 *
 * Exit codes:
 *   0 – all assertions pass
 *   1 – any assertion fails
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = join(import.meta.dirname, '..');
const DIST_HTML = join(ROOT, 'dist', 'index.html');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function build(scoresPath) {
  const prev = process.env.LIGHTHOUSE_SCORES_PATH;
  process.env.LIGHTHOUSE_SCORES_PATH = scoresPath;
  try {
    execSync('pnpm build', { cwd: ROOT, stdio: 'pipe', timeout: 120_000 });
  } finally {
    if (prev === undefined) delete process.env.LIGHTHOUSE_SCORES_PATH;
    else process.env.LIGHTHOUSE_SCORES_PATH = prev;
  }
}

let globalTempDir = null;
function cleanup() {
  if (globalTempDir) {
    try {
      rmSync(globalTempDir, { recursive: true, force: true });
    } catch {}
    globalTempDir = null;
  }
}

try {
  // ── Absent-score build ──────────────────────────────────────────────────
  console.log('1. Building with absent scores…');
  globalTempDir = mkdtempSync(join(tmpdir(), 'lh-absent-'));
  const absentPath = join(globalTempDir, 'nonexistent-scores.json');
  // Deliberately do NOT create this file — we need a guaranteed-absent path.
  build(absentPath);

  if (!existsSync(DIST_HTML)) fail('dist/index.html not found after build');
  const absentHtml = readFileSync(DIST_HTML, 'utf-8');
  if (absentHtml.includes('page-quality-footer')) {
    fail('Absent build should not contain page-quality-footer');
  }
  console.log('   ✓ No quality footer when scores absent.');

  // Clean up absent-fixture temp dir before starting present build
  cleanup();

  // ── Present-score build ─────────────────────────────────────────────────
  console.log('2. Building with deterministic fixture…');
  globalTempDir = mkdtempSync(join(tmpdir(), 'lh-present-'));
  const fixturePath = join(globalTempDir, 'scores.json');
  const fixture = {
    generatedAt: 't',
    commitSha: 't',
    lighthouseVersion: '13.4.0',
    pages: [
      {
        route: '/',
        scores: { performance: 84, accessibility: 100, bestPractices: 96, seo: 100 },
        timestamp: null,
        lighthouseVersion: null,
        formFactor: 'mobile',
      },
    ],
  };
  writeFileSync(fixturePath, JSON.stringify(fixture), 'utf-8');
  build(fixturePath);

  const presentHtml = readFileSync(DIST_HTML, 'utf-8');

  const checks = [
    ['page-quality-footer', presentHtml.includes('page-quality-footer')],
    ['Page quality label', presentHtml.includes('Page quality:')],
    ['Performance label', presentHtml.includes('Performance')],
    ['Accessibility label', presentHtml.includes('Accessibility')],
    ['Best practices label', presentHtml.includes('Best practices')],
    ['SEO label', presentHtml.includes('SEO')],
    ['Expected scores', presentHtml.includes('class="page-quality-score"')],
    ['No null text', !presentHtml.includes('>null<')],
  ];

  let pass = true;
  for (const [label, ok] of checks) {
    if (!ok) {
      console.error(`   ✗ ${label} not found in present build`);
      pass = false;
    }
  }
  if (!pass) fail('Present-score build missing expected footer content');
  console.log('   ✓ Quality footer present with expected labels and values.');

  console.log('\n✅ All page-quality build assertions pass.');
} finally {
  cleanup();
}
