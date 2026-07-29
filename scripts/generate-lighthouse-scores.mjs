#!/usr/bin/env node

/**
 * Generate lighthouse-scores.json — per-route Lighthouse category scores
 * for the page quality footer.
 *
 * Reads Lighthouse JSON reports from lh-reports/ and writes the per-route
 * score data to src/generated/lighthouse-scores.json.
 *
 * Usage:
 *   node scripts/generate-lighthouse-scores.mjs
 *
 * Depends on:
 *   - lh-reports/*.report.json  (produced by pnpm lighthouse:all)
 *
 * Exit codes:
 *   0 – success (data may be partial or empty if no reports exist)
 *   1 – invalid report data
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const LH_REPORTS = join(ROOT, 'lh-reports');
const GENERATED_DIR = join(ROOT, 'src', 'generated');
const OUTPUT_PATH = join(GENERATED_DIR, 'lighthouse-scores.json');

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize a full URL to a site route.
 * Strips protocol/host/port, adds trailing slash, handles index.
 */
function normalizeRoute(urlString) {
  try {
    const url = new URL(urlString);
    let path = url.pathname;
    // Remove trailing index.html
    path = path.replace(/\/index\.html$/, '/');
    // Ensure leading slash
    if (!path.startsWith('/')) path = `/${path}`;
    // Ensure trailing slash (for consistency with Astro output)
    if (!path.endsWith('/')) path += '/';
    return path;
  } catch {
    return null;
  }
}

/**
 * Validate a category score (0–100 integer).
 */
function isValidScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

/**
 * Get the short commit SHA.
 */
function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Check for reports directory
  if (!existsSync(LH_REPORTS)) {
    console.log('⚠️  lh-reports/ directory not found. No Lighthouse scores generated.');
    writeOutput({ generatedAt: new Date().toISOString(), commitSha: getCommitSha(), pages: [] });
    return;
  }

  // Find all JSON report files (prefer .report.json, fall back to other .json)
  const allFiles = readdirSync(LH_REPORTS);
  const reportFiles = allFiles.filter(
    (f) => f.endsWith('.report.json') || (f.endsWith('.json') && !f.endsWith('.report.json')),
  );

  if (reportFiles.length === 0) {
    console.log('⚠️  No Lighthouse JSON reports found in lh-reports/.');
    writeOutput({ generatedAt: new Date().toISOString(), commitSha: getCommitSha(), pages: [] });
    return;
  }

  const records = [];

  for (const fileName of reportFiles) {
    const filePath = join(LH_REPORTS, fileName);
    let lh;
    try {
      lh = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  ⚠️  Could not parse ${fileName}, skipping.`);
      continue;
    }

    // Get the URL from the report
    const originalUrl = lh.requestedUrl || lh.finalUrl;
    if (!originalUrl) {
      console.warn(`  ⚠️  ${fileName} has no URL, skipping.`);
      continue;
    }

    const route = normalizeRoute(originalUrl);
    if (!route) {
      console.warn(`  ⚠️  Could not normalize URL "${originalUrl}", skipping.`);
      continue;
    }

    // Extract category scores
    const categories = lh.categories || {};
    const scores = {
      performance:
        categories.performance?.score != null
          ? Math.round(categories.performance.score * 100)
          : null,
      accessibility:
        categories.accessibility?.score != null
          ? Math.round(categories.accessibility.score * 100)
          : null,
      bestPractices:
        categories['best-practices']?.score != null
          ? Math.round(categories['best-practices'].score * 100)
          : null,
      seo: categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null,
    };

    // Validate scores
    for (const [key, value] of Object.entries(scores)) {
      if (value !== null && !isValidScore(value)) {
        console.warn(`  ⚠️  ${fileName}: invalid ${key} score ${value}, setting to null.`);
        scores[key] = null;
      }
    }

    // Check that at least one score is valid
    const hasAnyScore = Object.values(scores).some((v) => v !== null);
    if (!hasAnyScore) {
      console.warn(`  ⚠️  ${fileName}: no valid scores, skipping.`);
      continue;
    }

    const configSettings = lh.configSettings || {};

    records.push({
      route,
      scores,
      timestamp: lh.fetchTime || null,
      lighthouseVersion: lh.lighthouseVersion || null,
      formFactor: configSettings.formFactor || 'mobile',
    });
  }

  // Deduplicate by route — if multiple reports exist for the same route,
  // use the median of each score (project convention: median representative run).
  const byRoute = new Map();
  for (const record of records) {
    if (!byRoute.has(record.route)) {
      byRoute.set(record.route, []);
    }
    byRoute.get(record.route).push(record);
  }

  const pages = [];
  for (const [route, entries] of byRoute) {
    if (entries.length === 1) {
      pages.push({ ...entries[0], route });
    } else {
      // Multiple runs: median per score category
      const median = (values) => {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      };

      const perfScores = entries.map((e) => e.scores.performance).filter((v) => v !== null);
      const a11yScores = entries.map((e) => e.scores.accessibility).filter((v) => v !== null);
      const bpScores = entries.map((e) => e.scores.bestPractices).filter((v) => v !== null);
      const seoScores = entries.map((e) => e.scores.seo).filter((v) => v !== null);

      pages.push({
        route,
        scores: {
          performance: perfScores.length > 0 ? median(perfScores) : null,
          accessibility: a11yScores.length > 0 ? median(a11yScores) : null,
          bestPractices: bpScores.length > 0 ? median(bpScores) : null,
          seo: seoScores.length > 0 ? median(seoScores) : null,
        },
        timestamp: entries[0].timestamp,
        lighthouseVersion: entries[0].lighthouseVersion,
        formFactor: entries[0].formFactor,
      });
    }
  }

  // Sort by route for deterministic output
  pages.sort((a, b) => a.route.localeCompare(b.route));

  const output = {
    generatedAt: new Date().toISOString(),
    commitSha: getCommitSha(),
    lighthouseVersion: records.length > 0 ? records[0].lighthouseVersion : null,
    pages,
  };

  writeOutput(output);
  console.log(`✅ Wrote ${OUTPUT_PATH} (${pages.length} page(s))`);
}

function writeOutput(data) {
  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

main();
