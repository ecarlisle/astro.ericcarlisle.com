/**
 * Site inventory tests.
 *
 * Tests call the actual production functions in scripts/site-inventory-core.mjs
 * and scripts/generate-site-inventory.mjs — no copied implementations.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  classifyPage,
  createInventoryOutput,
  detectDuplicateMetadata,
  detectWarnings,
  EXCEPTIONS,
  extractInternalLinks,
  extractMeta,
  matchesException,
  normalizeRoute,
  parseHTML,
  parseSitemapIndexXML,
  parseSitemapXML,
  parseXML,
  resolveInternalLink,
} from '../scripts/site-inventory-core.mjs';

// ─── Route normalization ─────────────────────────────────────────────────

test('normalizeRoute: root /', () => {
  expect(normalizeRoute('/')).toBe('/');
});

test('normalizeRoute: bare index.html becomes /', () => {
  expect(normalizeRoute('index.html')).toBe('/');
});

test('normalizeRoute: nested index.html', () => {
  expect(normalizeRoute('/about/index.html')).toBe('/about/');
});

test('normalizeRoute: trailing slash added', () => {
  expect(normalizeRoute('/about')).toBe('/about/');
});

test('normalizeRoute: strips protocol and host', () => {
  expect(normalizeRoute('https://ericcarlisle.com/about/')).toBe('/about/');
});

test('normalizeRoute: 404.html', () => {
  expect(normalizeRoute('/404.html')).toBe('/404.html/');
});

test('matchesException: prefix match', () => {
  expect(matchesException('/lab/context/', ['/lab/'])).toBe(true);
  expect(matchesException('/blog/post/', ['/lab/'])).toBe(false);
});

// ─── Link resolution ─────────────────────────────────────────────────────

test('resolveInternalLink: root-relative', () => {
  expect(resolveInternalLink('/about/', '/')).toBe('/about/');
});

test('resolveInternalLink: relative link resolves against source page', () => {
  // Relative links resolve against the source page directory, not the root.
  expect(resolveInternalLink('next/', '/blog/page/')).toBe('/blog/page/next/');
  expect(resolveInternalLink('../../about/', '/blog/page/')).toBe('/about/');
  expect(resolveInternalLink('./sibling/', '/blog/page/')).toBe('/blog/page/sibling/');
});

test('resolveInternalLink: same-origin absolute counts as internal', () => {
  expect(resolveInternalLink('https://ericcarlisle.com/about/', '/')).toBe('/about/');
});

test('resolveInternalLink: protocol-relative external excluded', () => {
  expect(resolveInternalLink('//other.example.com/page', '/')).toBeNull();
});

test('resolveInternalLink: external, mailto, tel, javascript, data excluded', () => {
  expect(resolveInternalLink('https://example.com/x', '/')).toBeNull();
  expect(resolveInternalLink('mailto:a@b.com', '/')).toBeNull();
  expect(resolveInternalLink('tel:+123', '/')).toBeNull();
  expect(resolveInternalLink('javascript:void(0)', '/')).toBeNull();
  expect(resolveInternalLink('data:text/html,x', '/')).toBeNull();
});

test('resolveInternalLink: fragments and assets excluded', () => {
  expect(resolveInternalLink('#section', '/')).toBeNull();
  expect(resolveInternalLink('/image.png', '/')).toBeNull();
  expect(resolveInternalLink('/styles.css', '/')).toBeNull();
});

test('extractInternalLinks: handles query strings and self-links', () => {
  const html = '<a href="/about/?tab=1">About</a><a href="/">Home</a>';
  const links = extractInternalLinks(html, '/');
  expect(links).toContain('/about/');
  expect(links).toContain('/');
});

// ─── HTML parsing with reordered attributes ──────────────────────────────

test('extractMeta: parses with reordered attributes', () => {
  const html = `<html><head>
    <title>Test — Eric Carlisle</title>
    <meta content="A description" name="description" />
    <link href="https://ericcarlisle.com/test/" rel="canonical" />
    <meta content="noindex, nofollow" name="robots" />
  </head><body><h1>Test</h1><h1>Second</h1></body></html>`;
  const meta = extractMeta(html);
  expect(meta.title).toBe('Test — Eric Carlisle');
  expect(meta.description).toBe('A description');
  expect(meta.canonical).toBe('https://ericcarlisle.com/test/');
  expect(meta.robots).toBe('noindex, nofollow');
  expect(meta.h1Count).toBe(2);
  expect(meta.h1Texts).toEqual(['Test', 'Second']);
});

test('extractMeta: missing fields return null', () => {
  const meta = extractMeta('<html><head></head><body></body></html>');
  expect(meta.title).toBeNull();
  expect(meta.description).toBeNull();
  expect(meta.canonical).toBeNull();
  expect(meta.robots).toBeNull();
  expect(meta.h1Count).toBe(0);
});

// ─── Sitemap parsing ─────────────────────────────────────────────────────

test('parseSitemapXML: extracts routes and lastmod', () => {
  const xml = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ericcarlisle.com/</loc><lastmod>2026-07-01</lastmod></url>
  <url><loc>https://ericcarlisle.com/about/</loc></url>
</urlset>`;
  const entries = parseSitemapXML(xml);
  expect(entries).toEqual([
    { route: '/', lastmod: '2026-07-01' },
    { route: '/about/', lastmod: null },
  ]);
});

test('parseSitemapIndexXML: extracts sitemap URLs', () => {
  const xml = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://ericcarlisle.com/sitemap-0.xml</loc></sitemap>
  <sitemap><loc>https://ericcarlisle.com/sitemap-1.xml</loc></sitemap>
</sitemapindex>`;
  expect(parseSitemapIndexXML(xml)).toEqual([
    'https://ericcarlisle.com/sitemap-0.xml',
    'https://ericcarlisle.com/sitemap-1.xml',
  ]);
});

// ─── Classification and warnings ─────────────────────────────────────────

const builtRoutes = new Set(['/', '/about/', '/blog/x/', '/posts/x/']);
const sitemapRoutes = new Set(['/', '/about/', '/blog/x/']);

test('classifyPage: normal page', () => {
  const cls = classifyPage('/about/', { canonical: 'https://ericcarlisle.com/about/' });
  expect(cls.type).toBe('normal');
  expect(cls.isIndexable).toBe(true);
});

test('classifyPage: noindex page', () => {
  const cls = classifyPage('/portfolio/design-system/', { robots: 'noindex, nofollow' });
  expect(cls.type).toBe('noindex');
  expect(cls.isIndexable).toBe(false);
});

test('classifyPage: redirect page', () => {
  const cls = classifyPage('/posts/x/', { canonical: 'https://ericcarlisle.com/blog/x/' });
  expect(cls.type).toBe('redirect');
  expect(cls.isIndexable).toBe(false);
});

test('classifyPage: 404 page', () => {
  const cls = classifyPage('/404.html/', { canonical: 'https://ericcarlisle.com/404/' });
  expect(cls.type).toBe('404');
  expect(cls.isIndexable).toBe(false);
});

test('classifyPage: lab page', () => {
  const cls = classifyPage('/lab/site-inventory/', {});
  expect(cls.type).toBe('lab');
});

test('classifyPage: external artifact (Storybook)', () => {
  const cls = classifyPage('/design-system/lab/', {});
  expect(cls.type).toBe('external-artifact');
});

test('detectWarnings: missing from sitemap for indexable page', () => {
  const page = {
    inboundCount: 1,
    robots: null,
    canonical: 'https://ericcarlisle.com/blog/x/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/blog/x/', page, new Set(['/', '/blog/x/']), new Set(['/']));
  expect(warnings.filter((w) => w.code === 'MISSING_FROM_SITEMAP')).toHaveLength(1);
});

test('detectWarnings: noindex page in sitemap', () => {
  const page = {
    inboundCount: 1,
    robots: 'noindex',
    canonical: 'https://ericcarlisle.com/lab/context/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/lab/context/', page, builtRoutes, new Set(['/lab/context/']));
  expect(warnings.filter((w) => w.code === 'NOINDEX_IN_SITEMAP')).toHaveLength(1);
});

test('detectWarnings: orphaned page', () => {
  const page = {
    inboundCount: 0,
    robots: null,
    canonical: 'https://ericcarlisle.com/about/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/about/', page, builtRoutes, sitemapRoutes);
  expect(warnings.filter((w) => w.code === 'ORPHANED_PAGE')).toHaveLength(1);
});

test('detectWarnings: canonical target missing for redirect', () => {
  const page = {
    inboundCount: 1,
    robots: 'noindex',
    canonical: 'https://ericcarlisle.com/missing-target/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/posts/x/', page, builtRoutes, sitemapRoutes);
  expect(warnings.filter((w) => w.code === 'CANONICAL_TARGET_MISSING')).toHaveLength(1);
});

test('detectWarnings: 404 canonical mismatch is not flagged', () => {
  const page = {
    inboundCount: 1,
    robots: null,
    canonical: 'https://ericcarlisle.com/404/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/404.html/', page, builtRoutes, sitemapRoutes);
  expect(warnings.filter((w) => w.code === 'CANONICAL_MISMATCH')).toHaveLength(0);
});

test('detectWarnings: missing title, description, H1, multiple H1s', () => {
  const page = {
    inboundCount: 1,
    robots: null,
    canonical: 'https://ericcarlisle.com/about/',
    title: null,
    description: null,
    h1Count: 2,
  };
  const warnings = detectWarnings('/about/', page, builtRoutes, sitemapRoutes);
  const codes = warnings.map((w) => w.code);
  expect(codes).toContain('MISSING_TITLE');
  expect(codes).toContain('MISSING_DESCRIPTION');
  expect(codes).toContain('MULTIPLE_H1S');
  expect(codes).not.toContain('MISSING_H1');
});

test('detectDuplicateMetadata: flags shared titles and descriptions', () => {
  const pages = [
    { route: '/a/', title: 'Same', description: 'Desc' },
    { route: '/b/', title: 'Same', description: 'Other' },
    { route: '/c/', title: 'Unique', description: 'Desc' },
  ];
  const warnings = detectDuplicateMetadata(pages);
  const codes = warnings.map((w) => w.code);
  expect(codes).toContain('DUPLICATE_TITLE');
  expect(codes).toContain('DUPLICATE_DESCRIPTION');
});

// ─── Deterministic output ────────────────────────────────────────────────

test('createInventoryOutput: deterministic ordering and no timestamp', () => {
  const out1 = createInventoryOutput({
    pages: [{ route: '/b/' }, { route: '/a/' }],
    summary: { totalUrls: 2 },
    provenance: { commitSha: 'abc' },
  });
  const out2 = createInventoryOutput({
    pages: [{ route: '/b/' }, { route: '/a/' }],
    summary: { totalUrls: 2 },
    provenance: { commitSha: 'abc' },
  });
  expect(out1).toEqual(out2);
  expect(out1.pages.map((p) => p.route)).toEqual(['/a/', '/b/']);
  expect(out1).not.toHaveProperty('generatedAt');
});

// ─── Generator integration (temp directories) ────────────────────────────

/** Loose structural type for the .mjs generator output. */
type GeneratorOutput = {
  pages: {
    route: string;
    title?: string | null;
    description?: string | null;
    canonical?: string | null;
    robots?: string | null;
    built?: boolean;
    inSitemap?: boolean;
    inboundCount?: number;
    h1Count?: number;
    h1Texts?: string[];
    warnings?: { code: string; message: string }[];
  }[];
  summary: {
    totalUrls: number;
    builtPages: number;
    sitemapUrls: number;
    orphanedPages: number;
    pagesWithWarnings: number;
    totalWarnings: number;
  };
  provenance?: Record<string, unknown>;
};

/** Build a tiny dist/ fixture and run generateInventory against it. */
function buildFixtureDist() {
  const tmp = mkdtempSync(join(tmpdir(), 'si-fixture-'));
  const dist = join(tmp, 'dist');
  mkdirSync(join(dist, 'about'), { recursive: true });
  mkdirSync(join(dist, 'lab', 'site-inventory'), { recursive: true });

  writeFileSync(
    join(dist, 'index.html'),
    '<html><head><title>Home — E</title><meta name="description" content="Home desc"><link rel="canonical" href="https://ericcarlisle.com/"><meta name="robots" content="index"></head><body><h1>Home</h1><a href="/about/">About</a></body></html>',
  );
  writeFileSync(
    join(dist, 'about', 'index.html'),
    '<html><head><title>About — E</title><meta name="description" content="About desc"><link rel="canonical" href="https://ericcarlisle.com/about/"></head><body><h1>About</h1><a href="/">Home</a></body></html>',
  );
  writeFileSync(
    join(dist, 'sitemap-0.xml'),
    '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://ericcarlisle.com/</loc></url><url><loc>https://ericcarlisle.com/about/</loc></url></urlset>',
  );

  return { tmp, dist };
}

test('generateInventory: fixture build produces correct inventory', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out = (await generateInventory(dist)) as unknown as GeneratorOutput;
    expect(out.summary.builtPages).toBe(2);
    expect(out.summary.sitemapUrls).toBe(2);
    expect(out.pages.map((p: { route: string }) => p.route).sort()).toEqual(['/', '/about/']);
    const home = out.pages.find((p: { route: string }) => p.route === '/');
    expect(home && home.title).toBe('Home — E');
    expect(home && home.inboundCount).toBe(1); // linked from /about/
    expect(home && home.inSitemap).toBe(true);
    expect(home && home.warnings).toEqual([]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generateInventory: missing dist fails with actionable error', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  await expect(generateInventory('/nonexistent/dist-dir')).rejects.toThrow(
    /dist\/ directory not found/,
  );
});

test('generateInventory: deterministic across runs', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out1 = (await generateInventory(dist)) as unknown as GeneratorOutput;
    const out2 = (await generateInventory(dist)) as unknown as GeneratorOutput;
    expect(JSON.stringify(out1)).toBe(JSON.stringify(out2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generateInventory: changing a page changes the inventory', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out1 = (await generateInventory(dist)) as unknown as GeneratorOutput;
    // Change the home page title and remove the about link.
    writeFileSync(
      join(dist, 'index.html'),
      '<html><head><title>New Home — E</title><meta name="description" content="Home desc"><link rel="canonical" href="https://ericcarlisle.com/"></head><body><h1>Home</h1></body></html>',
    );
    const out2 = (await generateInventory(dist)) as unknown as GeneratorOutput;
    expect(out1.pages.find((p: { route: string }) => p.route === '/')?.title).toBe('Home — E');
    expect(out2.pages.find((p: { route: string }) => p.route === '/')?.title).toBe('New Home — E');
    // /about/ is now orphaned.
    const about = out2.pages.find((p: { route: string }) => p.route === '/about/');
    expect(about && about.inboundCount).toBe(0);
    expect(
      about &&
        about.warnings &&
        about.warnings.some((w: { code: string }) => w.code === 'ORPHANED_PAGE'),
    ).toBe(true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── Inventory page rendering ────────────────────────────────────────────

test('inventory page loads, shows summary and filters', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page).toHaveTitle(/Site Inventory/);
  await expect(page.locator('h1')).toContainText('Site Inventory');
  // Data loads from the deployed JSON (written by postbuild).
  await expect(page.locator('.si-stat')).toHaveCount(5);
  await expect(page.locator('.si-filter-btn')).toHaveCount(6);
});

test('inventory page has noindex, nofollow', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('inventory page search filters rows', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const search = page.locator('.si-search');
  await expect(search).toBeVisible();
  await search.fill('/about');
  await expect(page.locator('#si-status')).toContainText(/1 of \d+ routes/);
});

test('inventory page filter buttons update aria-pressed', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const warningsBtn = page.locator('.si-filter-btn[data-filter="warnings"]');
  await warningsBtn.click();
  await expect(warningsBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.si-filter-btn[data-filter="all"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});
