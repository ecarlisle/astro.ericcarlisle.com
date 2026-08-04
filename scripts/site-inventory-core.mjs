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

const SITE_ORIGIN = 'https://ericcarlisle.com';

/** Route/prefix patterns excluded from specific warning checks. */
export const EXCEPTIONS = {
  /** Routes not expected to have inbound internal links. */
  noInternalLinksExpected: ['/404.html/', '/lab/'],
  /** Routes not expected to be in the XML sitemap. */
  notInSitemapExpected: ['/lab/', '/404.html/'],
  /** Path prefixes inside dist/ that are not normal site pages. */
  skipFiles: ['pagefind/', '~partytown/', '_astro/', 'icons/'],
  /**
   * Known legacy redirect route patterns. Astro generates a meta-refresh
   * document for these; this list documents them explicitly as well.
   */
  legacyRedirectRoutes: ['/posts/'],
};

/** Asset file extensions (checked against the resolved pathname). */
const ASSET_EXT_RE =
  /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|avif|woff2?|ttf|eot|pdf|zip|xml|json|map|txt)$/i;

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

/**
 * Normalize a URL or path to a canonical site route.
 * Handles full URLs, path-only inputs, query strings, and fragments.
 */
export function normalizeRoute(input) {
  let path = String(input ?? '').trim();
  if (!path) return '/';

  // Full URL: use its pathname (query/fragment already stripped).
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return '/';
    }
  } else {
    // Path-only input: strip fragment and query manually.
    path = path.split('#')[0].split('?')[0];
  }

  // Remove a trailing index.html (including a bare "index.html").
  path = path.replace(/(^|\/)index\.html$/, '/');

  // Ensure a leading slash.
  if (!path.startsWith('/')) path = `/${path}`;

  // Ensure a trailing slash.
  if (!path.endsWith('/')) path += '/';

  return path;
}

// ─── Link Resolution ──────────────────────────────────────────────────────

/**
 * Resolve an anchor href against the source page route.
 * Returns a normalized internal route, or null when the link is external,
 * a non-page URL, an asset, or a fragment-only link.
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

  // Resolve against the source page URL (site origin as base) so relative
  // links, absolute same-origin URLs, protocol-relative URLs, and query
  // strings / fragments all resolve to a concrete URL.
  const base = new URL(baseRoute, SITE_ORIGIN);
  let resolved;
  try {
    resolved = new URL(hrefStr, base);
  } catch {
    return null;
  }

  // Same-origin only.
  if (resolved.hostname !== new URL(SITE_ORIGIN).hostname) return null;

  // Asset URL — check the resolved pathname extension (query included).
  if (ASSET_EXT_RE.test(resolved.pathname)) return null;

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

/** Extract metadata and redirect evidence from HTML using the DOM. */
export function extractMeta(html) {
  const doc = parseHTML(html);

  const title = doc.querySelector('title')?.textContent?.trim() ?? null;

  const descEl = doc.querySelector('meta[name="description"], meta[property="og:description"]');
  const description = descEl?.getAttribute('content')?.trim() ?? null;

  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl?.getAttribute('href') ?? null;

  const robotsEl = doc.querySelector('meta[name="robots"]');
  const robots = robotsEl?.getAttribute('content') ?? null;

  // Redirect evidence: Astro emits a meta-refresh for configured redirects.
  // content="0;url=/target/" (attribute order and casing vary).
  let redirectTarget = null;
  for (const metaEl of doc.querySelectorAll('meta[http-equiv], meta[httpEquiv]')) {
    const equiv = (
      metaEl.getAttribute('http-equiv') ||
      metaEl.getAttribute('httpEquiv') ||
      ''
    ).toLowerCase();
    if (equiv === 'refresh') {
      const content = metaEl.getAttribute('content') ?? '';
      const urlMatch = content.match(/url\s*=\s*(.+)$/i);
      if (urlMatch) redirectTarget = urlMatch[1].trim();
      break;
    }
  }

  const h1s = Array.from(doc.querySelectorAll('h1'));
  const h1Texts = h1s
    .map((h1) =>
      h1.textContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);

  return {
    title,
    description,
    canonical,
    robots,
    h1Count: h1Texts.length,
    h1Texts,
    redirectTarget,
  };
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
 * - redirect      : has actual redirect evidence (meta-refresh or legacy route)
 * - '404'         : the 404 page (not indexable, not in sitemap)
 * - lab           : /lab/* diagnostic pages
 * - external      : explicitly registered external artifact (e.g. Storybook)
 *
 * Redirect classification relies on redirect evidence, never on canonical
 * mismatch alone.
 */
export function classifyPage(route, page) {
  const isLab = route.startsWith('/lab/');
  const is404 = route === '/404.html/';
  const isExternal = route === '/design-system/lab/';
  const isNoindex = Boolean(page.robots?.toLowerCase().includes('noindex'));
  const isLegacyRedirect = EXCEPTIONS.legacyRedirectRoutes.some((p) => route.startsWith(p));
  const hasRedirectEvidence = Boolean(page.redirectTarget);
  const isRedirect = hasRedirectEvidence || isLegacyRedirect;
  const noLinksExpected = EXCEPTIONS.noInternalLinksExpected.some((p) => route.startsWith(p));
  const noSitemapExpected = EXCEPTIONS.notInSitemapExpected.some((p) => route.startsWith(p));

  if (isExternal) {
    return {
      type: 'external-artifact',
      isIndexable: false,
      expectInSitemap: false,
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
      expectInternalLinks: false,
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
  // Use the record's built field (accounts for merged external artifacts);
  // fall back to the built-route set for callers that omit it.
  const isBuilt = page.built === true || builtRoutes.has(route);
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

  // Orphaned page — an indexable page, expected to have inbound links,
  // with none.
  if (isBuilt && cls.isIndexable && cls.expectInternalLinks && page.inboundCount === 0) {
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

  // Redirect page included in sitemap — redirect URLs must never be indexed
  // or advertised in the sitemap.
  if (cls.type === 'redirect' && inSitemap) {
    warnings.push({
      code: 'REDIRECT_IN_SITEMAP',
      message: 'Redirect URL is included in the sitemap.',
    });
  }

  // Missing canonical — only for indexable pages.
  if (cls.isIndexable && !page.canonical) {
    warnings.push({ code: 'MISSING_CANONICAL', message: 'No canonical URL specified.' });
  }

  // Canonical mismatch analysis.
  if (page.canonical) {
    const canonRoute = normalizeRoute(page.canonical);
    // A canonical that points to an external origin is never equivalent to
    // this site's route, even when its pathname happens to match.
    if (/^https?:\/\//i.test(page.canonical)) {
      let canonHost = null;
      try {
        canonHost = new URL(page.canonical).hostname;
      } catch {
        canonHost = null;
      }
      if (canonHost && canonHost !== new URL(SITE_ORIGIN).hostname) {
        warnings.push({
          code: 'CANONICAL_EXTERNAL_ORIGIN',
          message: `Canonical URL "${page.canonical}" points to external origin "${canonHost}".`,
        });
        // Still fall through to normal mismatch handling below.
      }
    }
    // The 404 page's canonical points to /404/ (its natural URL) while the
    // built file is /404.html — an intentional Astro convention.
    if (cls.type === '404' && canonRoute === '/404/') {
      // intentional, no warning
    } else if (canonRoute !== route) {
      if (cls.type === 'redirect') {
        // The page redirects to its canonical target. Only warn if the
        // target does not exist as a built page.
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

/**
 * Detect internal links that resolve to no existing page.
 * `validRoutes` is the set of routes with a built HTML page (including
 * redirect aliases) plus any registered external artifact routes.
 * Returns BROKEN_INTERNAL_LINK warnings with source-page and target info.
 */
export function detectBrokenInternalLinks(pages, validRoutes) {
  const warnings = [];
  const valid = new Set([...validRoutes]);
  for (const page of pages) {
    if (!page.built) continue;
    for (const target of page.outgoing ?? []) {
      if (!valid.has(target)) {
        warnings.push({
          route: page.route,
          code: 'BROKEN_INTERNAL_LINK',
          message: `Internal link on "${page.route}" targets "${target}", which has no generated page, redirect, or asset.`,
          target,
        });
      }
    }
  }
  return warnings;
}

/**
 * Extract image alternative text that starts with a redundant prefix such as
 * "Image:" (case-insensitive). Returns [{ tag, alt }] for offenders.
 */
export function findRedundantAltPrefixes(html) {
  const doc = parseHTML(html);
  const offenders = [];
  for (const el of doc.querySelectorAll('[alt]')) {
    const alt = el.getAttribute('alt') ?? '';
    if (/^image\s*:/i.test(alt.trim())) {
      offenders.push({ tag: el.tagName.toLowerCase(), alt });
    }
  }
  return offenders;
}

/** Detect duplicate titles, descriptions, and canonical URLs across pages. */
export function detectDuplicateMetadata(pages) {
  const warnings = [];
  const titleMap = new Map();
  const descMap = new Map();
  const canonMap = new Map();

  // Redirect and noindex aliases intentionally reuse the destination's title,
  // description, and canonical (they resolve to the canonical page), so they
  // never count as duplicate-content conflicts.
  const isAlias = (p) =>
    Boolean(p.redirectTarget) || (p.robots ?? '').toLowerCase().includes('noindex');

  for (const page of pages) {
    if (isAlias(page)) continue;
    if (page.title) {
      if (!titleMap.has(page.title)) titleMap.set(page.title, []);
      titleMap.get(page.title).push(page.route);
    }
    if (page.description) {
      if (!descMap.has(page.description)) descMap.set(page.description, []);
      descMap.get(page.description).push(page.route);
    }
    if (page.canonical) {
      if (!canonMap.has(page.canonical)) canonMap.set(page.canonical, []);
      canonMap.get(page.canonical).push(page.route);
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

  for (const [canonical, routes] of canonMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        warnings.push({
          route,
          code: 'DUPLICATE_CANONICAL',
          message: `Canonical "${canonical}" is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
        });
      }
    }
  }

  return warnings;
}

// ─── Deterministic Output ─────────────────────────────────────────────────

/**
 * Build a deterministic inventory output object.
 * `provenance` is provided by the CLI (currently the git commit SHA only).
 */
export function createInventoryOutput({ pages, summary, provenance = {} }) {
  return {
    provenance,
    summary,
    pages: [...pages].sort((a, b) => a.route.localeCompare(b.route)),
  };
}
