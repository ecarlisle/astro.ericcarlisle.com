#!/usr/bin/env node
/**
 * Validate that site-quality.json contains Lighthouse report data.
 *
 * In deployment, Lighthouse is expected to have run before
 * quality:generate. This validator catches cases where the
 * generated Site Quality JSON has no Lighthouse data despite
 * CI expecting it.
 *
 * Does NOT fail outside CI (e.g. local dev without lh-reports/)
 * because the intent is to catch deployment pipeline failures.
 * However, if running in CI and the file exists, it MUST have
 * valid Lighthouse data.
 *
 * Exit codes:
 *   0 – site-quality.json contains valid Lighthouse data
 *   1 – missing, invalid, or empty Lighthouse data
 *
 * Usage:
 *   node scripts/validate-site-quality-lighthouse.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DATA_PATH =
  process.env.SITE_QUALITY_PATH || join(ROOT, 'src', 'generated', 'site-quality.json');

function main() {
  // File must exist
  if (!existsSync(DATA_PATH)) {
    console.error(
      '❌ src/generated/site-quality.json not found.\n' + '   Run pnpm quality:generate first.',
    );
    process.exit(1);
  }

  // File must be valid JSON
  let data;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch (err) {
    console.error(
      '❌ src/generated/site-quality.json is not valid JSON.\n' +
        `   ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // lighthouse property must exist
  if (!Object.hasOwn(data, 'lighthouse')) {
    console.error(
      '❌ site-quality.json has no "lighthouse" property.\n' +
        '   The quality:generate script should always include it.',
    );
    process.exit(1);
  }

  // lighthouse must not be null
  if (data.lighthouse === null) {
    console.error(
      '❌ site-quality.json "lighthouse" is null.\n' +
        '   No Lighthouse reports were found when quality:generate ran.\n' +
        '   Ensure pnpm lighthouse:all completed successfully before\n' +
        '   pnpm quality:generate.',
    );
    process.exit(1);
  }

  // lighthouse must be a non-empty array
  if (!Array.isArray(data.lighthouse)) {
    console.error(
      `❌ site-quality.json "lighthouse" is type "${typeof data.lighthouse}", not an array.`,
    );
    process.exit(1);
  }

  if (data.lighthouse.length === 0) {
    console.error(
      '❌ site-quality.json "lighthouse" is an empty array.\n' +
        '   No route reports were found. Check that pnpm lighthouse:all\n' +
        '   produced valid JSON reports in lh-reports/.',
    );
    process.exit(1);
  }

  // Validate each entry has required fields
  for (let i = 0; i < data.lighthouse.length; i++) {
    const entry = data.lighthouse[i];
    if (!entry.url || typeof entry.url !== 'string') {
      console.error(`❌ lighthouse[${i}] is missing a valid "url".`);
      process.exit(1);
    }
    if (!entry.scores || typeof entry.scores !== 'object') {
      console.error(`❌ lighthouse[${i}] (${entry.url}) is missing "scores".`);
      process.exit(1);
    }
  }

  console.log(
    `✅ site-quality.json contains ${data.lighthouse.length} Lighthouse route record(s).`,
  );
}

main();
