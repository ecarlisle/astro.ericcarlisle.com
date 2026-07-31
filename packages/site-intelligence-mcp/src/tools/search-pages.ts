/**
 * The `search_pages` MCP tool.
 *
 * Searches the generated site inventory for pages matching a query string.
 * Returns a ranked list of matching pages with scores.
 */
import { InventoryLoadError } from '../graph/load-graph.js';
import type { SiteInventory } from '../graph/schema.js';
import { getInventory } from './page-lookup.js';
import { searchPages, validateSearchQuery } from './search-helper.js';
import type { ToolContentResult } from './types.js';

export type SearchPagesInput = {
  query: string;
};

export type SearchPagesResult = {
  generatedCommit?: string;
  query: string;
  resultCount: number;
  results: Array<{
    route: string;
    title: string | null;
    description: string | null;
    classification: string | null;
    score: number;
  }>;
};

/**
 * Build the search result from inventory pages.
 */
function buildSearchResult(
  inventory: SiteInventory,
  results: Array<{
    route: string;
    title: string | null;
    description: string | null;
    classification: string | null;
    score: number;
  }>,
  query: string,
): SearchPagesResult {
  return {
    generatedCommit: inventory.provenance?.commitSha,
    query,
    resultCount: results.length,
    results,
  };
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function searchPagesToolHandler(args: SearchPagesInput): Promise<ToolContentResult> {
  try {
    validateSearchQuery(args.query);

    const inventory = getInventory();
    const results = searchPages(inventory, args.query);

    const result = buildSearchResult(inventory, results, args.query);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    let message: string;
    if (error instanceof InventoryLoadError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = `Invalid query: ${error.message}`;
    } else {
      message = 'Unexpected error searching site inventory.';
    }
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
