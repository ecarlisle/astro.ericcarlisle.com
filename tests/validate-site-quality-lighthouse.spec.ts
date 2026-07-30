/**
 * Unit tests for scripts/validate-site-quality-lighthouse.mjs.
 *
 * Tests the exit code and error message patterns by running the validator
 * against temporary fixture files via the SITE_QUALITY_PATH env var.
 * Does not modify the real generated data.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const VALIDATOR = join(
  import.meta.dirname,
  '..',
  'scripts',
  'validate-site-quality-lighthouse.mjs',
);
const REAL_DATA = join(import.meta.dirname, '..', 'src', 'generated', 'site-quality.json');

/**
 * Run the validator against a fixture file.
 * Writes content to a temp file and points the validator at it via
 * the SITE_QUALITY_PATH environment variable.
 */
function runValidator(content: string | null): { code: number; stderr: string } {
  const tmpDir = mkdtempSync(join(tmpdir(), 'lh-sq-test-'));
  const fixturePath = join(tmpDir, 'site-quality.json');

  if (content !== null) {
    writeFileSync(fixturePath, content, 'utf-8');
  }

  try {
    execSync(`node "${VALIDATOR}"`, {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
      env: {
        ...process.env,
        SITE_QUALITY_PATH: content !== null ? fixturePath : join(tmpDir, 'nonexistent.json'),
      },
    });
    rmSync(tmpDir, { recursive: true, force: true });
    return { code: 0, stderr: '' };
  } catch (err: unknown) {
    rmSync(tmpDir, { recursive: true, force: true });
    const e = err as { status?: number; stderr?: Buffer | string; message?: string };
    const text =
      typeof e.stderr === 'string' ? e.stderr : e.stderr ? e.stderr.toString() : (e.message ?? '');
    return { code: e.status ?? 1, stderr: text };
  }
}

// ─── Precondition ──────────────────────────────────────────────────────────

test('real site-quality.json exists for comparison', () => {
  expect(existsSync(REAL_DATA)).toBe(true);
});

// ─── Failure cases ─────────────────────────────────────────────────────────

test('fails when file is missing', () => {
  const r = runValidator(null);
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('not found');
});

test('fails on invalid JSON', () => {
  const r = runValidator('{ invalid json }');
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('not valid JSON');
});

test('fails when lighthouse is null', () => {
  const r = runValidator(JSON.stringify({ lighthouse: null }));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('null');
});

test('fails when lighthouse is missing', () => {
  const r = runValidator(JSON.stringify({}));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('no "lighthouse" property');
});

test('fails when lighthouse is empty array', () => {
  const r = runValidator(JSON.stringify({ lighthouse: [] }));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('empty array');
});

test('fails when lighthouse is not an array', () => {
  const r = runValidator(JSON.stringify({ lighthouse: 'string-value' }));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('not an array');
});

test('fails when lighthouse entry has no url', () => {
  const r = runValidator(JSON.stringify({ lighthouse: [{ scores: { performance: 85 } }] }));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('url');
});

test('fails when lighthouse entry has no scores', () => {
  const r = runValidator(JSON.stringify({ lighthouse: [{ url: '/test/' }] }));
  expect(r.code).not.toBe(0);
  expect(r.stderr).toContain('scores');
});

// ─── Success cases ─────────────────────────────────────────────────────────

test('succeeds with valid non-empty lighthouse array', () => {
  const r = runValidator(
    JSON.stringify({
      lighthouse: [
        {
          url: '/',
          fetchedAt: '2026-07-20T04:31:16.791Z',
          device: 'mobile',
          scores: { performance: 84, accessibility: 100, 'best-practices': 96, seo: 100 },
        },
      ],
    }),
  );
  expect(r.code).toBe(0);
});

test('succeeds with multiple valid lighthouse entries', () => {
  const r = runValidator(
    JSON.stringify({
      lighthouse: [
        {
          url: '/',
          scores: { performance: 84, accessibility: 100, 'best-practices': 96, seo: 100 },
        },
        {
          url: '/about/',
          scores: { performance: 88, accessibility: 100, 'best-practices': 96, seo: 100 },
        },
      ],
    }),
  );
  expect(r.code).toBe(0);
});

test('succeeds against a copy of the real generated data', () => {
  const realContent = readFileSync(REAL_DATA, 'utf-8');
  const r = runValidator(realContent);
  expect(r.code).toBe(0);
});
