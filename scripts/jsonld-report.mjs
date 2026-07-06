#!/usr/bin/env node

/**
 * JSON-LD Structured Data Report
 *
 * Scans built HTML files in `dist/`, extracts <script type="application/ld+json">
 * blocks, parses them, and writes a structured data report to
 * `data/structured-data/`.
 *
 * Exit codes:
 *   0 – All pages have valid JSON-LD.
 *   1 – Any JSON-LD block failed to parse, or no JSON-LD blocks were found.
 *
 * Usage:
 *   node scripts/jsonld-report.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const REPORT_DIR = join(import.meta.dirname, '..', 'data', 'structured-data');

/**
 * Walk a directory recursively, yielding relative file paths.
 */
function* walk(dir, prefix = '') {
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      yield* walk(dir, path);
    } else if (entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

/**
 * Convert a file path like "blog/index.html" to a URL path like "/blog/".
 */
function htmlPathToUrl(htmlPath) {
  let url = `/${htmlPath.replace(/\/?index\.html$/, '')}`;
  if (!url.endsWith('/')) url += '/';
  return url;
}

/**
 * Extract JSON-LD script blocks from an HTML string.
 * Returns an array of parsed JSON objects.
 */
function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script\s+type="application\/ld\+json">(.*?)<\/script>/gs;
  for (;;) {
    const match = regex.exec(html);
    if (match === null) break;
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      return { error: `Failed to parse JSON-LD block: ${match[1].slice(0, 200)}` };
    }
  }
  return blocks;
}

/**
 * Recursively collect all @type values from a JSON-LD object or array,
 * distinguishing top-level entity types from nested/supporting types.
 *
 * Top-level: types found directly in the @graph array or at the root object.
 * Nested: types found anywhere else inside properties.
 */
function collectTypes(data) {
  const topLevel = new Set();
  const nested = new Set();

  if (data?.['@graph'] && Array.isArray(data['@graph'])) {
    // Standard @graph form
    for (const entry of data['@graph']) {
      if (entry['@type']) {
        const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
        for (const t of types) topLevel.add(t);
        collectNested(entry, nested, new Set());
      }
    }
  } else if (data?.['@type']) {
    // Single root entity (no @graph)
    const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
    for (const t of types) topLevel.add(t);
    collectNested(data, nested, new Set());
  }

  return { topLevel: [...topLevel].sort(), nested: [...nested].sort() };
}

/**
 * Recursively collect nested @type values from properties, skipping already
 * visited objects to avoid infinite recursion on circular references.
 */
function collectNested(obj, result, visited) {
  if (!obj || typeof obj !== 'object') return;
  if (visited.has(obj)) return;
  visited.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectNested(item, result, visited);
    }
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '@type') continue; // top-level handles this
    if (key === '@id') continue;
    if (typeof value === 'object' && value !== null) {
      if (value['@type']) {
        const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
        for (const t of types) result.add(t);
      }
      collectNested(value, result, visited);
    }
  }
}

// ── Main ──
function main() {
  if (!existsSync(DIST)) {
    console.error('❌ dist/ directory not found. Run `pnpm build` first.');
    process.exit(1);
  }

  /** @type {Array<{url: string, blocks: number, topLevel: string[], nested: string[], error?: string}>} */
  const pages = [];
  let totalBlocks = 0;
  let parseErrors = 0;

  for (const file of walk(DIST)) {
    const url = htmlPathToUrl(file);
    const html = readFileSync(join(DIST, file), 'utf-8');
    const result = extractJsonLd(html);

    if (result.error) {
      parseErrors++;
      pages.push({ url, blocks: 0, topLevel: [], nested: [], error: result.error });
      console.error(`  ❌ ${url}: ${result.error}`);
      continue;
    }

    const { topLevel, nested } = result.reduce(
      (acc, block) => {
        const types = collectTypes(block);
        for (const t of types.topLevel) acc.topLevel.add(t);
        for (const t of types.nested) acc.nested.add(t);
        return acc;
      },
      { topLevel: new Set(), nested: new Set() },
    );

    pages.push({
      url,
      blocks: result.length,
      topLevel: [...topLevel].sort(),
      nested: [...nested].sort(),
    });
    totalBlocks += result.length;
  }

  // ── Exit on total absence ──
  if (totalBlocks === 0) {
    console.error('\n❌ No JSON-LD blocks found in any page.');
    process.exit(1);
  }

  // ── Exit on parse errors ──
  if (parseErrors > 0) {
    console.error(`\n❌ ${parseErrors} page(s) had JSON-LD parse errors.`);
    process.exit(1);
  }

  // ── Aggregate type coverage ──
  /** @type {Map<string, number>} */
  const topLevelCounts = new Map();
  /** @type {Map<string, number>} */
  const nestedCounts = new Map();

  for (const page of pages) {
    for (const t of page.topLevel) {
      topLevelCounts.set(t, (topLevelCounts.get(t) || 0) + 1);
    }
    for (const t of page.nested) {
      nestedCounts.set(t, (nestedCounts.get(t) || 0) + 1);
    }
  }

  const pagesWithJsonLd = pages.filter((p) => p.blocks > 0).length;
  const pagesWithoutJsonLd = pages.filter((p) => p.blocks === 0).length;

  // ── Build report data ──
  const now = new Date().toISOString();
  const report = {
    generatedAt: now,
    summary: {
      pagesScanned: pages.length,
      totalJsonLdBlocks: totalBlocks,
      topLevelEntityTypes: topLevelCounts.size,
      nestedSupportingTypes: nestedCounts.size,
      pagesWithJsonLd,
      pagesWithoutJsonLd,
      parseErrors,
    },
    topLevelTypeCoverage: Object.fromEntries(
      [...topLevelCounts.entries()].sort((a, b) => b[1] - a[1]),
    ),
    nestedTypeCoverage: Object.fromEntries([...nestedCounts.entries()].sort((a, b) => b[1] - a[1])),
    perPage: pages,
  };

  // ── Write JSON report ──
  mkdirSync(REPORT_DIR, { recursive: true });
  const jsonPath = join(REPORT_DIR, 'jsonld-report.json');
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n📄 JSON report → ${relative(join(import.meta.dirname, '..'), jsonPath)}`);

  // ── Write Markdown report ──
  const md = buildMarkdown(report, topLevelCounts, nestedCounts);
  const mdPath = join(REPORT_DIR, 'jsonld-report.md');
  writeFileSync(mdPath, md);
  console.log(`📄 Markdown report → ${relative(join(import.meta.dirname, '..'), mdPath)}`);

  // ── Summary ──
  console.log(`\n✅ ${pagesWithJsonLd}/${pages.length} pages have JSON-LD (${totalBlocks} blocks)`);
  console.log(
    `   ${topLevelCounts.size} top-level entity types, ${nestedCounts.size} nested types`,
  );
  if (pagesWithoutJsonLd > 0) {
    console.log(`   ⚠️  ${pagesWithoutJsonLd} page(s) without JSON-LD`);
  }
}

/**
 * Build the Markdown report string.
 */
function buildMarkdown(report, topLevelCounts, nestedCounts) {
  const lines = [];

  lines.push('# JSON-LD Structured Data Report', '');
  lines.push(`Generated: ${report.generatedAt}`, '');
  lines.push('## Summary', '');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  lines.push(`| Pages scanned | ${report.summary.pagesScanned} |`);
  lines.push(`| Total JSON-LD blocks | ${report.summary.totalJsonLdBlocks} |`);
  lines.push(`| Top-level entity types | ${report.summary.topLevelEntityTypes} |`);
  lines.push(`| Nested/supporting types | ${report.summary.nestedSupportingTypes} |`);
  lines.push(`| Pages with JSON-LD | ${report.summary.pagesWithJsonLd} |`);
  lines.push(`| Pages without JSON-LD | ${report.summary.pagesWithoutJsonLd} |`);
  lines.push(`| Parse errors | ${report.summary.parseErrors} |`);
  lines.push('');

  lines.push('## Top-Level Entity Type Coverage', '');
  lines.push('These are the primary schema types declared at the top level of each');
  lines.push('JSON-LD graph (the `@type` of each `@graph` entry or root object).', '');
  lines.push('| Type | Pages |');
  lines.push('|---|---|');
  for (const [type, count] of [...topLevelCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${type} | ${count} |`);
  }
  lines.push('');

  lines.push('## Nested/Supporting Schema Object Types', '');
  lines.push('These are `@type` values found recursively inside properties of');
  lines.push('top-level entities — for example, an `ImageObject` inside a');
  lines.push('`BlogPosting`\'s "image" property, or a `ListItem` inside a');
  lines.push('`BreadcrumbList`\'s "itemListElement".');
  lines.push('', '| Type | Pages |');
  lines.push('|---|---|');
  for (const [type, count] of [...nestedCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${type} | ${count} |`);
  }
  lines.push('');

  lines.push('## Per-Page Breakdown', '');
  lines.push('| Route | Blocks | Types | Nested Types |');
  lines.push('|---|---|---|---|');
  for (const page of report.perPage) {
    const types = page.topLevel.length > 0 ? page.topLevel.join(', ') : '-';
    const nested = page.nested.length > 0 ? page.nested.join(', ') : '-';
    lines.push(`| ${page.url} | ${page.blocks} | ${types} | ${nested} |`);
  }
  lines.push('');

  return lines.join('\n');
}

main();
