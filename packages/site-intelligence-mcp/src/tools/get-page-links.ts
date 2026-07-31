/**
 * The `get_page_links` MCP tool.
 *
 * Returns incoming and outgoing internal route relationships for a page.
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
  isPageOrphaned,
  lookupPage,
  RouteNotFoundError,
} from './page-lookup.js';
import type { ToolContentResult } from './types.js';

export type GetPageLinksInput = {
  route: string;
};

export type GetPageLinksResult = {
  generatedCommit?: string;
  route: string;
  incoming: string[];
  outgoing: string[];
  inboundCount: number;
  outgoingCount: number;
  orphaned: boolean;
};

/**
 * Build the page links result from an inventory page record.
 */
export function buildPageLinksResult(
  inventory: SiteInventory,
  page: InventoryPage,
): GetPageLinksResult {
  const incoming = [...new Set(page.incoming)].sort();
  const outgoing = [...new Set(page.outgoing)].sort();
  return {
    generatedCommit: inventory.provenance?.commitSha,
    route: page.route,
    incoming,
    outgoing,
    inboundCount: incoming.length,
    outgoingCount: outgoing.length,
    orphaned: isPageOrphaned(page),
  };
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function getPageLinksToolHandler(args: GetPageLinksInput): Promise<ToolContentResult> {
  try {
    const page = lookupPage(args.route);
    const inventory = getInventory();
    const result = buildPageLinksResult(inventory, page);
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
