/**
 * Tests for the search_pages tool.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { InventoryPage, SiteInventory } from '../src/graph/schema.js';
import {
  calculateScore,
  normalizeQuery,
  searchPages,
  validateSearchQuery,
} from '../src/tools/search-helper.js';
import { searchPagesToolHandler } from '../src/tools/search-pages.js';
import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

function firstPage(inventory: SiteInventory): InventoryPage {
  const p = inventory.pages[0];
  if (!p) throw new Error('Expected at least one page');
  return p;
}

function page(route: string, overrides: Partial<InventoryPage> = {}): InventoryPage {
  return {
    route,
    file: 'index.html',
    size: 1000,
    built: true,
    inSitemap: true,
    sitemapLastmod: null,
    title: 'Test Page',
    description: 'Test description',
    canonical: `https://ericcarlisle.com${route}`,
    robots: 'index, follow',
    h1Count: 1,
    h1Texts: ['Test Page'],
    redirectTarget: null,
    inboundCount: 5,
    incoming: ['/'],
    outgoing: ['/about/'],
    warnings: [],
    classification: 'normal',
    ...overrides,
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

test('normalizeQuery: normalizes whitespace and case', () => {
  assert.equal(normalizeQuery('  Context  Health  '), 'context health');
  assert.equal(normalizeQuery('CONTEXT'), 'context');
  assert.equal(normalizeQuery('context'), 'context');
});

test('validateSearchQuery: accepts valid query', () => {
  assert.equal(validateSearchQuery('context'), 'context');
});

test('validateSearchQuery: rejects empty string', () => {
  assert.throws(() => validateSearchQuery(''), {
    name: 'Error',
    message: 'Query must be a non-empty string.',
  });
});

test('validateSearchQuery: rejects whitespace only', () => {
  assert.throws(() => validateSearchQuery('   '), {
    name: 'Error',
    message: 'Query must be a non-empty string.',
  });
});

test('validateSearchQuery: rejects non-string', () => {
  assert.throws(() => validateSearchQuery(123), {
    name: 'Error',
    message: 'Query must be a string.',
  });
});

test('calculateScore: exact title match gets highest score', () => {
  const inventory = inventoryWith([page('/page/', { title: 'Context', h1Texts: ['Context'] })]);
  const score = calculateScore(firstPage(inventory), 'Context');
  // exact title (1000) + title prefix (800) + title substring (600) + heading match (400) + title token (200) + heading token (100)
  assert.equal(score, 3100);
});

test('calculateScore: exact route match gets high score', () => {
  const inventory = inventoryWith([page('/context/', { title: 'Other', h1Texts: ['Other'] })]);
  const score = calculateScore(firstPage(inventory), '/context/');
  assert.ok(score >= 900);
});

test('calculateScore: title prefix match', () => {
  const inventory = inventoryWith([
    page('/page/', { title: 'Context Health', h1Texts: ['Context Health'] }),
  ]);
  const score = calculateScore(firstPage(inventory), 'Context');
  assert.ok(score >= 800);
});

test('calculateScore: description match', () => {
  const inventory = inventoryWith([
    page('/page/', { description: 'Context health assessment', h1Texts: ['Other'] }),
  ]);
  const score = calculateScore(firstPage(inventory), 'context');
  assert.ok(score >= 500);
});

test('calculateScore: heading match', () => {
  const inventory = inventoryWith([
    page('/page/', { h1Texts: ['Context Health'], title: 'Other', description: '' }),
  ]);
  const score = calculateScore(firstPage(inventory), 'context');
  assert.ok(score >= 400);
});

test('calculateScore: tag match from route', () => {
  const inventory = inventoryWith([page('/tags/context/', { title: 'Tags', h1Texts: ['Tags'] })]);
  const score = calculateScore(firstPage(inventory), 'context');
  assert.ok(score >= 300);
});

test('calculateScore: no match returns 0', () => {
  const inventory = inventoryWith([
    page('/page/', { title: 'Other', description: 'Nothing here', h1Texts: ['Other'] }),
  ]);
  const score = calculateScore(firstPage(inventory), 'context');
  assert.equal(score, 0);
});

test('searchPages: exact title match ranks first', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Context', description: '' }),
    page('/b/', { title: 'Context Health', description: '' }),
    page('/c/', { title: 'Other', description: '' }),
  ]);
  const results = searchPages(inventory, 'Context');
  assert.equal(results.length, 2);
  assert.equal(results[0]?.route, '/a/');
  assert.equal(results[1]?.route, '/b/');
});

test('searchPages: route match', () => {
  const inventory = inventoryWith([
    page('/context/', { title: 'Other' }),
    page('/about/', { title: 'About' }),
  ]);
  const results = searchPages(inventory, '/context/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/context/');
});

test('searchPages: multiple results ordered by score then title', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Context', description: '' }),
    page('/b/', { title: 'Context', description: '' }),
  ]);
  const results = searchPages(inventory, 'Context');
  assert.equal(results.length, 2);
  // Same score, should be ordered by title then route
  assert.equal(results[0]?.route, '/a/');
  assert.equal(results[1]?.route, '/b/');
});

test('searchPages: no matches returns empty array', () => {
  const inventory = inventoryWith([page('/a/', { title: 'Other', description: '' })]);
  const results = searchPages(inventory, 'context');
  assert.deepEqual(results, []);
});

test('searchPages: tag match from route', () => {
  const inventory = inventoryWith([
    page('/tags/context/', { title: 'Tags', description: '' }),
    page('/tags/other/', { title: 'Tags', description: '' }),
  ]);
  const results = searchPages(inventory, 'context');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/tags/context/');
});

test('searchPagesToolHandler: returns results for valid query', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await searchPagesToolHandler({ query: 'context' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.equal(parsed.query, 'context');
    assert.ok(Array.isArray(parsed.results));
    assert.ok(typeof parsed.resultCount === 'number');
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPagesToolHandler: rejects empty query', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await searchPagesToolHandler({ query: '' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Query must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPagesToolHandler: rejects whitespace-only query', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await searchPagesToolHandler({ query: '   ' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Query must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPagesToolHandler: rejects non-string query', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await searchPagesToolHandler({ query: 123 } as unknown as { query: string });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Query must be a string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPagesToolHandler: returns error when inventory missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await searchPagesToolHandler({ query: 'context' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPagesToolHandler: returns clear error without stack traces', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await searchPagesToolHandler({ query: 'nonexistent' });
    const text = result.content[0]?.text ?? '';
    // Should return results array (possibly empty) not an error
    assert.ok(!text.includes('.js:'));
    assert.ok(!text.includes('file://'));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('searchPages: deterministic ordering for same score', () => {
  const inventory = inventoryWith([
    page('/zebra/', { title: 'Alpha', description: '' }),
    page('/alpha/', { title: 'Alpha', description: '' }),
  ]);
  const results = searchPages(inventory, 'alpha');
  // Same score, same title, should be ordered by route
  assert.equal(results[0]?.route, '/alpha/');
  assert.equal(results[1]?.route, '/zebra/');
});

test('searchPages: classification match', () => {
  const inventory = inventoryWith([
    page('/page/', { classification: 'normal', title: 'Other', description: '', h1Texts: [] }),
  ]);
  const results = searchPages(inventory, 'normal');
  assert.equal(results.length, 1);
  const first = results[0];
  if (first) {
    assert.ok(first.score >= 25);
  }
});
