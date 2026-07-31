/**
 * Site Inventory Core
 * Pure, importable functions for the site inventory feature.
 *
 * Used by scripts/generate-site-inventory.mjs (CLI) and
 * tests/site-inventory.spec.ts (unit tests).
 *
 * Uses linkedom for proper DOM parsing — no regex-based document parsing.
 */
import { DOMParser } from 'linkedom';

// ─── Configuration ─────────────────────────────────────────────────────────

/** Route/prefix patterns excluded from specific warning checks. */
export const EXCEPTIONS = {
  /** Pages that are intentionally noindex (Lab pages, 404). */
  intentionallyNoindex: ['/lab/', '/404.html/'],
  /** Routes not expected to have inbound internal links. */
  noInternalLinksExpected: ['/404.html/', '/lab/', '/search/', '/tags/'],
  /** Routes not expected to be in the XML sitemap. */
  notInSitemapExpected: ['/lab/', '/404.html/', '/tags/'],
  /** Non-page files/directories inside dist/ that are not actual routes. */
  skipFiles: ['pagefind/', '~partytown/', '_astro/', 'design-system/lab/', 'icons/'],
  /** Sitemap index files inside dist/. */
  sitemapFiles: ['sitemap-index.xml'],
};

// ─── HTML / XML Parsing (linkedom) ────────────────────────────────────────

/** Parse HTML into a linkedom Document. */
export function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Parse XML into a linkedom Document. */
export function parseXML(xml) {
  return new DOMParser().parseFromString(xml, 'application/xml');
}

// ─── Route Normalization ──────────────────────────────────────────────────

/** Normalize a URL or path to a canonical site route. */
export function normalizeRoute(input) {
  let path = String(input).trim();

  // Strip protocol/host/port when a full URL is provided.
  try {
    path = new URL(path).pathname;
  } catch {
    // Already a path.
  }

  // Remove a trailing index.html (including a bare "index.html").
  path = path.replace(/(^|\/)index\.html$/, '/');

  // Ensure a leading slash.
  if (!path.startsWith('/')) path = `/${path}`;

  // Ensure a trailing slash.
  if (!path.endsWith('/')) path += '/';

  return path;
}

/** Check whether a route matches any exception prefix in a list. */
export function matchesException(route, exceptionList) {
  return exceptionList.some((prefix) => route.startsWith(prefix));
}

// ─── Link Resolution ──────────────────────────────────────────────────────

/**
 * Resolve an anchor href against the source page route.
 * Returns a normalized internal route, or null when the link is external,
 * a non-page URL, an asset, a fragment, or a self-link is handled by caller.
 */
export function resolveInternalLink(href, baseRoute) {
  const hrefStr = String(href ?? '').trim();
  if (!hrefStr) return null;

  // Non-page schemes.
  if (
    hrefStr.startsWith('mailto:') ||
    hrefStr.startsWith('tel:') ||
    hrefStr.startsWith('javascript:') ||
    hrefStr.startsWith('data:')
  ) {
    return null;
  }

  // Fragment-only link.
  if (hrefStr.startsWith('#')) return null;

  // Asset URL (file extension).
  if (
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|avif|woff2?|ttf|eot|pdf|zip|xml|json|map|txt)$/i.test(
      hrefStr,
    )
  ) {
    return null;
  }

  // Protocol-relative (//host/path). Only same-origin hosts count as internal.
  if (hrefStr.startsWith('//')) {
    const url = new URL(hrefStr, 'https://ericcarlisle.com' + baseRoute);
    if (url.hostname !== 'ericcarlisle.com') return null;
    return normalizeRoute(url.pathname);
  }

  // Absolute http(s) URLs. Same-origin hosts count as internal; others excluded.
  if (hrefStr.startsWith('http://') || hrefStr.startsWith('https://')) {
    const url = new URL(hrefStr);
    if (url.hostname !== 'ericcarlisle.com') return null;
    return normalizeRoute(url.pathname);
  }

  // Resolve relative to the source page URL using the site origin as base.
  const base = new URL(baseRoute, 'https://ericcarlisle.com');
  const resolved = new URL(hrefStr, base);
  return normalizeRoute(resolved.pathname);
}

/** Extract internal links from HTML, resolving each against the source route. */
export function extractInternalLinks(html, baseRoute) {
  const doc = parseHTML(html);
  const links = [];
  for (const anchor of doc.querySelectorAll('a[href]')) {
    const resolved = resolveInternalLink(anchor.getAttribute('href'), baseRoute);
    if (resolved && !links.includes(resolved)) links.push(resolved);
  }
  return links;
}

// ─── Metadata Extraction ──────────────────────────────────────────────────

/** Extract metadata from HTML using the DOM. */
export function extractMeta(html) {
  const doc = parseHTML(html);

  const title = doc.querySelector('title')?.textContent?.trim() ?? null;

  const descEl = doc.querySelector('meta[name="description"], meta[property="og:description"]');
  const description = descEl?.getAttribute('content')?.trim() ?? null;

  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl?.getAttribute('href') ?? null;

  const robotsEl = doc.querySelector('meta[name="robots"]');
  const robots = robotsEl?.getAttribute('content') ?? null;

  const h1s = Array.from(doc.querySelectorAll('h1'));
  const h1Texts = h1s
    .map((h1) =>
      h1.textContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);

  return { title, description, canonical, robots, h1Count: h1Texts.length, h1Texts };
}

// ─── Sitemap Parsing ──────────────────────────────────────────────────────

/** Parse a sitemap XML document, returning route entries with lastmod. */
export function parseSitemapXML(xml) {
  const doc = parseXML(xml);
  const results = [];
  for (const urlEl of doc.querySelectorAll('url')) {
    const loc = urlEl.querySelector('loc')?.textContent?.trim();
    if (!loc) continue;
    const lastmod = urlEl.querySelector('lastmod')?.textContent?.trim() ?? null;
    results.push({ route: normalizeRoute(loc), lastmod });
  }
  return results;
}

/** Parse a sitemap index XML document, returning referenced sitemap URLs. */
export function parseSitemapIndexXML(xml) {
  const doc = parseXML(xml);
  const urls = [];
  for (const smEl of doc.querySelectorAll('sitemap')) {
    const loc = smEl.querySelector('loc')?.textContent?.trim();
    if (loc) urls.push(loc);
  }
  return urls;
}

// ─── Page Classification ──────────────────────────────────────────────────

/**
 * Classify a page. Types:
 * - normal        : indexable, expected in sitemap, expected to have links
 * - noindex       : robots noindex, not expected in sitemap
 * - redirect      : canonical points to a different internal route
 * - '404'         : the 404 page (not indexable, not in sitemap)
 * - lab           : /lab/* diagnostic pages
 * - external      : non-HTML artifact that was not built as a page
 */
export function classifyPage(route, page) {
  const isLab = route.startsWith('/lab/');
  const is404 = route === '/404.html/';
  const isExternal = route.startsWith('/design-system/lab/');
  const isNoindex = Boolean(page.robots?.toLowerCase().includes('noindex'));
  const isRedirect = Boolean(page.canonical && normalizeRoute(page.canonical) !== route);
  const noLinksExpected = EXCEPTIONS.noInternalLinksExpected.some((p) => route.startsWith(p));
  const noSitemapExpected = EXCEPTIONS.notInSitemapExpected.some((p) => route.startsWith(p));

  if (isExternal) {
    return {
      type: 'external-artifact',
      isIndexable: false,
      expectInSitemap: true,
      expectInternalLinks: false,
    };
  }
  if (isLab) {
    return { type: 'lab', isIndexable: false, expectInSitemap: false, expectInternalLinks: false };
  }
  if (is404) {
    return { type: '404', isIndexable: false, expectInSitemap: false, expectInternalLinks: false };
  }
  if (isRedirect) {
    return {
      type: 'redirect',
      isIndexable: false,
      expectInSitemap: !noSitemapExpected,
      expectInternalLinks: !noLinksExpected,
    };
  }
  if (isNoindex) {
    return {
      type: 'noindex',
      isIndexable: false,
      expectInSitemap: false,
      expectInternalLinks: !noLinksExpected,
    };
  }
  return {
    type: 'normal',
    isIndexable: true,
    expectInSitemap: !noSitemapExpected,
    expectInternalLinks: !noLinksExpected,
  };
}

// ─── Warning Detection ────────────────────────────────────────────────────

/**
 * Detect warnings for a single page.
 * `builtRoutes` is the set of routes with a generated HTML page.
 * `sitemapRoutes` is the set of routes present in the sitemap.
 */
export function detectWarnings(route, page, builtRoutes, sitemapRoutes) {
  const warnings = [];
  const cls = classifyPage(route, page);
  const isBuilt = builtRoutes.has(route);
  const inSitemap = sitemapRoutes.has(route);

  // Built page missing from sitemap — only for indexable pages that expect it.
  if (isBuilt && !inSitemap && cls.isIndexable && cls.expectInSitemap) {
    warnings.push({
      code: 'MISSING_FROM_SITEMAP',
      message: 'Page is built and indexable but not listed in the XML sitemap.',
    });
  }

  // Sitemap URL with no built page.
  if (!isBuilt && inSitemap) {
    warnings.push({
      code: 'NO_BUILT_PAGE',
      message: `Sitemap references "${route}" but no corresponding HTML file was generated.`,
    });
  }

  // Orphaned page (no inbound links).
  if (isBuilt && page.inboundCount === 0 && cls.expectInternalLinks) {
    warnings.push({
      code: 'ORPHANED_PAGE',
      message: 'No internal links point to this page. It may be unreachable from navigation.',
    });
  }

  // noindex page included in sitemap.
  if (page.robots?.toLowerCase().includes('noindex') && inSitemap) {
    warnings.push({
      code: 'NOINDEX_IN_SITEMAP',
      message: 'Page has robots="noindex" but is included in the sitemap.',
    });
  }

  // Missing canonical — only for indexable pages.
  if (cls.isIndexable && !page.canonical) {
    warnings.push({ code: 'MISSING_CANONICAL', message: 'No canonical URL specified.' });
  }

  // Canonical mismatch analysis.
  if (page.canonical) {
    const canonRoute = normalizeRoute(page.canonical);
    // The 404 page's canonical points to /404/ (its natural URL) while the
    // built file is /404.html — this is an intentional Astro convention.
    if (cls.type === '404' && canonRoute === '/404/') {
      // intentional, no warning
    } else if (canonRoute !== route) {
      if (cls.type === 'redirect') {
        // Intentional: the page redirects to the canonical target.
        // Only warn if the canonical target does not exist as a built page.
        if (!builtRoutes.has(canonRoute)) {
          warnings.push({
            code: 'CANONICAL_TARGET_MISSING',
            message: `Canonical URL "${page.canonical}" points to "${canonRoute}", which has no built HTML page.`,
          });
        }
      } else {
        warnings.push({
          code: 'CANONICAL_MISMATCH',
          message: `Canonical URL "${page.canonical}" resolves to "${canonRoute}", which differs from the page route "${route}".`,
        });
      }
    }
  }

  // Missing title.
  if (cls.isIndexable && !page.title) {
    warnings.push({ code: 'MISSING_TITLE', message: 'Page has no <title>.' });
  }

  // Missing meta description.
  if (cls.isIndexable && !page.description) {
    warnings.push({ code: 'MISSING_DESCRIPTION', message: 'No meta description found.' });
  }

  // Missing H1.
  if (cls.isIndexable && page.h1Count === 0) {
    warnings.push({ code: 'MISSING_H1', message: 'Page has no <h1>.' });
  }

  // Multiple H1s.
  if (cls.isIndexable && page.h1Count > 1) {
    warnings.push({
      code: 'MULTIPLE_H1S',
      message: `Page has ${page.h1Count} <h1> elements.`,
    });
  }

  return warnings;
}

/** Detect duplicate titles and descriptions across pages. */
export function detectDuplicateMetadata(pages) {
  const warnings = [];
  const titleMap = new Map();
  const descMap = new Map();

  for (const page of pages) {
    if (page.title) {
      if (!titleMap.has(page.title)) titleMap.set(page.title, []);
      titleMap.get(page.title).push(page.route);
    }
    if (page.description) {
      if (!descMap.has(page.description)) descMap.set(page.description, []);
      descMap.get(page.description).push(page.route);
    }
  }

  for (const [title, routes] of titleMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        warnings.push({
          route,
          code: 'DUPLICATE_TITLE',
          message: `Title "${title}" is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
        });
      }
    }
  }

  for (const [desc, routes] of descMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        warnings.push({
          route,
          code: 'DUPLICATE_DESCRIPTION',
          message: `Description is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
        });
      }
    }
  }

  return warnings;
}

// ─── Deterministic Output ─────────────────────────────────────────────────

/**
 * Build a deterministic inventory output object.
 * `provenance` is provided by the CLI (git sha, build timestamp); when
 * omitted, `provenance` is an empty object so output stays byte-stable.
 */
export function createInventoryOutput({ pages, summary, provenance = {} }) {
  return {
    provenance,
    summary,
    pages: [...pages].sort((a, b) => a.route.localeCompare(b.route)),
  };
}
