#!/usr/bin/env node
/**
 * Generate site-inventory.json — a post-build inventory of every generated
 * page, its sitemap membership, internal-link graph, and metadata quality.
 *
 * Three independent input sets:
 *   1. Generated HTML files in dist/
 *   2. Generated XML sitemap files
 *   3. Internal links extracted from generated HTML
 *
 * Usage (run after pnpm build):
 *   node scripts/generate-site-inventory.mjs
 *
 * Exit codes:
 *   0 – success
 *   1 – missing required input or invalid data
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const GENERATED_DIR = join(ROOT, 'src', 'generated');
const OUTPUT = join(GENERATED_DIR, 'site-inventory.json');

// Lazy-load linkedom for HTML/XML parsing (available as transitive dependency)
const require = createRequire(import.meta.url);

// ── Configuration ──────────────────────────────────────────────────────────

/** Route patterns that are intentionally excluded from certain warnings. */
const EXCEPTIONS = {
  /** Routes that are intentionally `noindex` (Lab pages, etc.). */
  intentionallyNoindex: ['/lab/', '/404.html/'],
  /** Routes that are not expected to have inbound internal links. */
  noInternalLinksExpected: ['/404.html/', '/lab/', '/search/', '/tags/'],
  /** Routes that are not expected to be in the sitemap. */
  notInSitemapExpected: ['/lab/', '/404.html/', '/tags/'],
  /** Utility non-page files that exist in dist/ but aren't actual pages. */
  skipFiles: ['pagefind/', '~partytown/', '_astro/', 'design-system/lab/', 'icons/'],
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Walk a directory recursively, yielding relative file paths. */
function* walk(dir, prefix = '') {
  let entries;
  try {
    entries = readdirSync(join(dir, prefix), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      yield* walk(dir, path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

/** Normalize a URL path to a canonical site route. */
function normalizeRoute(path) {
  let p = path;
  // Strip protocol/host/port
  try {
    const url = new URL(p);
    p = url.pathname;
  } catch {
    /* already a path */
  }
  // Remove trailing index.html
  p = p.replace(/\/index\.html$/, '/');
  // Ensure leading slash
  if (!p.startsWith('/')) p = `/${p}`;
  // Ensure trailing slash
  if (!p.endsWith('/')) p += '/';
  return p;
}

/** Check if a route matches an exception prefix. */
function matchesException(route, exceptionList) {
  return exceptionList.some((prefix) => route.startsWith(prefix));
}

/** Extract metadata from HTML content using simple parsing. */
function extractMeta(html) {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim() ?? null;
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/)?.[1]?.trim() ??
    null;
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/)?.[1] ?? null;
  const robots =
    html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/)?.[1] ?? null;
  // H1 count and text
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Texts = h1s.map((m) => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
  return { title, description, canonical, robots, h1Count: h1Texts.length, h1Texts };
}

/** Extract internal links from HTML content. */
function extractInternalLinks(html, _baseUrl) {
  const links = [];
  const anchorRegex = /<a[^>]+href=["']([^"']*)["']/gi;
  let match = anchorRegex.exec(html);
  while (match !== null) {
    const href = match[1];
    // Ignore non-page URLs and assets
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

function main() {
  if (!existsSync(DIST)) {
    console.error('❌ dist/ not found. Run pnpm build first.');
    process.exit(1);
  }

  // ── 1. Discover built HTML pages ────────────────────────────────────────
  console.log('📄 Scanning built HTML pages…');
  const builtPages = [];
  const routeToFile = new Map();

  for (const file of walk(DIST)) {
    if (EXCEPTIONS.skipFiles.some((p) => file.startsWith(p))) continue;
    if (!file.endsWith('.html')) continue;

    let route = normalizeRoute(file);
    if (route === '/index.html/') route = '/';

    builtPages.push({ file, route });
    routeToFile.set(route, file);
  }

  console.log(`   ${builtPages.length} page(s) found.`);

  // ── 2. Parse sitemap ────────────────────────────────────────────────────
  console.log('🗺️  Parsing sitemap…');
  const sitemapUrls = new Set();
  const sitemapEntries = new Map(); // route -> { lastmod, changefreq, priority }

  function parseSitemapFile(filePath) {
    const xml = readFileSync(filePath, 'utf-8');
    const urlset = xml.match(/<url>[\s\S]*?<\/url>/g);
    if (!urlset) return;

    for (const entry of urlset) {
      const loc = entry.match(/<loc>([^<]*)<\/loc>/)?.[1];
      const lastmod = entry.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1] ?? null;
      if (!loc) continue;
      const route = normalizeRoute(loc);
      sitemapUrls.add(route);
      sitemapEntries.set(route, { route, lastmod });
    }
  }

  // Parse sitemap index first, then individual sitemaps
  const allSitemapFiles = [];
  const siPath = join(DIST, 'sitemap-index.xml');
  if (existsSync(siPath)) {
    const siXml = readFileSync(siPath, 'utf-8');
    const sitemapRefs = [
      ...siXml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]*)<\/loc>[\s\S]*?<\/sitemap>/g),
    ];
    for (const [, loc] of sitemapRefs) {
      const rel = loc.replace(/^https?:\/\/[^/]+/, '');
      const filePath = join(DIST, rel.replace(/^\//, ''));
      if (existsSync(filePath)) allSitemapFiles.push(filePath);
    }
  }

  // Also check for direct sitemap files
  for (const file of walk(DIST)) {
    if (file.startsWith('sitemap') && file.endsWith('.xml') && file !== 'sitemap-index.xml') {
      const filePath = join(DIST, file);
      if (!allSitemapFiles.includes(filePath)) allSitemapFiles.push(filePath);
    }
  }

  for (const fp of allSitemapFiles) {
    parseSitemapFile(fp);
  }
  console.log(`   ${sitemapUrls.size} URL(s) in sitemap.`);

  // ── 3. Extract metadata and build link graph ────────────────────────────
  console.log('🔗 Extracting metadata and internal links…');
  const pageInfo = new Map(); // route -> info
  const inboundLinks = new Map(); // route -> Set of sources

  for (const { route, file } of builtPages) {
    const filePath = join(DIST, file);
    const html = readFileSync(filePath, 'utf-8');
    const meta = extractMeta(html);
    const links = extractInternalLinks(html, route);

    // Build inbound link graph
    for (const link of links) {
      const target = normalizeRoute(link);
      if (target === route) continue; // Skip self-links
      if (!inboundLinks.has(target)) inboundLinks.set(target, new Set());
      inboundLinks.get(target).add(route);
    }

    pageInfo.set(route, {
      route,
      file,
      size: statSync(filePath).size,
      ...meta,
      internalLinks: links.map((l) => normalizeRoute(l)),
      inboundCount: 0, // Will be filled below
      sitemapLastmod: sitemapEntries.get(route)?.lastmod ?? null,
    });
  }

  // Fill inbound counts
  for (const [route, sources] of inboundLinks) {
    if (pageInfo.has(route)) {
      pageInfo.get(route).inboundCount = sources.size;
    }
  }

  // ── 4. Detect warnings ──────────────────────────────────────────────────
  console.log('⚠️  Detecting warnings…');

  function warn(page, code, message) {
    if (!page.warnings) page.warnings = [];
    page.warnings.push({ code, message });
  }

  const allRoutes = new Set(pageInfo.keys());
  for (const url of sitemapUrls) allRoutes.add(url);

  for (const route of allRoutes) {
    const page = pageInfo.get(route);
    const isBuilt = pageInfo.has(route);
    const inSitemap = sitemapUrls.has(route);
    const isLab = route.startsWith('/lab/');
    const is404 = route === '/404.html/';

    // Built page missing from sitemap (unless intentionally excluded)
    if (
      isBuilt &&
      !inSitemap &&
      !matchesException(route, EXCEPTIONS.notInSitemapExpected) &&
      !isLab &&
      !is404
    ) {
      warn(
        page,
        'MISSING_FROM_SITEMAP',
        `Page is built and indexable but not listed in the XML sitemap.`,
      );
    }

    // Sitemap URL with no built page
    if (!isBuilt && inSitemap) {
      // Create a placeholder entry for the warning
      pageInfo.set(route, {
        route,
        warnings: [
          {
            code: 'NO_BUILT_PAGE',
            message: `Sitemap references "${route}" but no corresponding HTML file was generated.`,
          },
        ],
      });
      continue;
    }

    if (!page) continue;

    // Zero inbound links (unless expected)
    if (
      isBuilt &&
      page.inboundCount === 0 &&
      !matchesException(route, EXCEPTIONS.noInternalLinksExpected) &&
      !isLab &&
      !is404
    ) {
      warn(
        page,
        'ORPHANED_PAGE',
        `No internal links point to this page. It may be unreachable from navigation.`,
      );
    }

    // noindex in sitemap
    if (page.robots && page.robots.includes('noindex') && inSitemap) {
      warn(page, 'NOINDEX_IN_SITEMAP', `Page has robots="noindex" but is included in the sitemap.`);
    }

    // Missing canonical
    if (isBuilt && !page.canonical && !isLab && !is404) {
      warn(page, 'MISSING_CANONICAL', `No canonical URL specified.`);
    }

    // Canonical pointing elsewhere
    if (page.canonical) {
      const canonRoute = normalizeRoute(page.canonical);
      if (canonRoute !== route) {
        warn(
          page,
          'CANONICAL_MISMATCH',
          `Canonical URL "${page.canonical}" resolves to "${canonRoute}", which differs from the page route "${route}".`,
        );
      }
    }

    // Missing title
    if (isBuilt && !page.title) {
      warn(page, 'MISSING_TITLE', `Page has no <title>.`);
    }

    // Missing description
    if (isBuilt && !page.description && !isLab && !is404) {
      warn(page, 'MISSING_DESCRIPTION', `No meta description found.`);
    }

    // Missing H1
    if (isBuilt && page.h1Count === 0) {
      warn(page, 'MISSING_H1', `Page has no <h1>.`);
    }

    // Multiple H1s
    if (isBuilt && page.h1Count > 1) {
      warn(page, 'MULTIPLE_H1S', `Page has ${page.h1Count} <h1> elements.`);
    }
  }

  // ── 5. Detect duplicates ────────────────────────────────────────────────
  console.log('🔍 Checking for duplicate metadata…');

  const titleMap = new Map();
  const descMap = new Map();

  for (const [route, page] of pageInfo) {
    if (!page.title) continue;
    if (!titleMap.has(page.title)) titleMap.set(page.title, []);
    titleMap.get(page.title).push(route);
  }

  for (const [route, page] of pageInfo) {
    if (!page.description) continue;
    if (!descMap.has(page.description)) descMap.set(page.description, []);
    descMap.get(page.description).push(route);
  }

  for (const [title, routes] of titleMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        const page = pageInfo.get(route);
        if (page)
          warn(
            page,
            'DUPLICATE_TITLE',
            `Title "${title}" is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
          );
      }
    }
  }

  for (const [desc, routes] of descMap) {
    if (routes.length > 1) {
      for (const route of routes) {
        const page = pageInfo.get(route);
        if (page)
          warn(
            page,
            'DUPLICATE_DESCRIPTION',
            `Description is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
          );
      }
    }
  }

  // ── 6. Build output ─────────────────────────────────────────────────────
  const pages = [...pageInfo.entries()]
    .map(([route, p]) => ({
      route,
      file: p.file ?? null,
      size: p.size ?? null,
      built: p.file !== undefined,
      inSitemap: sitemapUrls.has(route),
      sitemapLastmod: p.sitemapLastmod ?? null,
      title: p.title ?? null,
      description: p.description ?? null,
      canonical: p.canonical ?? null,
      robots: p.robots ?? null,
      h1Count: p.h1Count ?? 0,
      h1Texts: p.h1Texts ?? [],
      inboundCount: p.inboundCount ?? 0,
      warnings: p.warnings ?? [],
    }))
    .sort((a, b) => a.route.localeCompare(b.route));

  const summary = {
    totalUrls: pages.length,
    builtPages: pages.filter((p) => p.built).length,
    sitemapUrls: sitemapUrls.size,
    orphanedPages: pages.filter(
      (p) =>
        p.built &&
        p.inboundCount === 0 &&
        !matchesException(p.route, EXCEPTIONS.noInternalLinksExpected) &&
        !p.route.startsWith('/lab/') &&
        p.route !== '/404.html/',
    ).length,
    pagesWithWarnings: pages.filter((p) => p.warnings.length > 0).length,
    totalWarnings: pages.reduce((sum, p) => sum + p.warnings.length, 0),
  };

  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    pages,
  };

  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Wrote ${OUTPUT}`);
  console.log(`   ${summary.totalUrls} URLs, ${summary.totalWarnings} warning(s).`);
}

main();
