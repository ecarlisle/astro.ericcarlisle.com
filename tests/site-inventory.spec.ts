/**
 * Site inventory tests.
 *
 * Tests call the actual production functions in scripts/site-inventory-core.mjs
 * and scripts/generate-site-inventory.mjs — no copied implementations.
 */
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
  normalizeRoute,
  parseSitemapIndexXML,
  parseSitemapXML,
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

test('normalizeRoute: path with query string is stripped', () => {
  expect(normalizeRoute('/about/?x=1')).toBe('/about/');
});

test('normalizeRoute: path with fragment is stripped', () => {
  expect(normalizeRoute('/about/#section')).toBe('/about/');
});

test('normalizeRoute: path with query and fragment', () => {
  expect(normalizeRoute('/about/?x=1#section')).toBe('/about/');
});

test('normalizeRoute: canonical URL with query and fragment', () => {
  expect(normalizeRoute('https://ericcarlisle.com/about/?x=1#s')).toBe('/about/');
});

test('normalizeRoute: empty input becomes /', () => {
  expect(normalizeRoute('')).toBe('/');
  expect(normalizeRoute(null)).toBe('/');
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

test('resolveInternalLink: protocol-relative same-origin is internal', () => {
  expect(resolveInternalLink('//ericcarlisle.com/x/', '/')).toBe('/x/');
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

test('resolveInternalLink: fragments and plain assets excluded', () => {
  expect(resolveInternalLink('#section', '/')).toBeNull();
  expect(resolveInternalLink('/image.png', '/')).toBeNull();
  expect(resolveInternalLink('/styles.css', '/')).toBeNull();
});

test('resolveInternalLink: asset with query string is still an asset', () => {
  expect(resolveInternalLink('/document.pdf?download=1', '/')).toBeNull();
  expect(resolveInternalLink('https://ericcarlisle.com/asset.pdf?v=2', '/')).toBeNull();
});

test('resolveInternalLink: page link with query string resolves', () => {
  expect(resolveInternalLink('/about/?tab=1', '/')).toBe('/about/');
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
  expect(meta.redirectTarget).toBeNull();
});

test('extractMeta: missing fields return null', () => {
  const meta = extractMeta('<html><head></head><body></body></html>');
  expect(meta.title).toBeNull();
  expect(meta.description).toBeNull();
  expect(meta.canonical).toBeNull();
  expect(meta.robots).toBeNull();
  expect(meta.h1Count).toBe(0);
});

test('extractMeta: detects Astro meta-refresh redirect', () => {
  const html = `<!doctype html><html><head>
    <meta http-equiv="refresh" content="0;url=/blog/target/" />
    <meta name="robots" content="noindex" />
  </head><body></body></html>`;
  const meta = extractMeta(html);
  expect(meta.redirectTarget).toBe('/blog/target/');
});

test('extractMeta: detects meta-refresh with casing/attr-order variants', () => {
  const html = `<!doctype html><html><head>
    <meta content="0; url=https://ericcarlisle.com/other/" http-equiv="refresh">
  </head><body></body></html>`;
  const meta = extractMeta(html);
  expect(meta.redirectTarget).toBe('https://ericcarlisle.com/other/');
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

test('classifyPage: normal page with mismatched canonical stays normal', () => {
  // Canonical mismatch alone is NOT redirect evidence.
  const cls = classifyPage('/about/', { canonical: 'https://ericcarlisle.com/other/' });
  expect(cls.type).toBe('normal');
  expect(cls.isIndexable).toBe(true);
});

test('classifyPage: redirect from meta-refresh evidence', () => {
  const cls = classifyPage('/posts/x/', { redirectTarget: '/blog/x/' });
  expect(cls.type).toBe('redirect');
  expect(cls.isIndexable).toBe(false);
});

test('classifyPage: redirect from legacy route pattern', () => {
  const cls = classifyPage('/posts/3d-printing/box/', {});
  expect(cls.type).toBe('redirect');
});

test('classifyPage: noindex page', () => {
  const cls = classifyPage('/portfolio/design-system/', { robots: 'noindex, nofollow' });
  expect(cls.type).toBe('noindex');
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

test('detectWarnings: orphaned page (indexable, no inbound links)', () => {
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

test('detectWarnings: redirect page is not flagged orphaned', () => {
  // Non-indexable redirect with zero inbound links must not warn.
  const page = {
    inboundCount: 0,
    robots: 'noindex',
    canonical: 'https://ericcarlisle.com/blog/x/',
    redirectTarget: '/blog/x/',
    title: 'Redirecting',
    description: null,
    h1Count: 0,
  };
  const warnings = detectWarnings('/posts/x/', page, builtRoutes, sitemapRoutes);
  expect(warnings.filter((w) => w.code === 'ORPHANED_PAGE')).toHaveLength(0);
  expect(warnings.filter((w) => w.code === 'MISSING_DESCRIPTION')).toHaveLength(0);
  expect(warnings.filter((w) => w.code === 'MISSING_H1')).toHaveLength(0);
  expect(warnings.filter((w) => w.code === 'CANONICAL_MISMATCH')).toHaveLength(0);
});

test('detectWarnings: normal page with mismatched canonical gets CANONICAL_MISMATCH', () => {
  const page = {
    inboundCount: 1,
    robots: null,
    canonical: 'https://ericcarlisle.com/other/',
    title: 'T',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/about/', page, builtRoutes, sitemapRoutes);
  expect(warnings.filter((w) => w.code === 'CANONICAL_MISMATCH')).toHaveLength(1);
});

test('detectWarnings: redirect with missing destination gets CANONICAL_TARGET_MISSING', () => {
  const page = {
    inboundCount: 1,
    robots: 'noindex',
    canonical: 'https://ericcarlisle.com/missing-target/',
    redirectTarget: '/missing-target/',
    title: 'Redirecting',
    description: null,
    h1Count: 0,
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

test('detectWarnings: /tags/ is no longer exempt from orphan or sitemap checks', () => {
  // /tags/ is an indexable site page; without inbound links it is orphaned.
  const page = {
    inboundCount: 0,
    robots: null,
    canonical: 'https://ericcarlisle.com/tags/',
    title: 'Tags',
    description: 'D',
    h1Count: 1,
  };
  const warnings = detectWarnings('/tags/', page, new Set(['/tags/']), new Set([]));
  expect(warnings.filter((w) => w.code === 'ORPHANED_PAGE')).toHaveLength(1);
  expect(warnings.filter((w) => w.code === 'MISSING_FROM_SITEMAP')).toHaveLength(1);
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
    redirectTarget?: string | null;
    classification?: string;
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
  mkdirSync(join(dist, 'posts', '3d-printing'), { recursive: true });
  mkdirSync(join(dist, 'blog', '3d-printing'), { recursive: true });
  mkdirSync(join(dist, 'lab', 'site-inventory'), { recursive: true });
  mkdirSync(join(dist, 'design-system', 'lab'), { recursive: true });

  writeFileSync(
    join(dist, 'index.html'),
    '<html><head><title>Home — E</title><meta name="description" content="Home desc"><link rel="canonical" href="https://ericcarlisle.com/"><meta name="robots" content="index"></head><body><h1>Home</h1><a href="/about/">About</a></body></html>',
  );
  writeFileSync(
    join(dist, 'about', 'index.html'),
    '<html><head><title>About — E</title><meta name="description" content="About desc"><link rel="canonical" href="https://ericcarlisle.com/about/"></head><body><h1>About</h1><a href="/">Home</a></body></html>',
  );
  // Realistic Astro-generated redirect page.
  writeFileSync(
    join(dist, 'blog', '3d-printing', 'index.html'),
    '<html><head><title>3D Printing Blog — E</title><meta name="description" content="Blog desc"><link rel="canonical" href="https://ericcarlisle.com/blog/3d-printing/"></head><body><h1>3D Printing</h1><a href="/">Home</a></body></html>',
  );
  writeFileSync(
    join(dist, 'posts', '3d-printing', 'index.html'),
    '<!doctype html><title>Redirecting to: /blog/3d-printing/</title><meta http-equiv="refresh" content="0;url=/blog/3d-printing/"><meta name="robots" content="noindex"><link rel="canonical" href="https://ericcarlisle.com/blog/3d-printing/"><body><a href="/blog/3d-printing/">Redirecting</a></body>',
  );
  writeFileSync(
    join(dist, 'lab', 'site-inventory', 'index.html'),
    '<html><head><title>Site Inventory</title><meta name="robots" content="noindex"></head><body><h1>Site Inventory</h1></body></html>',
  );
  // Storybook external artifact.
  writeFileSync(
    join(dist, 'design-system', 'lab', 'index.html'),
    '<html><head><title>Component Lab</title></head><body><h1>Lab</h1></body></html>',
  );
  writeFileSync(
    join(dist, 'design-system', 'lab', 'iframe.html'),
    '<html><head><title>Story iframe</title></head><body></body></html>',
  );
  writeFileSync(
    join(dist, 'sitemap-0.xml'),
    '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://ericcarlisle.com/</loc></url><url><loc>https://ericcarlisle.com/about/</loc></url><url><loc>https://ericcarlisle.com/design-system/lab/</loc></url></urlset>',
  );

  return { tmp, dist };
}

test('generateInventory: fixture build produces correct inventory', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out = (await generateInventory(dist)) as unknown as GeneratorOutput;
    // 4 normal pages (/, /about/, /blog/3d-printing/, /posts/3d-printing/, /lab/site-inventory/)
    // + 1 external artifact (/design-system/lab/). iframe.html is excluded.
    expect(out.summary.builtPages).toBe(6);
    expect(out.summary.sitemapUrls).toBe(3);
    const routes = out.pages.map((p) => p.route).sort();
    expect(routes).toEqual([
      '/',
      '/about/',
      '/blog/3d-printing/',
      '/design-system/lab/',
      '/lab/site-inventory/',
      '/posts/3d-printing/',
    ]);
    const home = out.pages.find((p: { route: string }) => p.route === '/');
    expect(home?.title).toBe('Home — E');
    expect(home?.inboundCount).toBe(2); // linked from /about/ and /blog/3d-printing/
    expect(home?.inSitemap).toBe(true);
    expect(home?.warnings).toEqual([]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generateInventory: redirect page is classified and not orphan-warned', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out = (await generateInventory(dist)) as unknown as GeneratorOutput;
    const redirect = out.pages.find((p: { route: string }) => p.route === '/posts/3d-printing/');
    expect(redirect?.classification).toBe('redirect');
    expect(redirect?.redirectTarget).toBe('/blog/3d-printing/');
    expect(redirect?.warnings).toEqual([]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generateInventory: Storybook is a single external artifact', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    const out = (await generateInventory(dist)) as unknown as GeneratorOutput;
    // Only the root /design-system/lab/ artifact appears, not iframe.html.
    const lab = out.pages.find((p: { route: string }) => p.route === '/design-system/lab/');
    expect(lab?.classification).toBe('external-artifact');
    expect(lab?.built).toBe(true);
    expect(lab?.inSitemap).toBe(true);
    expect(lab?.warnings).toEqual([]);
    expect(out.pages.some((p: { route: string }) => p.route.includes('iframe.html'))).toBe(false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generateInventory: Storybook absent locally is represented accurately', async () => {
  const { generateInventory } = await import('../scripts/generate-site-inventory.mjs');
  const { tmp, dist } = buildFixtureDist();
  try {
    // Remove Storybook evidence file to simulate a local build without it.
    rmSync(join(dist, 'design-system', 'lab'), { recursive: true, force: true });
    const out = (await generateInventory(dist)) as unknown as GeneratorOutput;
    const lab = out.pages.find((p: { route: string }) => p.route === '/design-system/lab/');
    expect(lab?.built).toBe(false);
    expect(lab?.inSitemap).toBe(true);
    expect(lab?.warnings?.some((w: { code: string }) => w.code === 'NO_BUILT_PAGE')).toBe(true);
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
    const out1: unknown = await generateInventory(dist);
    const out2: unknown = await generateInventory(dist);
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
    expect(about?.inboundCount).toBe(0);
    expect(about?.warnings?.some((w: { code: string }) => w.code === 'ORPHANED_PAGE')).toBe(true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── Sitemap filter (astro.config.mjs) ────────────────────────────────────

test('sitemap filter: excludes /lab/* but preserves /design-system/lab/', () => {
  // Mirrors the pathname-aware filter used in astro.config.mjs.
  const filter = (page: string) => {
    const pathname = new URL(page).pathname;
    return (
      !pathname.startsWith('/lab/') &&
      !pathname.startsWith('/posts/') &&
      !pathname.startsWith('/portfolio/design-system/')
    );
  };
  expect(filter('https://ericcarlisle.com/lab/context/')).toBe(false);
  expect(filter('https://ericcarlisle.com/lab/site-inventory/')).toBe(false);
  expect(filter('https://ericcarlisle.com/posts/3d-printing/x/')).toBe(false);
  expect(filter('https://ericcarlisle.com/portfolio/design-system/')).toBe(false);
  expect(filter('https://ericcarlisle.com/design-system/lab/')).toBe(true);
  expect(filter('https://ericcarlisle.com/about/')).toBe(true);
});

// ─── Inventory page rendering ────────────────────────────────────────────

test('inventory page loads, shows summary and filters', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page).toHaveTitle(/Site Inventory/);
  await expect(page.locator('h1')).toContainText('Site Inventory');
  await expect(page.locator('.si-stat')).toHaveCount(5);
  await expect(page.locator('.si-filter-btn')).toHaveCount(6);
});

test('inventory page has noindex, nofollow', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('inventory page search typing preserves value and focus', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const search = page.locator('.si-search');
  await expect(search).toBeVisible();
  await search.focus();

  // Type character by character, as a real user would.
  for (const ch of '/about') {
    await page.keyboard.type(ch);
  }

  // The complete value must remain visible and the field must keep focus.
  await expect(search).toHaveValue('/about');
  await expect(search).toBeFocused();
  await expect(page.locator('#si-status')).toHaveText(/1 of \d+ routes/);
  await expect(page.locator('.si-table tbody tr')).toHaveCount(1);

  // Clearing restores all rows.
  await search.fill('');
  await expect(page.locator('#si-status')).toHaveText(/\d+ of \d+ routes/);
  await expect(page.locator('.si-table tbody tr').first()).toBeVisible();
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

// ─── Dynamic-content styling regression (computed styles) ────────────────

test('dynamic summary area uses flex layout with spacing', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const summary = page.locator('.si-summary');
  await expect(summary).toBeVisible();
  const display = await summary.evaluate((el) => getComputedStyle(el).display);
  const gap = await summary.evaluate((el) => getComputedStyle(el).gap);
  expect(display).toBe('flex');
  expect(gap).not.toBe('normal');
  expect(gap).not.toBe('');
});

test('stat card receives designed background and border', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const stat = page.locator('.si-stat').first();
  await expect(stat).toBeVisible();
  const bg = await stat.evaluate((el) => getComputedStyle(el).backgroundColor);
  const borderStyle = await stat.evaluate((el) => getComputedStyle(el).borderTopStyle);
  // Not the browser-default transparent background/border.
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(borderStyle).toBe('solid');
});

test('filter buttons are styled, not browser-default', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const btn = page.locator('.si-filter-btn').first();
  await expect(btn).toBeVisible();
  const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
  const padding = await btn.evaluate((el) => getComputedStyle(el).paddingTop);
  const fontFamily = await btn.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(padding)).toBeGreaterThan(0);
  expect(fontFamily).toContain('Fira Code');
});

test('search input receives intended sizing and styling', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const search = page.locator('.si-search');
  await expect(search).toBeVisible();
  const minWidth = await search.evaluate((el) => getComputedStyle(el).minWidth);
  const bg = await search.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(parseFloat(minWidth)).toBeGreaterThanOrEqual(100);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('inventory table has styled header with background', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const th = page.locator('.si-table th').first();
  await expect(th).toBeVisible();
  const bg = await th.evaluate((el) => getComputedStyle(el).backgroundColor);
  const fontWeight = await th.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(parseInt(fontWeight, 10)).toBeGreaterThanOrEqual(600);
});

test('details toggle receives its designed styling', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  // The About page has a canonical, so it has a Details toggle.
  await page.locator('.si-search').fill('/about');
  const toggle = page.locator('.si-details-toggle').first();
  await expect(toggle).toBeVisible();
  const fontFamily = await toggle.evaluate((el) => getComputedStyle(el).fontFamily);
  const cursor = await toggle.evaluate((el) => getComputedStyle(el).cursor);
  expect(fontFamily).toContain('Fira Code');
  expect(cursor).toBe('pointer');
  // Expand and verify the details block is revealed.
  await toggle.click();
  const hidden = await toggle
    .locator('xpath=following-sibling::dl[1]')
    .evaluate((el) => el.hasAttribute('hidden'));
  expect(hidden).toBe(false);
});

test('no horizontal viewport overflow at narrow widths', async ({ page }) => {
  for (const width of [375, 481, 600]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/lab/site-inventory/');
    await expect(page.locator('.si-table tbody tr').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `overflow at ${width}px`).toBe(false);
  }
});
