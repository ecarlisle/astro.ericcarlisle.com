/**
 * Tests for the get_site_warnings tool.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SiteInventory } from '../src/graph/schema.js';
import { buildSiteWarnings, getSiteWarningsToolHandler } from '../src/tools/get-site-warnings.js';
import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

type Warning = { code: string; message: string };

function page(
  route: string,
  warnings: Warning[],
  title: string | null = route,
): SiteInventory['pages'][number] {
  return {
    route,
    file: null,
    size: null,
    built: true,
    inSitemap: true,
    sitemapLastmod: null,
    title,
    description: null,
    canonical: null,
    robots: null,
    h1Count: 1,
    h1Texts: [],
    redirectTarget: null,
    inboundCount: 0,
    warnings,
  };
}

function inventoryWith(
  pages: SiteInventory['pages'],
  provenance?: { commitSha?: string },
): SiteInventory {
  return {
    pages,
    summary: {
      totalUrls: pages.length,
      builtPages: pages.length,
      sitemapUrls: pages.length,
      orphanedPages: 0,
      pagesWithWarnings: pages.filter((p) => p.warnings.length > 0).length,
      totalWarnings: pages.reduce((sum, p) => sum + p.warnings.length, 0),
    },
    ...(provenance ? { provenance } : {}),
  };
}

test('buildSiteWarnings returns an empty array when there are no warnings', () => {
  const result = buildSiteWarnings(inventoryWith([page('/a/', [])]));
  assert.equal(result.warningCount, 0);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.generatedCommit, undefined);
});

test('buildSiteWarnings returns a single warning correctly', () => {
  const result = buildSiteWarnings(
    inventoryWith([page('/a/', [{ code: 'ORPHANED_PAGE', message: 'No internal links.' }], 'A')], {
      commitSha: 'abc123',
    }),
  );
  assert.equal(result.generatedCommit, 'abc123');
  assert.equal(result.warningCount, 1);
  assert.deepEqual(result.warnings, [
    { code: 'ORPHANED_PAGE', route: '/a/', title: 'A', message: 'No internal links.' },
  ]);
});

test('buildSiteWarnings returns multiple warnings across pages in order', () => {
  const result = buildSiteWarnings(
    inventoryWith([
      page(
        '/a/',
        [
          { code: 'A1', message: 'first' },
          { code: 'A2', message: 'second' },
        ],
        'A',
      ),
      page('/b/', [{ code: 'B1', message: 'third' }], 'B'),
      page('/c/', [], 'C'),
    ]),
  );
  assert.equal(result.warningCount, 3);
  assert.deepEqual(
    result.warnings.map((w) => `${w.route}:${w.code}`),
    ['/a/:A1', '/a/:A2', '/b/:B1'],
  );
  assert.deepEqual(result.warnings[0], { code: 'A1', route: '/a/', title: 'A', message: 'first' });
  assert.deepEqual(result.warnings[1], { code: 'A2', route: '/a/', title: 'A', message: 'second' });
  assert.deepEqual(result.warnings[2], { code: 'B1', route: '/b/', title: 'B', message: 'third' });
});

test('warning count always matches the returned warnings, ignoring a stale summary', () => {
  const inventory = inventoryWith([page('/a/', [{ code: 'A', message: 'm' }])]);
  // Simulate a summary that disagrees with the records; the tool must trust
  // the per-page records so the count and the list stay consistent.
  inventory.summary.totalWarnings = 99;
  const result = buildSiteWarnings(inventory);
  assert.equal(result.warningCount, result.warnings.length);
  assert.equal(result.warningCount, 1);
});

test('buildSiteWarnings preserves null titles', () => {
  const result = buildSiteWarnings(
    inventoryWith([page('/a/', [{ code: 'NO_BUILT_PAGE', message: 'Missing HTML.' }], null)]),
  );
  assert.deepEqual(result.warnings, [
    { code: 'NO_BUILT_PAGE', route: '/a/', title: null, message: 'Missing HTML.' },
  ]);
});

test('getSiteWarningsToolHandler returns warning JSON for a valid fixture', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getSiteWarningsToolHandler();
    assert.equal(result.isError, undefined);
    const text = result.content[0]?.text ?? '';
    const parsed = JSON.parse(text) as {
      generatedCommit?: string;
      warningCount: number;
      warnings: { code: string; route: string; title: string | null }[];
    };
    assert.equal(parsed.generatedCommit, 'abc123');
    assert.equal(parsed.warningCount, 1);
    assert.equal(parsed.warnings.length, 1);
    assert.equal(parsed.warnings[0]?.code, 'MISSING_DESCRIPTION');
    assert.equal(parsed.warnings[0]?.route, '/about/');
    // Must remain compact — not the full inventory.
    assert.equal((parsed as { pages?: unknown }).pages, undefined);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getSiteWarningsToolHandler returns a clear error when data is missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await getSiteWarningsToolHandler();
    assert.equal(result.isError, true);
    const text = result.content[0]?.text ?? '';
    assert.match(text, /Error:/);
    assert.match(text, /not found/);
    // No stack traces (stack frames reference files) or large file contents.
    assert.ok(!text.includes('.js:'));
    assert.ok(!text.includes('file://'));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getSiteWarningsToolHandler returns a clear error for malformed JSON', async () => {
  const { filePath, cleanup } = createFixtureDir('{ not json');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getSiteWarningsToolHandler();
    assert.equal(result.isError, true);
    const text = result.content[0]?.text ?? '';
    assert.match(text, /not valid JSON/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});
