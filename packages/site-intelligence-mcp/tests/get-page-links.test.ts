/**
 * Tests for the get_page_links tool.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { InventoryPage, SiteInventory } from '../src/graph/schema.js';
import { buildPageLinksResult, getPageLinksToolHandler } from '../src/tools/get-page-links.js';
import { isPageOrphaned } from '../src/tools/page-lookup.js';
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
    incoming: ['/', '/about/'],
    outgoing: ['/about/', '/contact/'],
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

test('isPageOrphaned: true for normal page with zero inbound', () => {
  const p = page('/test/', {
    inboundCount: 0,
    incoming: [],
    classification: 'normal',
    built: true,
  });
  assert.equal(isPageOrphaned(p), true);
});

test('isPageOrphaned: false for normal page with inbound links', () => {
  const p = page('/test/', { inboundCount: 5, classification: 'normal', built: true });
  assert.equal(isPageOrphaned(p), false);
});

test('isPageOrphaned: false for non-normal classification', () => {
  const p = page('/test/', { inboundCount: 0, classification: 'lab', built: true });
  assert.equal(isPageOrphaned(p), false);
  const p2 = page('/test/', { inboundCount: 0, classification: 'redirect', built: true });
  assert.equal(isPageOrphaned(p2), false);
  const p3 = page('/test/', { inboundCount: 0, classification: 'noindex', built: true });
  assert.equal(isPageOrphaned(p3), false);
  const p4 = page('/test/', { inboundCount: 0, classification: '404', built: true });
  assert.equal(isPageOrphaned(p4), false);
  const p5 = page('/test/', { inboundCount: 0, classification: 'external-artifact', built: true });
  assert.equal(isPageOrphaned(p5), false);
});

test('isPageOrphaned: false for unbuilt page', () => {
  const p = page('/test/', { inboundCount: 0, classification: 'normal', built: false });
  assert.equal(isPageOrphaned(p), false);
});

test('buildPageLinksResult returns all link fields', () => {
  const inventory = inventoryWith(
    [
      page('/test/', {
        incoming: ['/', '/about/'],
        outgoing: ['/about/', '/contact/'],
        inboundCount: 2,
      }),
    ],
    { commitSha: 'abc123' },
  );
  const result = buildPageLinksResult(inventory, firstPage(inventory));
  assert.equal(result.generatedCommit, 'abc123');
  assert.equal(result.route, '/test/');
  assert.deepEqual(result.incoming, ['/', '/about/']);
  assert.deepEqual(result.outgoing, ['/about/', '/contact/']);
  assert.equal(result.inboundCount, 2);
  assert.equal(result.outgoingCount, 2);
  assert.equal(result.orphaned, false);
});

test('buildPageLinksResult handles empty link arrays', () => {
  const inventory = inventoryWith([
    page('/test/', { incoming: [], outgoing: [], inboundCount: 0 }),
  ]);
  const result = buildPageLinksResult(inventory, firstPage(inventory));
  assert.deepEqual(result.incoming, []);
  assert.deepEqual(result.outgoing, []);
  assert.equal(result.inboundCount, 0);
  assert.equal(result.outgoingCount, 0);
});

test('buildPageLinksResult sorted and deduplicated', () => {
  const inventory = inventoryWith([
    page('/test/', {
      incoming: ['/z/', '/a/', '/a/'],
      outgoing: ['/b/', '/a/', '/b/'],
      inboundCount: 2,
    }),
  ]);
  const result = buildPageLinksResult(inventory, firstPage(inventory));
  assert.deepEqual(result.incoming, ['/a/', '/z/']);
  assert.deepEqual(result.outgoing, ['/a/', '/b/']);
  assert.equal(result.inboundCount, 2);
  assert.equal(result.outgoingCount, 2);
});

test('buildPageLinksResult orphaned flag matches isPageOrphaned', () => {
  const inventory = inventoryWith([
    page('/test/', { inboundCount: 0, incoming: [], classification: 'normal', built: true }),
  ]);
  const result = buildPageLinksResult(inventory, firstPage(inventory));
  assert.equal(result.orphaned, true);

  const inventory2 = inventoryWith([
    page('/test/', { inboundCount: 1, classification: 'normal', built: true }),
  ]);
  const result2 = buildPageLinksResult(inventory2, firstPage(inventory2));
  assert.equal(result2.orphaned, false);
});

test('getPageLinksToolHandler returns links for valid route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '/about/' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.equal(parsed.route, '/about/');
    assert.ok(Array.isArray(parsed.incoming));
    assert.ok(Array.isArray(parsed.outgoing));
    assert.equal(typeof parsed.inboundCount, 'number');
    assert.equal(typeof parsed.outgoingCount, 'number');
    assert.equal(typeof parsed.orphaned, 'boolean');
    assert.equal(parsed.generatedCommit, 'abc123');
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler normalizes route variants', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    for (const variant of ['/about/', 'about/', 'about', '/about']) {
      const result = await getPageLinksToolHandler({ route: variant });
      assert.equal(result.isError, undefined);
      const parsed = JSON.parse(result.content[0]?.text ?? '');
      assert.equal(parsed.route, '/about/');
    }
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error for unknown route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '/nonexistent/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error for invalid route input', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    // @ts-expect-error testing invalid input
    const result = await getPageLinksToolHandler({ route: 123 });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error for empty route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error for whitespace-only route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '   ' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error when inventory missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await getPageLinksToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns error for malformed JSON inventory', async () => {
  const { filePath, cleanup } = createFixtureDir('{ not json');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not valid JSON/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageLinksToolHandler returns clear error without stack traces', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageLinksToolHandler({ route: '/nonexistent/' });
    const text = result.content[0]?.text ?? '';
    assert.ok(!text.includes('.js:'));
    assert.ok(!text.includes('file://'));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});
