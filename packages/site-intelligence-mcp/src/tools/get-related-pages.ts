/**
 * The `get_related_pages` MCP tool.
 *
 * Returns a ranked list of pages related to the given route, with scores and
 * deterministic reasons explaining why each page is considered related.
 */
import { InventoryLoadError } from '../graph/load-graph.js';
import type { SiteInventory } from '../graph/schema.js';
import { getInventory, lookupPage, validateRouteInput } from './page-lookup.js';
import { calculateRelatedPages, RELATED_PAGES_LIMIT } from './related-pages.js';
import type { ToolContentResult } from './types.js';

export type GetRelatedPagesInput = {
  route: string;
};

export type GetRelatedPagesResult = {
  generatedCommit?: string;
  route: string;
  resultCount: number;
  results: Array<{
    route: string;
    title: string | null;
    classification: string | null;
    score: number;
    reasons: string[];
  }>;
};

/**
 * Build the related pages result from scored pages.
 */
function buildRelatedPagesResult(
  inventory: SiteInventory,
  results: Array<{
    route: string;
    title: string | null;
    classification: string | null;
    score: number;
    reasons: string[];
  }>,
  route: string,
): GetRelatedPagesResult {
  return {
    generatedCommit: inventory.provenance?.commitSha,
    route,
    resultCount: results.length,
    results,
  };
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function getRelatedPagesToolHandler(
  args: GetRelatedPagesInput,
): Promise<ToolContentResult> {
  try {
    // Validate and normalize the route (throws InvalidRouteInputError for invalid input)
    const route = validateRouteInput(args.route);
    // Lookup the source page (throws RouteNotFoundError if missing)
    lookupPage(route);

    const inventory = getInventory();
    const results = calculateRelatedPages(inventory, route, RELATED_PAGES_LIMIT);

    const result = buildRelatedPagesResult(inventory, results, route);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    let message: string;
    if (error instanceof InventoryLoadError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = `Invalid route: ${error.message}`;
    } else {
      message = 'Unexpected error finding related pages.';
    }
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
