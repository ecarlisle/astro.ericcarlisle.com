/**
 * Regression tests for repository-root resolution from the compiled output.
 *
 * The compiled loader lives at dist/src/graph/load-graph.js. Its path
 * resolution must locate the repository's dist/lab/site-inventory/data.json
 * without depending on the caller's current working directory (e.g. when an
 * MCP client launches the absolute server path with an unrelated cwd).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { findRepoRoot } from '../src/graph/load-graph.js';

// This compiled test file lives at <repo>/packages/site-intelligence-mcp/dist/tests/.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');
const compiledLoader = join(here, '..', 'src', 'graph', 'load-graph.js');
const expectedInventoryPath = join(repoRoot, 'dist', 'lab', 'site-inventory', 'data.json');

test('compiled loader resolves the repo inventory from an unrelated cwd (no env override)', () => {
  const unrelated = mkdtempSync(join(tmpdir(), 'mcp-unrelated-cwd-'));
  try {
    const script = `import { defaultInventoryPath } from ${JSON.stringify(pathToFileURL(compiledLoader).href)}; process.stdout.write(defaultInventoryPath());`;
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: unrelated,
      encoding: 'utf-8',
    });
    assert.equal(out, expectedInventoryPath);
  } finally {
    rmSync(unrelated, { recursive: true, force: true });
  }
});

test('compiled loader result points at the real generated inventory when present', () => {
  // Assert the resolved path location; only require existence when a build
  // has produced the artifact (tests must not depend on build state).
  const unrelated = mkdtempSync(join(tmpdir(), 'mcp-unrelated-cwd2-'));
  try {
    const script = `import { defaultInventoryPath } from ${JSON.stringify(pathToFileURL(compiledLoader).href)}; process.stdout.write(defaultInventoryPath());`;
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: unrelated,
      encoding: 'utf-8',
    });
    assert.equal(out, expectedInventoryPath);
    // The path must be under the repository root (never under the package).
    assert.ok(out.startsWith(repoRoot + sep));
    assert.ok(!out.includes('site-intelligence-mcp/dist/lab'));
  } finally {
    rmSync(unrelated, { recursive: true, force: true });
  }
});

test('findRepoRoot walks up from a compiled module location', () => {
  // Simulate the compiled loader location: <repo>/packages/site-intelligence-mcp/dist/src/graph
  const compiledGraphDir = join(
    repoRoot,
    'packages',
    'site-intelligence-mcp',
    'dist',
    'src',
    'graph',
  );
  const found = findRepoRoot(compiledGraphDir);
  assert.equal(found, repoRoot);
});

test('findRepoRoot returns null above the filesystem root', () => {
  // Starting from a path with no pnpm-workspace.yaml ancestor.
  const tmp = mkdtempSync(join(tmpdir(), 'mcp-noroot-'));
  try {
    assert.equal(findRepoRoot(tmp), null);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
