#!/usr/bin/env node
/**
 * Validate lighthouse-scores.json — ensures that generated score data
 * is well-formed, routes are valid, scores are in range, and no unsafe
 * values exist.
 *
 * Usage:
 *   node scripts/validate-lighthouse-scores.mjs
 *
 * Exit codes:
 *   0 – valid
 *   1 – validation failure
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DATA_PATH = join(ROOT, 'src', 'generated', 'lighthouse-scores.json');

function isValidRoute(route) {
  return (
    typeof route === 'string' &&
    route.startsWith('/') &&
    !route.includes('..') &&
    !route.includes('//')
  );
}

function isValidScore(value) {
  return (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100)
  );
}

function main() {
  if (!existsSync(DATA_PATH)) {
    console.log('⚠️  lighthouse-scores.json not found — nothing to validate.');
    return;
  }

  const raw = readFileSync(DATA_PATH, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error('❌ lighthouse-scores.json is not valid JSON.');
    process.exit(1);
  }

  // Top-level structure
  if (!data.generatedAt || typeof data.generatedAt !== 'string') {
    console.error('❌ Missing or invalid "generatedAt".');
    process.exit(1);
  }

  // Pages
  if (!Array.isArray(data.pages)) {
    console.error('❌ "pages" is not an array.');
    process.exit(1);
  }

  let errors = 0;

  for (const page of data.pages) {
    // Route
    if (!page.route || !isValidRoute(page.route)) {
      console.error(`❌ Invalid route: "${page.route}"`);
      errors++;
    }

    // Scores
    if (!page.scores || typeof page.scores !== 'object') {
      console.error(`❌ Missing scores for ${page.route}`);
      errors++;
      continue;
    }

    for (const key of ['performance', 'accessibility', 'bestPractices', 'seo']) {
      if (!isValidScore(page.scores[key])) {
        console.error(`❌ ${page.route}: invalid score "${key}": ${page.scores[key]}`);
        errors++;
      }
    }

    // Metadata
    if (page.timestamp && typeof page.timestamp !== 'string') {
      console.error(`❌ ${page.route}: invalid timestamp`);
      errors++;
    }
    if (page.formFactor && !['mobile', 'desktop'].includes(page.formFactor)) {
      console.error(`❌ ${page.route}: unexpected formFactor "${page.formFactor}"`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`❌ ${errors} validation error(s).`);
    process.exit(1);
  }

  console.log(`✅ lighthouse-scores.json valid (${data.pages.length} page(s) records).`);
}

main();
