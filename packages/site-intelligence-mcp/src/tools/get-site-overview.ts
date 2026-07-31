/**
 * The `get_site_overview` MCP tool.
 */
import {
  defaultInventoryPath,
  InventoryLoadError,
  loadSiteInventory,
} from '../graph/load-graph.js';
import type { SiteInventory } from '../graph/schema.js';

export type SiteOverview = {
  source: string;
  generatedCommit?: string;
  totalUrls: number;
  builtPages: number;
  sitemapUrls: number;
  orphanedPages: number;
  pagesWithWarnings: number;
  totalWarnings: number;
  categories: Record<string, number>;
  warningsByCode: Record<string, number>;
};

export type ToolContentResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

/**
 * Derive a compact overview from the site inventory.
 *
 * Only fields backed by the generated artifact are included. The complete
 * inventory, page lists, and raw JSON are intentionally not returned.
 */
export function buildSiteOverview(inventory: SiteInventory, source: string): SiteOverview {
  const pages = inventory.pages ?? [];
  const summary = inventory.summary;

  const categories: Record<string, number> = {};
  for (const page of pages) {
    const key = page.classification ?? (page.built ? 'page' : 'unbuilt');
    categories[key] = (categories[key] ?? 0) + 1;
  }

  const warningsByCode: Record<string, number> = {};
  for (const page of pages) {
    for (const warning of page.warnings ?? []) {
      warningsByCode[warning.code] = (warningsByCode[warning.code] ?? 0) + 1;
    }
  }

  const overview: SiteOverview = {
    source,
    generatedCommit: inventory.provenance?.commitSha,
    totalUrls: summary?.totalUrls ?? pages.length,
    builtPages: summary?.builtPages ?? pages.filter((p) => p.built).length,
    sitemapUrls: summary?.sitemapUrls ?? pages.filter((p) => p.inSitemap).length,
    orphanedPages: summary?.orphanedPages ?? 0,
    pagesWithWarnings:
      summary?.pagesWithWarnings ?? pages.filter((p) => (p.warnings?.length ?? 0) > 0).length,
    totalWarnings:
      summary?.totalWarnings ?? pages.reduce((sum, p) => sum + (p.warnings?.length ?? 0), 0),
    categories,
    warningsByCode,
  };

  return overview;
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function getSiteOverviewToolHandler(): Promise<ToolContentResult> {
  try {
    const filePath = defaultInventoryPath();
    const inventory = loadSiteInventory(filePath);
    const overview = buildSiteOverview(inventory, filePath);
    return {
      content: [{ type: 'text', text: JSON.stringify(overview, null, 2) }],
    };
  } catch (error) {
    const message =
      error instanceof InventoryLoadError
        ? error.message
        : 'Unexpected error reading site inventory.';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
