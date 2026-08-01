/**
 * Tests for the get_related_pages tool.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { InventoryPage, SiteInventory } from '../src/graph/schema.js';
import { getRelatedPagesToolHandler } from '../src/tools/get-related-pages.js';
import { calculateRelatedPages, RELATED_PAGES_WEIGHTS } from '../src/tools/related-pages.js';
import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

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
    incoming: [],
    outgoing: [],
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

test('calculateRelatedPages: direct outgoing link', () => {
  const inventory = inventoryWith([
    page('/a/', { outgoing: ['/b/'] }),
    page('/b/', { incoming: ['/a/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/b/');
  assert.ok(results[0]?.score >= 1000);
  assert.ok(results[0]?.reasons.includes('linked directly'));
});

test('calculateRelatedPages: direct incoming link', () => {
  const inventory = inventoryWith([
    page('/a/', { incoming: ['/b/'] }),
    page('/b/', { outgoing: ['/a/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/b/');
  assert.ok(results[0]?.score >= 1000);
  assert.ok(results[0]?.reasons.includes('linked from this page'));
});

test('calculateRelatedPages: bidirectional links', () => {
  const inventory = inventoryWith([
    page('/a/', { outgoing: ['/b/'], incoming: ['/b/'] }),
    page('/b/', { outgoing: ['/a/'], incoming: ['/a/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  const b = results[0];
  assert.ok(b);
  assert.ok(b.score >= 2000);
});

test('calculateRelatedPages: shared incoming neighbor', () => {
  const inventory = inventoryWith([
    page('/a/', { incoming: ['/c/'] }),
    page('/b/', { incoming: ['/c/'] }),
    page('/c/', { outgoing: ['/a/', '/b/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  // /c/ is also a result (it links to /a/ directly). /b/ must be present
  // with the shared-incoming-neighbor signal.
  const b = results.find((r) => r.route === '/b/');
  assert.ok(b);
  assert.ok(b.score >= 300);
  assert.ok(b.reasons.includes('shared incoming neighbor: /c/'));
});

test('calculateRelatedPages: shared outgoing neighbor', () => {
  const inventory = inventoryWith([
    page('/a/', { outgoing: ['/c/'] }),
    page('/b/', { outgoing: ['/c/'] }),
    page('/c/', { incoming: ['/a/', '/b/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  // /c/ is also a result (it is linked from /a/ directly). /b/ must be
  // present with the shared-outgoing-neighbor signal.
  const b = results.find((r) => r.route === '/b/');
  assert.ok(b);
  assert.ok(b.score >= 300);
  assert.ok(b.reasons.includes('shared outgoing neighbor: /c/'));
});

test('calculateRelatedPages: shared classification normal has reduced weight', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Alpha', description: 'A', h1Texts: ['Alpha'], classification: 'normal' }),
    page('/b/', { title: 'Beta', description: 'B', h1Texts: ['Beta'], classification: 'normal' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/b/');
  // "normal" is shared by most pages, so it is a weak signal.
  assert.equal(results[0]?.score, RELATED_PAGES_WEIGHTS.sharedClassificationNormal);
  assert.ok(results[0]?.reasons.includes('shared classification: normal'));
});

test('calculateRelatedPages: shared classification lab retains distinctive weight', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Alpha', description: 'A', h1Texts: ['Alpha'], classification: 'lab' }),
    page('/b/', { title: 'Beta', description: 'B', h1Texts: ['Beta'], classification: 'lab' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/b/');
  // Distinctive classifications keep a stronger relationship signal.
  assert.equal(results[0]?.score, RELATED_PAGES_WEIGHTS.sharedClassificationDistinctive);
  assert.ok(results[0]?.reasons.includes('shared classification: lab'));
});

test('calculateRelatedPages: shared classification does not fire on mismatched classes', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Alpha', description: 'A', h1Texts: ['Alpha'], classification: 'lab' }),
    page('/b/', { title: 'Beta', description: 'B', h1Texts: ['Beta'], classification: 'normal' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('calculateRelatedPages: shared title token', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Context Health' }),
    page('/b/', { title: 'Context API' }),
    page('/c/', { title: 'Other Page' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  // /b/ shares 'context' token, /c/ shares nothing
  const contextResults = results.filter((r) => r.route === '/b/');
  assert.equal(contextResults.length, 1);
  const context = contextResults[0];
  assert.ok(context);
  assert.ok(context.score >= 150);
  assert.ok(context.reasons.some((r) => r.includes('shared title token')));
});

test('calculateRelatedPages: shared description token', () => {
  const inventory = inventoryWith([
    page('/a/', { description: 'Context health assessment' }),
    page('/b/', { description: 'Context monitoring' }),
    page('/c/', { description: 'Other description' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  const contextResults = results.filter((r) => r.route === '/b/');
  assert.equal(contextResults.length, 1);
  const context = contextResults[0];
  assert.ok(context);
  assert.ok(context.score >= 100);
  assert.ok(context.reasons.some((r) => r.includes('shared description token')));
});

test('calculateRelatedPages: shared heading token', () => {
  const inventory = inventoryWith([
    page('/a/', { h1Texts: ['Context Health'] }),
    page('/b/', { h1Texts: ['Context API'] }),
    page('/c/', { h1Texts: ['Other'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  const contextResults = results.filter((r) => r.route === '/b/');
  assert.equal(contextResults.length, 1);
  const context = contextResults[0];
  assert.ok(context);
  assert.ok(context.score >= 100);
  assert.ok(context.reasons.some((r) => r.includes('shared heading token')));
});

test('calculateRelatedPages: shared incoming neighbor score is capped', () => {
  // The shared neighbors are route strings only; they do not need to exist as
  // pages (the real inventory references routes the same way).
  const shared = ['/n1/', '/n2/', '/n3/', '/n4/', '/n5/'];
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha',
      description: 'A',
      h1Texts: ['Alpha'],
      classification: 'lab',
      incoming: shared,
    }),
    page('/b/', {
      title: 'Beta',
      description: 'B',
      h1Texts: ['Beta'],
      classification: 'normal',
      incoming: shared,
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  const b = results.find((r) => r.route === '/b/');
  assert.ok(b);
  // 5 shared incoming neighbors, but only 3 are counted: 3 * 300 = 900.
  assert.equal(b.score, 900);
  // The reason still reports the actual (uncapped) count.
  assert.ok(b.reasons.includes('5 shared incoming neighbors'));
});

test('calculateRelatedPages: shared outgoing neighbor score is capped', () => {
  const shared = ['/n1/', '/n2/', '/n3/', '/n4/', '/n5/'];
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha',
      description: 'A',
      h1Texts: ['Alpha'],
      classification: 'lab',
      outgoing: shared,
    }),
    page('/b/', {
      title: 'Beta',
      description: 'B',
      h1Texts: ['Beta'],
      classification: 'normal',
      outgoing: shared,
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  const b = results.find((r) => r.route === '/b/');
  assert.ok(b);
  // 5 shared outgoing neighbors, but only 3 are counted: 3 * 300 = 900.
  assert.equal(b.score, 900);
  // The reason still reports the actual (uncapped) count.
  assert.ok(b.reasons.includes('5 shared outgoing neighbors'));
});

test('calculateRelatedPages: stop words do not create matches', () => {
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha',
      description: 'with for from the to',
      h1Texts: ['Alpha'],
      classification: 'lab',
    }),
    page('/b/', {
      title: 'Beta',
      description: 'with for from the to',
      h1Texts: ['Beta'],
      classification: 'normal',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('calculateRelatedPages: with does not create a relationship', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Alpha', description: 'with', h1Texts: ['Alpha'], classification: 'lab' }),
    page('/b/', {
      title: 'Beta',
      description: 'with',
      h1Texts: ['Beta'],
      classification: 'normal',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('calculateRelatedPages: eric and carlisle do not create title similarity', () => {
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha | Eric Carlisle',
      description: 'A',
      h1Texts: ['Alpha'],
      classification: 'lab',
    }),
    page('/b/', {
      title: 'Beta | Eric Carlisle',
      description: 'B',
      h1Texts: ['Beta'],
      classification: 'normal',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('calculateRelatedPages: direct links remain strong signals', () => {
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha',
      description: 'A',
      h1Texts: ['Alpha'],
      classification: 'normal',
      outgoing: ['/b/'],
    }),
    page('/b/', {
      title: 'Beta',
      description: 'B',
      h1Texts: ['Beta'],
      classification: 'normal',
      incoming: ['/a/'],
    }),
    page('/c/', {
      title: 'Alpha Theme',
      description: 'Alpha description',
      h1Texts: ['Alpha'],
      classification: 'normal',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  const first = results[0];
  assert.ok(first);
  assert.equal(first.route, '/b/');
  // A direct link outweighs token-only similarity.
  assert.ok(first.score > (results[1]?.score ?? 0));
});

test('calculateRelatedPages: same tag', () => {
  const inventory = inventoryWith([
    page('/tags/context/page1/', { title: 'Page 1' }),
    page('/tags/context/page2/', { title: 'Page 2' }),
  ]);
  const results = calculateRelatedPages(inventory, '/tags/context/page1/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/tags/context/page2/');
  assert.ok(results[0]?.score >= 200);
  assert.ok(results[0]?.reasons.some((r) => r.includes('shared tag: context')));
});

test('calculateRelatedPages: cumulative scoring', () => {
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Context Page',
      description: 'Alpha',
      h1Texts: ['Alpha'],
      outgoing: ['/b/'],
      incoming: ['/b/'],
      classification: 'normal',
    }),
    page('/b/', {
      title: 'Context API',
      description: 'Beta',
      h1Texts: ['Beta'],
      outgoing: ['/a/'],
      incoming: ['/a/'],
      classification: 'normal',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.route, '/b/');
  // directOutgoing (1000) + directIncoming (1000) + sharedClassification
  // normal (50) + sharedTitleToken 'context' (150) = 2200
  assert.equal(results[0]?.score, 2200);
  assert.ok(results[0]?.reasons.includes('linked directly'));
  assert.ok(results[0]?.reasons.includes('linked from this page'));
  assert.ok(results[0]?.reasons.includes('shared classification: normal'));
  assert.ok(results[0]?.reasons.includes('shared title token: context'));
});

test('calculateRelatedPages: deterministic ordering', () => {
  const inventory = inventoryWith([
    page('/a/', {
      title: 'Alpha Page',
      description: 'Alpha desc',
      h1Texts: ['Alpha'],
      classification: 'normal',
    }),
    page('/alpha/', {
      title: 'Alpha Page',
      description: 'Alpha desc',
      h1Texts: ['Alpha'],
      classification: 'normal',
    }),
    page('/zebra/', {
      title: 'Alpha Page',
      description: 'Alpha desc',
      h1Texts: ['Alpha'],
      classification: 'normal',
    }),
    page('/beta/', {
      title: 'Beta Page',
      description: 'Beta desc',
      h1Texts: ['Beta'],
      classification: 'lab',
    }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  // /alpha/ and /zebra/ tie on score (800) and title, so route breaks the
  // tie. /beta/ scores lower (250) via the shared 'page'/'desc' tokens only.
  assert.equal(results.length, 3);
  assert.equal(results[0]?.route, '/alpha/');
  assert.equal(results[1]?.route, '/zebra/');
  assert.equal(results[2]?.route, '/beta/');
  assert.ok(results[0]?.score >= results[1]?.score);
  assert.ok(results[1]?.score >= results[2]?.score);
});

test('calculateRelatedPages: respects limit', () => {
  const inventory = inventoryWith([
    page('/a/', { outgoing: ['/b/', '/c/', '/d/', '/e/', '/f/', '/g/'] }),
    page('/b/', { incoming: ['/a/'] }),
    page('/c/', { incoming: ['/a/'] }),
    page('/d/', { incoming: ['/a/'] }),
    page('/e/', { incoming: ['/a/'] }),
    page('/f/', { incoming: ['/a/'] }),
    page('/g/', { incoming: ['/a/'] }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/', 3);
  assert.equal(results.length, 3);
});

test('calculateRelatedPages: returns empty for no relations', () => {
  const inventory = inventoryWith([
    page('/a/', { title: 'Alpha', description: 'A', h1Texts: ['Alpha'], classification: 'normal' }),
    page('/b/', { title: 'Beta', description: 'B', h1Texts: ['Beta'], classification: 'lab' }),
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('calculateRelatedPages: skips self', () => {
  const inventory = inventoryWith([
    page('/a/', { outgoing: ['/a/'] }), // self-link
  ]);
  const results = calculateRelatedPages(inventory, '/a/');
  assert.deepEqual(results, []);
});

test('getRelatedPagesToolHandler: returns results for valid route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/about/' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.equal(parsed.route, '/about/');
    assert.ok(Array.isArray(parsed.results));
    assert.ok(typeof parsed.resultCount === 'number');
    assert.ok(parsed.results.every((r: { reasons: string[] }) => Array.isArray(r.reasons)));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: normalizes route variants', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    for (const variant of ['/about/', 'about/', 'about', '/about']) {
      const result = await getRelatedPagesToolHandler({ route: variant });
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

test('getRelatedPagesToolHandler: returns error for unknown route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/nonexistent/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns error for invalid route input', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: 123 } as unknown as { route: string });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns error for empty route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns error for whitespace-only route', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '   ' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /Route must be a non-empty string/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns error when inventory missing', async () => {
  const { dir, cleanup } = createFixtureDir('{}');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = `${dir}/nope.json`;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not found/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns error for malformed JSON inventory', async () => {
  const { filePath, cleanup } = createFixtureDir('{ not json');
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/about/' });
    assert.equal(result.isError, true);
    assert.match(result.content[0]?.text ?? '', /not valid JSON/);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns clear error without stack traces', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/nonexistent/' });
    const text = result.content[0]?.text ?? '';
    assert.ok(!text.includes('.js:'));
    assert.ok(!text.includes('file://'));
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: includes reasons array', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/about/' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.ok(parsed.results.length > 0);
    for (const page of parsed.results) {
      assert.ok(Array.isArray(page.reasons));
      assert.ok(page.reasons.length > 0);
    }
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});

test('getRelatedPagesToolHandler: returns limited results', async () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
  try {
    const result = await getRelatedPagesToolHandler({ route: '/' });
    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    assert.ok(parsed.resultCount <= 5);
  } finally {
    if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    cleanup();
  }
});
