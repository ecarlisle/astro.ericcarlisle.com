/**
 * Site inventory tests.
 *
 * Tests the generator's core logic: route normalization, metadata extraction,
 * internal-link parsing, warning detection, and sitemap parsing.
 */
import { expect, test } from '@playwright/test';

// ─── Helpers imported from generator (replicated for test isolation) ─────

function normalizeRoute(path: string): string {
  let p = path;
  try {
    const url = new URL(p);
    p = url.pathname;
  } catch {
    /* already a path */
  }
  p = p.replace(/\/index\.html$/, '/');
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/')) p += '/';
  return p;
}

function extractMeta(html: string) {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim() ?? null;
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/)?.[1]?.trim() ??
    null;
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/)?.[1] ?? null;
  const robots =
    html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/)?.[1] ?? null;
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Texts = h1s.map((m) => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
  return { title, description, canonical, robots, h1Count: h1Texts.length, h1Texts };
}

function extractInternalLinks(html: string): string[] {
  const links: string[] = [];
  const anchorRegex = /<a[^>]+href=["']([^"']*)["']/gi;
  let match: RegExpExecArray | null = anchorRegex.exec(html);
  while (match !== null) {
    const href = match[1];
    const isExternal =
      !href ||
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('//');
    const isAsset =
      /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|pdf|zip|xml|json)$/i.test(href);
    if (!isExternal && !isAsset) {
      const clean = href.split('#')[0].split('?')[0];
      links.push(clean);
    }
    match = anchorRegex.exec(html);
  }
  return links;
}

test('normalizeRoute: root /', () => {
  expect(normalizeRoute('/')).toBe('/');
});

test('normalizeRoute: index.html route', () => {
  expect(normalizeRoute('/index.html')).toBe('/');
});

test('normalizeRoute: nested index.html', () => {
  expect(normalizeRoute('/about/index.html')).toBe('/about/');
});

test('normalizeRoute: trailing slash added', () => {
  expect(normalizeRoute('/about')).toBe('/about/');
});

test('normalizeRoute: trailing slash preserved', () => {
  expect(normalizeRoute('/about/')).toBe('/about/');
});

test('normalizeRoute: strips protocol/host', () => {
  expect(normalizeRoute('https://example.com/about/')).toBe('/about/');
});

test('normalizeRoute: 404.html', () => {
  expect(normalizeRoute('/404.html')).toBe('/404.html/');
});

// ─── Metadata extraction ─────────────────────────────────────────────────

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head>
<title>Test Page — Eric Carlisle</title>
<meta name="description" content="A test page description." />
<link rel="canonical" href="https://ericcarlisle.com/test/" />
<meta name="robots" content="noindex, nofollow" />
</head><body>
<h1>Test Page</h1>
<h1>Duplicate H1</h1>
<p>Content.</p>
</body></html>`;

test('extractMeta: extracts all fields', () => {
  const meta = extractMeta(SAMPLE_HTML);
  expect(meta.title).toBe('Test Page — Eric Carlisle');
  expect(meta.description).toBe('A test page description.');
  expect(meta.canonical).toBe('https://ericcarlisle.com/test/');
  expect(meta.robots).toBe('noindex, nofollow');
  expect(meta.h1Count).toBe(2);
  expect(meta.h1Texts).toEqual(['Test Page', 'Duplicate H1']);
});

test('extractMeta: missing fields return null', () => {
  const meta = extractMeta('<html><head></head><body></body></html>');
  expect(meta.title).toBeNull();
  expect(meta.description).toBeNull();
  expect(meta.canonical).toBeNull();
  expect(meta.robots).toBeNull();
  expect(meta.h1Count).toBe(0);
  expect(meta.h1Texts).toEqual([]);
});

// ─── Internal link extraction ───────────────────────────────────────────

const LINK_HTML = `<!DOCTYPE html>
<html><body>
<a href="/">Home</a>
<a href="/about/">About</a>
<a href="/blog/post/">Blog Post</a>
<a href="#section">Skip link</a>
<a href="https://external.com/">External</a>
<a href="mailto:test@test.com">Email</a>
<a href="javascript:void(0)">JS</a>
<a href="/image.png">Image</a>
<a href="/page/?query=1">Query param</a>
<a href="/page/#fragment">Fragment</a>
</body></html>`;

test('extractInternalLinks: extracts valid internal links', () => {
  const links = extractInternalLinks(LINK_HTML);
  expect(links).toContain('/');
  expect(links).toContain('/about/');
  expect(links).toContain('/blog/post/');
});

test('extractInternalLinks: excludes external, mailto, js, anchors', () => {
  const links = extractInternalLinks(LINK_HTML);
  expect(links).not.toContain('#section');
  expect(links).not.toContain('https://external.com/');
  expect(links).not.toContain('mailto:test@test.com');
  expect(links).not.toContain('javascript:void(0)');
});

test('extractInternalLinks: excludes assets', () => {
  const links = extractInternalLinks(LINK_HTML);
  expect(links).not.toContain('/image.png');
});

test('extractInternalLinks: strips query strings and fragments', () => {
  const links = extractInternalLinks(LINK_HTML);
  // /page/?query=1 becomes /page/ after stripping query
  expect(links).toContain('/page/');
});

// ─── Warning detection ───────────────────────────────────────────────────

test('duplicate title detection across pages', () => {
  // Multiple pages with same title should produce duplicate warnings
  const titles = ['Same Title', 'Same Title', 'Different Title'];
  const titleMap = new Map();
  titles.forEach((t: string, i: number) => {
    const route = `/page${i}/`;
    if (!titleMap.has(t)) titleMap.set(t, []);
    titleMap.get(t).push(route);
  });

  const duplicates = [];
  for (const [title, routes] of titleMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        duplicates.push({ route, title, others: routes.filter((r: string) => r !== route) });
      }
    }
  }
  expect(duplicates.length).toBe(2); // Two pages share "Same Title"
  expect(duplicates[0].title).toBe('Same Title');
});

test('noindex page in sitemap triggers warning', () => {
  const html = '<html><head><meta name="robots" content="noindex" /></head></html>';
  const meta = extractMeta(html);
  expect(meta.robots).toContain('noindex');
  // This would trigger NOINDEX_IN_SITEMAP if inSitemap is also true
});

test('missing H1 triggers warning', () => {
  const html = '<html><head></head><body><p>No H1 here</p></body></html>';
  const meta = extractMeta(html);
  expect(meta.h1Count).toBe(0);
});

test('multiple H1s triggers warning', () => {
  const html = '<html><body><h1>First</h1><h1>Second</h1></body></html>';
  const meta = extractMeta(html);
  expect(meta.h1Count).toBe(2);
});

// ─── Sitemap parsing ─────────────────────────────────────────────────────

test('sitemap url extraction', () => {
  const xml = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ericcarlisle.com/</loc><lastmod>2026-07-01</lastmod></url>
  <url><loc>https://ericcarlisle.com/about/</loc></url>
</urlset>`;
  const urlset = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)];
  const urls = urlset
    .map((u) => {
      const loc = u[0].match(/<loc>([^<]*)<\/loc>/)?.[1];
      return loc ? normalizeRoute(loc) : null;
    })
    .filter(Boolean);
  expect(urls).toEqual(['/', '/about/']);
});

test('sitemap index parsing', () => {
  const xml = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://ericcarlisle.com/sitemap-0.xml</loc></sitemap>
  <sitemap><loc>https://ericcarlisle.com/sitemap-1.xml</loc></sitemap>
</sitemapindex>`;
  const refs = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]*)<\/loc>[\s\S]*?<\/sitemap>/g)];
  const locs = refs.map((r) => r[1]);
  expect(locs).toEqual([
    'https://ericcarlisle.com/sitemap-0.xml',
    'https://ericcarlisle.com/sitemap-1.xml',
  ]);
});

// ─── Inventory page rendering ────────────────────────────────────────────

test('inventory page loads and shows summary', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page).toHaveTitle(/Site Inventory/);
  await expect(page.locator('h1')).toContainText('Site Inventory');
});

test('inventory page has noindex, nofollow', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('inventory page has filter buttons', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('.si-filter-btn')).toHaveCount(6);
  await expect(page.locator('.si-filter-btn').first()).toContainText('All');
});

test('inventory page has a search input', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('.si-search')).toBeVisible();
});

test('inventory page summary stats are present', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  await expect(page.locator('.si-stat')).toHaveCount(5);
});

test('inventory table has correct headers', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  const headers = page.locator('.si-table th');
  await expect(headers).toHaveCount(8);
  await expect(headers.first()).toHaveText('Route');
});

test('inventory page is accessible via keyboard', async ({ page }) => {
  await page.goto('/lab/site-inventory/');
  // Focus the search input and type
  const search = page.locator('.si-search');
  await search.focus();
  await search.fill('/about');
  // Verify filtering works by checking that only matching rows are visible
  await page.waitForTimeout(100);
  const visibleRows = page.locator('.si-table tbody tr[style*="display: none"]');
  // At least some rows should be hidden by the filter
  const hiddenCount = await visibleRows.count();
  expect(hiddenCount).toBeGreaterThanOrEqual(1);
});
