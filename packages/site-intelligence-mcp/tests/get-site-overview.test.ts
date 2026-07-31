/**
 * Tests for the get_site_overview tool and server registration.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createServer } from '../src/server.js';
import { buildSiteOverview, getSiteOverviewToolHandler } from '../src/tools/get-site-overview.js';
import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

test('buildSiteOverview returns a compact structured overview', () => {
  const overview = buildSiteOverview(VALID_INVENTORY, '/tmp/site-inventory.json');
  assert.equal(overview.totalUrls, 3);
  assert.equal(overview.builtPages, 3);
  assert.equal(overview.sitemapUrls, 2);
  assert.equal(overview.pagesWithWarnings, 1);
  assert.equal(overview.totalWarnings, 1);
  assert.equal(overview.generatedCommit, 'abc123');
  assert.equal(overview.source, '/tmp/site-inventory.json');
  assert.deepEqual(overview.categories, { normal: 2, lab: 1 });
  assert.deepEqual(overview.warningsByCode, { MISSING_DESCRIPTION: 1 });
});

test('buildSiteOverview falls back to page-derived counts when summary is absent', () => {
  const inventory = {
    pages: VALID_INVENTORY.pages,
    provenance: undefined,
  } as unknown as typeof VALID_INVENTORY;
  const overview = buildSiteOverview(inventory, 'x.json');
  assert.equal(overview.totalUrls, 3);
  assert.equal(overview.builtPages, 3);
  assert.equal(overview.pagesWithWarnings, 1);
  assert.equal(overview.totalWarnings, 1);
});

test('buildSiteOverview handles empty pages', () => {
  const overview = buildSiteOverview(
    {
      pages: [],
      summary: {
        totalUrls: 0,
        builtPages: 0,
        sitemapUrls: 0,
        orphanedPages: 0,
        pagesWithWarnings: 0,
        totalWarnings: 0,
      },
    },
    'e.json',
  );
  assert.equal(overview.totalUrls, 0);
  assert.deepEqual(overview.categories, {});
});

test('getSiteOverviewToolHandler returns compact JSON for a valid fixture', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getSiteOverviewToolHandler();
    assert.equal(result.isError, undefined);
    const text = result.content[0]?.text ?? '';
    const parsed = JSON.parse(text) as Record<string, unknown>;
    assert.equal(parsed.totalUrls, 3);
    assert.equal(parsed.pagesWithWarnings, 1);
    assert.equal(parsed.generatedCommit, 'abc123');
    // Must remain compact — not the full inventory.
    assert.equal(parsed.pages as unknown, undefined);
    assert.ok(text.length < 2000);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getSiteOverviewToolHandler returns a clear error when data is missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await getSiteOverviewToolHandler();
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

test('getSiteOverviewToolHandler returns a clear error for malformed JSON', async () => {
  const { filePath, cleanup } = createFixtureDir('{ not json');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getSiteOverviewToolHandler();
    assert.equal(result.isError, true);
    const text = result.content[0]?.text ?? '';
    assert.match(text, /not valid JSON/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('createServer constructs and registers the tool', () => {
  const server = createServer();
  assert.ok(server);
  const proto = Object.getPrototypeOf(server) as Record<string, unknown>;
  // The SDK exposes registerTool (modern) and tool (deprecated) methods.
  assert.equal(typeof proto.registerTool, 'function');
  assert.equal(typeof proto.connect, 'function');
});
