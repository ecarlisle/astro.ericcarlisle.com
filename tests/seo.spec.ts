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
    titlePattern: /Portfolio [|\u2014] Eric Carlisle/,
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
