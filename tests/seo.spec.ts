import { expect, test } from '@playwright/test';

/**
 * SEO metadata regression checks.
 *
 * Verify that important pages include the metadata the site is
 * designed to provide: title, description, canonical link, and
 * Open Graph tags. These tests match the current BaseHead output.
 */

interface MetadataExpectations {
  path: string;
  titlePattern: RegExp;
  descriptionNonEmpty: boolean;
  hasCanonical: boolean;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
}

const pages: MetadataExpectations[] = [
  {
    path: '/',
    titlePattern: /Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
  {
    path: '/about/',
    // Accept both pipe (|) and em dash (—) separators for resilience.
    titlePattern: /About Me [|\u2014] Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
  {
    path: '/blog/',
    titlePattern: /Blog [|\u2014] Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
  {
    path: '/portfolio/',
    titlePattern: /Frontend Engineering & UX Portfolio [|\u2014] Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
  {
    path: '/speaking/',
    titlePattern: /Selected Talks [|\u2014] Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
  {
    path: '/contact/',
    titlePattern: /Contact [|\u2014] Eric Carlisle/,
    descriptionNonEmpty: true,
    hasCanonical: true,
    hasOgTitle: true,
    hasOgDescription: true,
  },
];

for (const {
  path,
  titlePattern,
  descriptionNonEmpty,
  hasCanonical,
  hasOgTitle,
  hasOgDescription,
} of pages) {
  test(`${path} has expected SEO metadata`, async ({ page }) => {
    await page.goto(path);

    // Document title
    await expect(page).toHaveTitle(titlePattern);

    // Meta description
    if (descriptionNonEmpty) {
      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute('content', /.+/);
    }

    // Canonical link
    if (hasCanonical) {
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /^https:\/\/ericcarlisle\.com\//);
    }

    // Open Graph title
    if (hasOgTitle) {
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /.+/);
    }

    // Open Graph description
    if (hasOgDescription) {
      const ogDesc = page.locator('meta[property="og:description"]');
      await expect(ogDesc).toHaveAttribute('content', /.+/);
    }
  });
}

// ─── Indexing policy (noindex / indexable) ───────────────────────────────

test('/portfolio/design-system/ is indexable', async ({ page }) => {
  await page.goto('/portfolio/design-system/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/index/);
});

test('/search/ is noindex, follow', async ({ page }) => {
  await page.goto('/search/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/noindex/);
  expect(robots).toMatch(/follow/);
});

test('single-entry tag archive is noindex', async ({ page }) => {
  await page.goto('/tags/ai/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/noindex/);
});

test('multi-entry tag archive stays indexable', async ({ page }) => {
  await page.goto('/tags/3d-printing/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/index/);
});

test('Storybook lab is noindex', async ({ page }) => {
  await page.goto('/design-system/lab/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/noindex/);
});

// ─── Legacy alias redirect ───────────────────────────────────────────────

test('old article slug serves a noindex redirect to the current URL', async ({ request }) => {
  const res = await request.get('/blog/good-agent-context-is-carved-not-copied/');
  expect(res.ok()).toBeTruthy();
  const html = (await res.text()).toLowerCase();
  expect(html).toContain('http-equiv="refresh"');
  expect(html).toContain('/blog/better-agent-results-start-with-better-context/');
  expect(html).toContain('noindex');
});

// ─── Homepage link hygiene ───────────────────────────────────────────────

test('homepage links to the current article slug, never the archived alias', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('a[href="/blog/better-agent-results-start-with-better-context/"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('a[href^="/blog/good-agent-context-is-carved-not-copied"]'),
  ).toHaveCount(0);
});
