#!/usr/bin/env node
/**
 * Site Inventory Generator (CLI)
 *
 * Scans the completed `dist/` output and writes the inventory JSON into
 * the deployed artifact at `dist/lab/site-inventory/data.json`.
 *
 * The Astro page at /lab/site-inventory/ loads this deployment-specific
 * JSON at runtime, so the deployed page always reflects the same build
 * that produced it. No generated data is committed under src/.
 *
 * Usage:
 *   node scripts/generate-site-inventory.mjs
 *
 * Exit codes:
 *   0 – success
 *   1 – missing required input
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  classifyPage,
  detectDuplicateMetadata,
  detectWarnings,
  EXCEPTIONS,
  extractInternalLinks,
  extractMeta,
  normalizeRoute,
  parseSitemapIndexXML,
  parseSitemapXML,
} from './site-inventory-core.mjs';

const ROOT = join(import.meta.dirname, '..');
const DIST = process.env.INVENTORY_DIST || join(ROOT, 'dist');
const OUT_FILE = join(DIST, 'lab', 'site-inventory', 'data.json');

/**
 * Explicitly registered external artifacts. Each entry is represented as a
 * single inventory route; internal generated files under the artifact are
 * not inventoried as normal pages.
 */
const EXTERNAL_ARTIFACTS = [
  {
    route: '/design-system/lab/',
    // dist file that proves the artifact was built/copied.
    evidenceFile: 'design-system/lab/index.html',
  },
];

/** Walk a directory recursively, yielding relative paths. */
function* walk(dir, prefix = '') {
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      yield* walk(dir, path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

/** Get the short commit SHA, or "unknown". */
function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Discover the sitemap files inside dist/. */
function findSitemapFiles(distDir) {
  const files = [];
  const indexPath = join(distDir, 'sitemap-index.xml');
  if (existsSync(indexPath)) {
    const indexXml = readFileSync(indexPath, 'utf-8');
    for (const url of parseSitemapIndexXML(indexXml)) {
      const rel = url.replace(/^https?:\/\/[^/]+/, '');
      const filePath = join(distDir, rel.replace(/^\//, ''));
      if (existsSync(filePath)) files.push(filePath);
    }
  }
  // Fall back to any top-level sitemap-*.xml files.
  for (const file of readdirSync(distDir)) {
    if (/^sitemap(-[^/]+)?\.xml$/.test(file) && !files.includes(join(distDir, file))) {
      files.push(join(distDir, file));
    }
  }
  return files;
}

/** Run the inventory generation. Returns the output object. */
export async function generateInventory(distDir = DIST) {
  if (!existsSync(distDir)) {
    throw new Error(`dist/ directory not found at ${distDir}. Run pnpm build first.`);
  }

  // ── 1. Built pages ──────────────────────────────────────────────────────
  // Normal site HTML pages (excluding generated tool files and the internal
  // files of explicitly registered external artifacts).
  const builtRoutes = new Set();
  const filesByRoute = new Map();
  for (const file of walk(distDir)) {
    if (EXCEPTIONS.skipFiles.some((p) => file.startsWith(p))) continue;
    if (EXTERNAL_ARTIFACTS.some((a) => file.startsWith(a.route.slice(1)))) continue;
    if (!file.endsWith('.html')) continue;
    const route = normalizeRoute(file);
    builtRoutes.add(route);
    filesByRoute.set(route, file);
  }

  // ── 2. Sitemap ──────────────────────────────────────────────────────────
  const sitemapRoutes = new Set();
  const sitemapLastmod = new Map();
  for (const filePath of findSitemapFiles(distDir)) {
    const xml = readFileSync(filePath, 'utf-8');
    for (const { route, lastmod } of parseSitemapXML(xml)) {
      sitemapRoutes.add(route);
      if (lastmod) sitemapLastmod.set(route, lastmod);
    }
  }

  // ── 3. Per-page data + link graph ───────────────────────────────────────
  const inboundLinks = new Map();
  const pageMeta = new Map();

  for (const [route, file] of filesByRoute) {
    const html = readFileSync(join(distDir, file), 'utf-8');
    const meta = extractMeta(html);
    const links = extractInternalLinks(html, route);
    for (const link of links) {
      if (link === route) continue;
      if (!inboundLinks.has(link)) inboundLinks.set(link, new Set());
      inboundLinks.get(link).add(route);
    }
    pageMeta.set(route, { route, file, ...meta, internalLinks: links });
  }

  // ── 4. Build the page records ───────────────────────────────────────────
  const pages = [];
  const allRoutes = new Set([...builtRoutes, ...sitemapRoutes]);

  for (const route of allRoutes) {
    const built = builtRoutes.has(route);
    const meta = pageMeta.get(route) ?? {};
    const record = {
      route,
      file: built ? meta.file : null,
      size: built ? statSync(join(distDir, meta.file)).size : null,
      built,
      inSitemap: sitemapRoutes.has(route),
      sitemapLastmod: sitemapLastmod.get(route) ?? null,
      title: meta.title ?? null,
      description: meta.description ?? null,
      canonical: meta.canonical ?? null,
      robots: meta.robots ?? null,
      h1Count: meta.h1Count ?? 0,
      h1Texts: meta.h1Texts ?? [],
      redirectTarget: meta.redirectTarget ?? null,
      inboundCount: inboundLinks.get(route)?.size ?? 0,
      warnings: [],
    };
    record.classification = classifyPage(record.route, record).type;
    pages.push(record);
  }

  // ── 5. External artifacts ───────────────────────────────────────────────
  // Represent each registered artifact as a single route, using its
  // evidence file to determine whether it was built in this deployment.
  for (const artifact of EXTERNAL_ARTIFACTS) {
    const evidencePath = join(distDir, artifact.evidenceFile);
    const built = existsSync(evidencePath);
    const meta = built ? extractMeta(readFileSync(evidencePath, 'utf-8')) : {};
    const existing = pages.find((p) => p.route === artifact.route);
    const record = {
      route: artifact.route,
      file: built ? artifact.evidenceFile : null,
      size: built ? statSync(evidencePath).size : null,
      built,
      inSitemap: sitemapRoutes.has(artifact.route),
      sitemapLastmod: sitemapLastmod.get(artifact.route) ?? null,
      title: meta.title ?? null,
      description: meta.description ?? null,
      canonical: meta.canonical ?? null,
      robots: meta.robots ?? null,
      h1Count: meta.h1Count ?? 0,
      h1Texts: meta.h1Texts ?? [],
      redirectTarget: null,
      inboundCount: 0,
      warnings: [],
    };
    record.classification = classifyPage(record.route, record).type;
    if (existing) {
      Object.assign(existing, record);
    } else {
      pages.push(record);
    }
  }

  // ── 6. Warning detection ────────────────────────────────────────────────
  const pageByRoute = new Map(pages.map((p) => [p.route, p]));
  for (const page of pages) {
    page.warnings = detectWarnings(page.route, page, builtRoutes, sitemapRoutes);
  }

  // ── 7. Duplicate metadata detection ─────────────────────────────────────
  const dupWarnings = detectDuplicateMetadata(pages);
  for (const w of dupWarnings) {
    const page = pageByRoute.get(w.route);
    if (page) page.warnings.push({ code: w.code, message: w.message });
  }

  // ── 8. Summary ──────────────────────────────────────────────────────────
  const normalIndexable = pages.filter((p) => {
    const cls = classifyPage(p.route, p);
    return cls.isIndexable && cls.expectInternalLinks && p.built;
  });
  const summary = {
    totalUrls: pages.length,
    builtPages: pages.filter((p) => p.built).length,
    sitemapUrls: sitemapRoutes.size,
    orphanedPages: normalIndexable.filter((p) => p.inboundCount === 0).length,
    pagesWithWarnings: pages.filter((p) => p.warnings.length > 0).length,
    totalWarnings: pages.reduce((sum, p) => sum + p.warnings.length, 0),
  };

  return { pages, summary, provenance: { commitSha: getCommitSha() } };
}

/** CLI entry point. */
async function main() {
  console.log('📄 Generating site inventory…');
  const output = await generateInventory(DIST);
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ Wrote ${OUT_FILE}`);
  console.log(
    `   ${output.summary.totalUrls} URLs, ${output.summary.pagesWithWarnings} page(s) with ${output.summary.totalWarnings} warning(s).`,
  );
}

// Only run when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('❌', err.message ?? err);
    process.exit(1);
  });
}

export default { generateInventory };
