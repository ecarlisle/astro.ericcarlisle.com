#!/usr/bin/env node
/**
 * SEO Hygiene Validator (deterministic gate)
 *
 * Runs against the completed `dist/` output and fails (exit code 1) when any
 * SEO/indexing-hygiene violation is found. It reuses the site-inventory core
 * so the sitemap, metadata, canonical, and link analysis share one codebase
 * with the /lab/site-inventory/ page and this gate.
 *
 * Exit codes:
 *   0 - no SEO hygiene violations
 *   1 - one or more violations found
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateInventory } from './generate-site-inventory.mjs';
import { isRedirectRoute } from './seo-policy.mjs';
import {
  detectBrokenInternalLinks,
  detectDuplicateMetadata,
  detectWarnings,
  extractMeta,
  findRedundantAltPrefixes,
} from './site-inventory-core.mjs';

const ROOT = join(import.meta.dirname, '..');
const DIST = process.env.SEO_DIST || join(ROOT, 'dist');
const LAB_DIR = join(DIST, 'design-system', 'lab');

/** Warning codes that violate SEO hygiene and must fail the gate. */
const FAILURE_CODES = new Set([
  'BROKEN_INTERNAL_LINK',
  'DUPLICATE_CANONICAL',
  'DUPLICATE_TITLE',
  'DUPLICATE_DESCRIPTION',
  'MISSING_TITLE',
  'MISSING_DESCRIPTION',
  'MISSING_CANONICAL',
  'CANONICAL_MISMATCH',
  'CANONICAL_EXTERNAL_ORIGIN',
  'CANONICAL_TARGET_MISSING',
  'NOINDEX_IN_SITEMAP',
  'REDIRECT_IN_SITEMAP',
  'NO_BUILT_PAGE',
  'MISSING_FROM_SITEMAP',
]);

/** Collect SEO-hygiene violations from the completed build output. */
export async function runSeoValidation(distDir = DIST) {
  const failures = [];
  const notes = [];

  const { pages } = await generateInventory(distDir);
  const pageByRoute = new Map(pages.map((p) => [p.route, p]));
  const builtRoutes = new Set(pages.filter((p) => p.built).map((p) => p.route));
  const sitemapRoutes = new Set(pages.filter((p) => p.inSitemap).map((p) => p.route));

  const push = (violation) => failures.push(violation);

  // 1. Per-page warnings from the shared core (only the failing codes).
  for (const page of pages) {
    for (const w of detectWarnings(page.route, page, builtRoutes, sitemapRoutes)) {
      if (FAILURE_CODES.has(w.code)) {
        push({ code: w.code, message: w.message, route: page.route, target: w.target ?? null });
      }
    }
  }

  // 2. Duplicate title / description / canonical. Redirect and noindex
  //    aliases intentionally share the destination's canonical and metadata
  //    (e.g. /posts/... and the old blog alias resolve to the canonical
  //    article), so those routes are excluded from conflict checks.
  const isIndexingAlias = (route) => {
    const p = pageByRoute.get(route);
    if (p && (p.robots ?? '').toLowerCase().includes('noindex')) return true;
    if (isRedirectRoute(route)) return true;
    return false;
  };
  for (const w of detectDuplicateMetadata(pages)) {
    if (w.code === 'DUPLICATE_CANONICAL') continue; // handled below, alias-aware
    if (isIndexingAlias(w.route)) continue;
    push({ code: w.code, message: w.message, route: w.route, target: null });
  }

  // Duplicate canonical among indexable pages (aliases excluded).
  const canonMap = new Map();
  for (const p of pages) {
    if (!p.canonical || isIndexingAlias(p.route)) continue;
    if (!canonMap.has(p.canonical)) canonMap.set(p.canonical, []);
    canonMap.get(p.canonical).push(p.route);
  }
  for (const [canonical, routes] of canonMap) {
    if (routes.length < 2) continue;
    for (const route of routes) {
      push({
        code: 'DUPLICATE_CANONICAL',
        message: `Canonical "${canonical}" is also used by: ${routes.filter((r) => r !== route).join(', ')}`,
        route,
        target: null,
      });
    }
  }

  // 3. Broken internal links. Valid targets = built pages (incl. redirect
  //    aliases) + registered external artifacts.
  const validRoutes = new Set(builtRoutes);
  for (const page of pages) {
    if (page.classification === 'external-artifact') validRoutes.add(page.route);
  }
  for (const w of detectBrokenInternalLinks(pages, validRoutes)) {
    push({ code: w.code, message: w.message, route: w.route, target: w.target });
  }

  // 4. Redundant "Image:" alt-text prefixes across built pages.
  for (const page of pages) {
    if (!page.built || !page.file) continue;
    const html = readFileSync(join(distDir, page.file), 'utf-8');
    for (const off of findRedundantAltPrefixes(html)) {
      push({
        code: 'REDUNDANT_ALT_PREFIX',
        message: `Image alt text on "${page.route}" begins with a redundant prefix: ${JSON.stringify(off.alt)}.`,
        route: page.route,
        target: null,
      });
    }
  }

  // 5. Policy assertions for specifically-managed routes.
  const search = pageByRoute.get('/search/');
  if (search && !(search.robots ?? '').toLowerCase().includes('noindex')) {
    push({
      code: 'SEARCH_NOINDEX',
      message:
        '/search/ is indexable; it must carry robots="noindex, follow" and stay out of the sitemap.',
      route: '/search/',
      target: null,
    });
  }

  const designSystem = pageByRoute.get('/portfolio/design-system/');
  if (designSystem && (designSystem.robots ?? '').toLowerCase().includes('noindex')) {
    push({
      code: 'DESIGN_SYSTEM_INDEXABLE',
      message:
        '/portfolio/design-system/ is noindex; the Design System Companion must be indexable.',
      route: '/portfolio/design-system/',
      target: null,
    });
  }

  // 6. Storybook lab noindex (manager + iframe). Skipped when the lab was not
  //    built into dist.
  if (existsSync(LAB_DIR)) {
    for (const doc of ['index.html', 'iframe.html']) {
      const file = join(LAB_DIR, doc);
      if (!existsSync(file)) {
        push({
          code: 'STORYBOOK_NOINDEX',
          message: `Storybook document "design-system/lab/${doc}" is missing; it must exist and carry noindex.`,
          route: '/design-system/lab/',
          target: null,
        });
        continue;
      }
      const meta = extractMeta(readFileSync(file, 'utf-8'));
      if (!(meta.robots ?? '').toLowerCase().includes('noindex')) {
        push({
          code: 'STORYBOOK_NOINDEX',
          message: `Storybook "${doc}" is missing robots="noindex, follow".`,
          route: '/design-system/lab/',
          target: null,
        });
      }
    }
  } else {
    notes.push('Storybook lab not present in dist; STORYBOOK_NOINDEX check skipped.');
  }

  // 7. Any redirect alias in the sitemap fails.
  for (const route of sitemapRoutes) {
    if (isRedirectRoute(route)) {
      push({
        code: 'REDIRECT_IN_SITEMAP',
        message: `Redirect alias "${route}" appears in the sitemap.`,
        route,
        target: null,
      });
    }
  }

  return { failures, notes, summary: pages.length };
}

/** CLI entry point. */
async function main() {
  console.log('🔍 Running SEO hygiene validation…');
  const { failures, notes, summary } = await runSeoValidation(DIST);
  for (const note of notes) console.log(`   (note) ${note}`);

  if (failures.length === 0) {
    console.log(`✅ No SEO hygiene violations across ${summary} URLs.`);
    return;
  }

  console.log(`✗ ${failures.length} SEO hygiene violation(s) across ${summary} URLs:\n`);
  for (const f of failures) {
    const where = f.route ? ` [${f.route}]` : '';
    const target = f.target ? ` -> ${f.target}` : '';
    console.log(`  - ${f.code}${where}: ${f.message}${target}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
