/**
 * SEO policy + new core-check unit tests.
 *
 * Calls the actual production functions in scripts/seo-policy.mjs and
 * scripts/site-inventory-core.mjs — no copied implementations.
 */
import { expect, test } from '@playwright/test';
import {
  excludeFromSitemap,
  getRedirectRoutes,
  getSingleEntryTagRoutes,
  isRedirectRoute,
} from '../scripts/seo-policy.mjs';
import {
  detectBrokenInternalLinks,
  detectDuplicateMetadata,
  detectWarnings,
  findRedundantAltPrefixes,
} from '../scripts/site-inventory-core.mjs';

// ─── Sitemap policy ──────────────────────────────────────────────────────

test('excludeFromSitemap: excludes non-SEO surfaces', () => {
  expect(excludeFromSitemap('/lab/site-inventory/')).toBe(true);
  expect(excludeFromSitemap('/search/')).toBe(true);
  expect(excludeFromSitemap('/design-system/lab/')).toBe(true);
  expect(excludeFromSitemap('/design-system/lab/iframe.html')).toBe(true);
});

test('excludeFromSitemap: excludes legacy redirect aliases', () => {
  expect(excludeFromSitemap('/posts/3d-printing/250mm-trading-card-box/')).toBe(true);
});

test('excludeFromSitemap: includes principal pages', () => {
  expect(excludeFromSitemap('/')).toBe(false);
  expect(excludeFromSitemap('/about/')).toBe(false);
  expect(excludeFromSitemap('/blog/')).toBe(false);
  expect(excludeFromSitemap('/portfolio/')).toBe(false);
  expect(excludeFromSitemap('/portfolio/design-system/')).toBe(false);
});

test('getSingleEntryTagRoutes: derived from blog content', () => {
  const routes = getSingleEntryTagRoutes();
  // Single-entry tags must be excluded from the sitemap; multi-entry tags must not.
  expect(routes).toContain('/tags/ai/');
  expect(routes).toContain('/tags/ai-agents/');
  expect(routes).toContain('/tags/documentation/');
  expect(routes).toContain('/tags/software-development/');
  expect(routes).not.toContain('/tags/3d-printing/');
});

test('excludeFromSitemap: excludes single-entry tag archives', () => {
  expect(excludeFromSitemap('/tags/ai/')).toBe(true);
  expect(excludeFromSitemap('/tags/3d-printing/')).toBe(false);
});

test('getRedirectRoutes: finds Astro.redirect pages', () => {
  const routes = getRedirectRoutes();
  expect(routes).toContain('/blog/good-agent-context-is-carved-not-copied/');
  expect(routes).toContain('/posts/3d-printing/250mm-trading-card-box/');
});

test('isRedirectRoute: detects aliases', () => {
  expect(isRedirectRoute('/blog/good-agent-context-is-carved-not-copied/')).toBe(true);
  expect(isRedirectRoute('/posts/3d-printing/250mm-trading-card-box/')).toBe(true);
  expect(isRedirectRoute('/blog/better-agent-results-start-with-better-context/')).toBe(false);
});

// ─── Broken internal links ───────────────────────────────────────────────

test('detectBrokenInternalLinks: flags targets with no generated page', () => {
  const pages = [
    {
      route: '/blog/',
      built: true,
      outgoing: ['/blog/better-agent-results-start-with-better-context/', '/missing-page/'],
    },
  ];
  const warnings = detectBrokenInternalLinks(pages, [
    '/blog/',
    '/blog/better-agent-results-start-with-better-context/',
  ]);
  expect(warnings).toHaveLength(1);
  expect(warnings[0].code).toBe('BROKEN_INTERNAL_LINK');
  expect(warnings[0].target).toBe('/missing-page/');
});

test('detectBrokenInternalLinks: accepts redirect and external artifact targets', () => {
  const pages = [
    {
      route: '/',
      built: true,
      outgoing: ['/posts/3d-printing/250mm-trading-card-box/', '/design-system/lab/'],
    },
  ];
  const valid = new Set(['/', '/posts/3d-printing/250mm-trading-card-box/', '/design-system/lab/']);
  expect(detectBrokenInternalLinks(pages, valid)).toHaveLength(0);
});

// ─── Redundant alt prefix ────────────────────────────────────────────────

test('findRedundantAltPrefixes: flags "Image:" and "image:" prefixes', () => {
  const offenders = findRedundantAltPrefixes(
    '<img alt="Image: screenshot of settings" src="a.png">' +
      '<img alt="image: icon" src="b.png">' +
      '<img alt="A useful description" src="c.png">',
  );
  expect(offenders).toHaveLength(2);
  expect(offenders.map((o) => o.alt)).toEqual(['Image: screenshot of settings', 'image: icon']);
});

test('findRedundantAltPrefixes: no offenders for clean alt text', () => {
  expect(findRedundantAltPrefixes('<img alt="Eric Carlisle" src="a.png">')).toHaveLength(0);
});

// ─── Duplicate canonical ─────────────────────────────────────────────────

test('detectDuplicateMetadata: detects duplicate canonical URLs', () => {
  const warnings = detectDuplicateMetadata([
    { route: '/a/', canonical: 'https://ericcarlisle.com/x/' },
    { route: '/b/', canonical: 'https://ericcarlisle.com/x/' },
  ]);
  const dups = warnings.filter((w) => w.code === 'DUPLICATE_CANONICAL');
  expect(dups).toHaveLength(2);
  expect(dups[0].message).toContain('/x/');
});

// ─── RedirURIECT in sitemap ──────────────────────────────────────────────

test('detectWarnings: REDIRECT_IN_SITEMAP when a redirect is in the sitemap', () => {
  const warnings = detectWarnings(
    '/blog/good-agent-context-is-carved-not-copied/',
    {
      built: true,
      inSitemap: true,
      robots: 'noindex, follow',
      canonical: 'https://ericcarlisle.com/blog/better-agent-results-start-with-better-context/',
      redirectTarget: '/blog/better-agent-results-start-with-better-context/',
    },
    new Set(['/blog/good-agent-context-is-carved-not-copied/']),
    new Set(['/blog/good-agent-context-is-carved-not-copied/']),
  );
  expect(warnings.some((w) => w.code === 'REDIRECT_IN_SITEMAP')).toBe(true);
});

test('detectWarnings: no REDIRECT_IN_SITEMAP for a redirect outside the sitemap', () => {
  const warnings = detectWarnings(
    '/posts/3d-printing/250mm-trading-card-box/',
    {
      built: true,
      inSitemap: false,
      robots: 'noindex',
      canonical: 'https://ericcarlisle.com/blog/250mm-trading-card-box/',
      redirectTarget: '/blog/250mm-trading-card-box/',
    },
    new Set(['/posts/3d-printing/250mm-trading-card-box/']),
    new Set(),
  );
  expect(warnings.some((w) => w.code === 'REDIRECT_IN_SITEMAP')).toBe(false);
});
