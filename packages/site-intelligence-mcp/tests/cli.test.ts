/**
 * End-to-end tests for the site-intelligence call CLI.
 *
 * These run against the compiled CLI and server (dist/), which the package
 * `test` script builds first. The CLI spawns the real server over stdio and
 * talks to it through the MCP SDK client, so the tests exercise the exact
 * observable contract a developer gets from the command line.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

// This compiled test file lives at <pkg>/dist/tests/.
const here = dirname(fileURLToPath(import.meta.url));
const cliPath = join(here, '..', 'src', 'cli', 'call.js');

function runCli(
  args: string[],
  inventoryPath: string,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf-8',
    timeout: 20_000,
    env: { ...process.env, SITE_INTELLIGENCE_INVENTORY_PATH: inventoryPath },
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

test('CLI --list prints both registered tools', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const { status, stdout } = runCli(['--list'], filePath);
    assert.equal(status, 0);
    assert.match(stdout, /get_site_overview/);
    assert.match(stdout, /get_site_warnings/);
  } finally {
    cleanup();
  }
});

test('CLI calls get_site_overview and prints the result', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const { status, stdout } = runCli(['get_site_overview'], filePath);
    assert.equal(status, 0);
    assert.match(stdout, /"totalUrls": 3/);
    assert.match(stdout, /"generatedCommit": "abc123"/);
  } finally {
    cleanup();
  }
});

test('CLI calls get_site_warnings and prints the warning record', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const { status, stdout } = runCli(['get_site_warnings'], filePath);
    assert.equal(status, 0);
    assert.match(stdout, /"warningCount": 1/);
    assert.match(stdout, /MISSING_DESCRIPTION/);
    assert.match(stdout, /\/about\//);
  } finally {
    cleanup();
  }
});

test('CLI exits non-zero with a helpful message for an unknown tool', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const { status, stderr } = runCli(['does_not_exist'], filePath);
    assert.notEqual(status, 0);
    assert.match(stderr, /Unknown tool "does_not_exist"/);
    assert.match(stderr, /get_site_overview/);
  } finally {
    cleanup();
  }
});

test('CLI exits non-zero with usage for missing or extra arguments', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const noArgs = runCli([], filePath);
    assert.notEqual(noArgs.status, 0);
    assert.match(noArgs.stderr, /Usage:/);

    const extraArgs = runCli(['get_site_overview', 'extra'], filePath);
    assert.notEqual(extraArgs.status, 0);
    assert.match(extraArgs.stderr, /Usage:/);

    const help = runCli(['--help'], filePath);
    assert.equal(help.status, 0);
    assert.match(help.stdout, /Usage:/);
  } finally {
    cleanup();
  }
});

test('CLI resolves the compiled server from its own location, independent of cwd', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    // The CLI must not depend on the caller's working directory: the server
    // path is derived from the CLI module's own compiled location.
    const result = spawnSync(process.execPath, [cliPath, '--list'], {
      encoding: 'utf-8',
      timeout: 20_000,
      cwd: '/',
      env: { ...process.env, SITE_INTELLIGENCE_INVENTORY_PATH: filePath },
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout ?? '', /get_site_overview/);
    assert.match(result.stdout ?? '', /get_site_warnings/);
  } finally {
    cleanup();
  }
});
