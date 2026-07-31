/**
 * The `get_page` MCP tool.
 *
 * Returns the exact page record for a normalized route, using only fields
 * supported by the generated inventory.
 */
import {
  defaultInventoryPath,
  InventoryLoadError,
  loadSiteInventory,
} from '../graph/load-graph.js';
import type { InventoryPage, SiteInventory } from '../graph/schema.js';
import {
  getInventory,
  InvalidRouteInputError,
  lookupPage,
  RouteNotFoundError,
} from './page-lookup.js';
import type { ToolContentResult } from './types.js';

export type GetPageInput = {
  route: string;
};

export type GetPageResult = {
  generatedCommit?: string;
  page: {
    route: string;
    title: string | null;
    description: string | null;
    classification: string | null;
    built: boolean;
    inSitemap: boolean;
    canonical: string | null;
    robots: string | null;
    h1Count: number;
    h1Texts: string[];
    redirectTarget: string | null;
    inboundCount: number;
    warnings: Array<{ code: string; message: string }>;
  };
};

/**
 * Build the page result from an inventory page record.
 */
export function buildPageResult(inventory: SiteInventory, page: InventoryPage): GetPageResult {
  return {
    generatedCommit: inventory.provenance?.commitSha,
    page: {
      route: page.route,
      title: page.title,
      description: page.description,
      classification: page.classification ?? null,
      built: page.built,
      inSitemap: page.inSitemap,
      canonical: page.canonical,
      robots: page.robots,
      h1Count: page.h1Count,
      h1Texts: page.h1Texts,
      redirectTarget: page.redirectTarget,
      inboundCount: page.inboundCount,
      warnings: page.warnings.map((w) => ({ code: w.code, message: w.message })),
    },
  };
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function getPageToolHandler(args: GetPageInput): Promise<ToolContentResult> {
  try {
    const page = lookupPage(args.route);
    const inventory = getInventory();
    const result = buildPageResult(inventory, page);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    let message: string;
    if (error instanceof InvalidRouteInputError) {
      message = `Invalid route: ${error.message}`;
    } else if (error instanceof RouteNotFoundError) {
      message = error.message;
    } else if (error instanceof InventoryLoadError) {
      message = error.message;
    } else {
      message = 'Unexpected error reading site inventory.';
    }
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
