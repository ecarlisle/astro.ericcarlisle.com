/**
 * Tests for the get_page tool.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { InventoryPage, SiteInventory } from '../src/graph/schema.js';
import { buildPageResult, getPageToolHandler } from '../src/tools/get-page.js';
import {
  InvalidRouteInputError,
  normalizeRouteInput,
  RouteNotFoundError,
} from '../src/tools/page-lookup.js';
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

test('normalizeRouteInput: handles root', () => {
  assert.equal(normalizeRouteInput('/'), '/');
});

test('normalizeRouteInput: adds leading and trailing slash', () => {
  assert.equal(normalizeRouteInput('tags'), '/tags/');
  assert.equal(normalizeRouteInput('/tags'), '/tags/');
  assert.equal(normalizeRouteInput('tags/'), '/tags/');
});

test('normalizeRouteInput: strips query and fragment', () => {
  assert.equal(normalizeRouteInput('/tags/?x=1'), '/tags/');
  assert.equal(normalizeRouteInput('/tags/#section'), '/tags/');
  assert.equal(normalizeRouteInput('/tags/?x=1#section'), '/tags/');
});

test('normalizeRouteInput: handles full URL', () => {
  assert.equal(normalizeRouteInput('https://ericcarlisle.com/tags/'), '/tags/');
});

test('normalizeRouteInput: empty or whitespace input', () => {
  assert.equal(normalizeRouteInput(''), '/');
  assert.equal(normalizeRouteInput('   '), '/');
});

test('buildPageResult returns all page fields', () => {
  const inventory = inventoryWith([page('/test/', { title: 'Test', inboundCount: 3 })], {
    commitSha: 'abc123',
  });
  const result = buildPageResult(inventory, firstPage(inventory));
  assert.equal(result.generatedCommit, 'abc123');
  assert.equal(result.page.route, '/test/');
  assert.equal(result.page.title, 'Test');
  assert.equal(result.page.description, 'Test description');
  assert.equal(result.page.classification, 'normal');
  assert.equal(result.page.built, true);
  assert.equal(result.page.inSitemap, true);
  assert.equal(result.page.canonical, 'https://ericcarlisle.com/test/');
  assert.equal(result.page.robots, 'index, follow');
  assert.equal(result.page.h1Count, 1);
  assert.deepEqual(result.page.h1Texts, ['Test Page']);
  assert.equal(result.page.redirectTarget, null);
  assert.equal(result.page.inboundCount, 3);
  assert.deepEqual(result.page.warnings, []);
});

test('buildPageResult preserves null fields', () => {
  const inventory = inventoryWith([
    page('/test/', {
      title: null,
      description: null,
      canonical: null,
      robots: null,
      redirectTarget: null,
    }),
  ]);
  const result = buildPageResult(inventory, firstPage(inventory));
  assert.equal(result.page.title, null);
  assert.equal(result.page.description, null);
  assert.equal(result.page.canonical, null);
  assert.equal(result.page.robots, null);
  assert.equal(result.page.redirectTarget, null);
});

test('buildPageResult includes warnings', () => {
  const inventory = inventoryWith([
    page('/test/', { warnings: [{ code: 'MISSING_TITLE', message: 'No title' }] }),
  ]);
  const result = buildPageResult(inventory, firstPage(inventory));
  assert.deepEqual(result.page.warnings, [{ code: 'MISSING_TITLE', message: 'No title' }]);
});

test('getPageToolHandler returns page for valid route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '/about/' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.equal(parsed.page.route, '/about/');
    assert.equal(parsed.page.title, 'About');
    assert.equal(parsed.generatedCommit, 'abc123');
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler normalizes route variants', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    for (const variant of ['/about/', 'about/', 'about', '/about']) {
      const result = await getPageToolHandler({ route: variant });
      assert.equal(result.isError, undefined);
      const parsed = JSON.parse(result.content[0]?.text ?? '');
      assert.equal(parsed.page.route, '/about/');
    }
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error for unknown route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '/nonexistent/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error for invalid route input', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    // @ts-expect-error testing invalid input
    const result = await getPageToolHandler({ route: 123 });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error for empty route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error for whitespace-only route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '   ' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error when inventory missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await getPageToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns error for malformed JSON inventory', async () => {
  const { filePath, cleanup } = createFixtureDir('{ not json');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not valid JSON/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getPageToolHandler returns clear error without stack traces', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getPageToolHandler({ route: '/nonexistent/' });
    const text = result.content[0]?.text ?? '';
    assert.ok(!text.includes('.js:'));
    assert.ok(!text.includes('file://'));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('RouteNotFoundError and InvalidRouteInputError have correct names', () => {
  assert.equal(new RouteNotFoundError('/test/').name, 'RouteNotFoundError');
  assert.equal(new InvalidRouteInputError('bad').name, 'InvalidRouteInputError');
});
