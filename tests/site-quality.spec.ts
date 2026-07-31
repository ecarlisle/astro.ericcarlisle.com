/**
 * Site Quality page tests.
 *
 * Covers the Lighthouse URL presentation on /portfolio/site-quality/:
 * localhost audit URLs must render as pathname-only labels so the deployed
 * page does not appear to report on a localhost site.
 */
import { expect, test } from '@playwright/test';

import { lighthousePath } from '../src/lib/site-quality';

// ─── lighthousePath unit tests ───────────────────────────────────────────

test('lighthousePath: localhost audit URL renders as pathname only', () => {
  expect(lighthousePath('http://localhost:4321/about/')).toBe('/about/');
});

test('lighthousePath: root route', () => {
  expect(lighthousePath('http://localhost:4321/')).toBe('/');
});

test('lighthousePath: nested route preserves trailing slash', () => {
  expect(lighthousePath('http://localhost:4321/portfolio/site-quality/')).toBe(
    '/portfolio/site-quality/',
  );
});

test('lighthousePath: 404 route', () => {
  expect(lighthousePath('http://localhost:4321/404.html/')).toBe('/404.html/');
});

test('lighthousePath: index.html stripped', () => {
  expect(lighthousePath('http://localhost:4321/about/index.html')).toBe('/about/');
});

test('lighthousePath: non-local absolute URL', () => {
  expect(lighthousePath('https://ericcarlisle.com/about/')).toBe('/about/');
});

test('lighthousePath: path-only input is normalized', () => {
  expect(lighthousePath('/about/')).toBe('/about/');
  expect(lighthousePath('/')).toBe('/');
});

test('lighthousePath: malformed absolute URL falls back to raw value', () => {
  expect(lighthousePath('http://[invalid')).toBe('http://[invalid');
});

test('lighthousePath: missing value falls back to unknown', () => {
  expect(lighthousePath(null)).toBe('unknown');
  expect(lighthousePath(undefined)).toBe('unknown');
  expect(lighthousePath('')).toBe('unknown');
});

// ─── Rendered page ───────────────────────────────────────────────────────

test('site-quality page renders route headings as pathnames, not localhost URLs', async ({
  page,
}) => {
  await page.goto('/portfolio/site-quality/');
  // Wait for the Lighthouse blocks (present when generated data has results).
  const blocks = page.locator('.lh-route-block');
  if ((await blocks.count()) === 0) {
    // No Lighthouse data in this build — nothing to assert on headings.
    return;
  }
  // The route heading is the h3 containing a <code> element.
  const headings = blocks.locator('h3 code');
  const count = await headings.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const text = (await headings.nth(i).textContent()) ?? '';
    // Must not expose the localhost origin.
    expect(text).not.toContain('http://localhost:4321');
    expect(text).not.toContain('localhost');
    // Must look like a route path.
    expect(text.startsWith('/')).toBe(true);
  }
});
