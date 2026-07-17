#!/usr/bin/env node

/**
 * test-validate-no-blog-h1.mjs
 *
 * Runs the validator against fixture files and asserts expected pass/fail
 * behavior. Exits 0 if all tests pass, 1 otherwise.
 */

import { execSync } from 'node:child_process';

const FIXTURE_DIR = 'tests/fixtures/blog-h1-validator';
const VALIDATOR = 'node scripts/validate-no-blog-h1.mjs';

const tests = [
  // ── Should fail ──────────────────────────────────────
  { file: 'atx-h1.mdx', expect: 1, label: 'ATX # Heading' },
  { file: 'setext-h1.md', expect: 1, label: 'Setext Heading\\n===' },
  { file: 'raw-html-h1.mdx', expect: 1, label: 'Raw <h1> tag' },
  // ── Should pass ──────────────────────────────────────
  { file: 'h2-allowed.mdx', expect: 0, label: '## h2 allowed' },
  { file: 'h1-in-code-block.mdx', expect: 0, label: 'h1 inside fenced code block' },
  { file: 'inline-code-h1.mdx', expect: 0, label: '`#` in inline code' },
  { file: 'valid-content.mdx', expect: 0, label: 'Valid content with no h1' },
];

let passed = 0;
let failed = 0;

for (const { file, expect, label } of tests) {
  const filePath = `${FIXTURE_DIR}/${file}`;
  let exitCode;
  try {
    execSync(`${VALIDATOR} "${filePath}"`, { stdio: 'pipe' });
    exitCode = 0;
  } catch (e) {
    exitCode = e.status;
  }

  if (exitCode === expect) {
    console.log(`\x1b[32m✓\x1b[0m ${label}`);
    passed++;
  } else {
    console.log(`\x1b[31m✖\x1b[0m ${label}  (expected exit ${expect}, got ${exitCode})`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
