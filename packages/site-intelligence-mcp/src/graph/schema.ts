/**
 * Site Inventory artifact schema.
 *
 * Types and a small runtime validator for the generated site inventory at
 * `dist/lab/site-inventory/data.json` (produced by
 * `scripts/generate-site-inventory.mjs` via the root `postbuild` hook).
 */

export type InventoryWarning = {
  code: string;
  message: string;
};

export type InventoryPage = {
  route: string;
  file: string | null;
  size: number | null;
  built: boolean;
  inSitemap: boolean;
  sitemapLastmod: string | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1Count: number;
  h1Texts: string[];
  redirectTarget: string | null;
  inboundCount: number;
  warnings: InventoryWarning[];
  classification?: string;
};

export type SiteInventorySummary = {
  totalUrls: number;
  builtPages: number;
  sitemapUrls: number;
  orphanedPages: number;
  pagesWithWarnings: number;
  totalWarnings: number;
};

export type SiteInventory = {
  pages: InventoryPage[];
  summary: SiteInventorySummary;
  provenance?: { commitSha?: string };
};

export type ValidationResult = { ok: true; data: SiteInventory } | { ok: false; error: string };

const SUMMARY_KEYS = [
  'totalUrls',
  'builtPages',
  'sitemapUrls',
  'orphanedPages',
  'pagesWithWarnings',
  'totalWarnings',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Runtime validation of the site inventory artifact shape. */
export function validateSiteInventory(raw: unknown): ValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: 'top-level value is not an object.' };
  }
  if (!Array.isArray(raw.pages)) {
    return { ok: false, error: '"pages" is missing or not an array.' };
  }
  if (!isRecord(raw.summary)) {
    return { ok: false, error: '"summary" is missing or not an object.' };
  }

  for (const key of SUMMARY_KEYS) {
    const value = raw.summary[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, error: `summary.${key} is missing or not a finite number.` };
    }
  }

  for (const [index, page] of raw.pages.entries()) {
    if (!isRecord(page) || typeof page.route !== 'string' || !page.route.startsWith('/')) {
      return { ok: false, error: `pages[${index}].route is missing or not a "/"-prefixed string.` };
    }
  }

  const data = raw as unknown as SiteInventory;
  return { ok: true, data };
}
