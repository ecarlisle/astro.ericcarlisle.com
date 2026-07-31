/**
 * The `get_site_warnings` MCP tool.
 *
 * Complements `get_site_overview`: the overview reports warning totals and
 * codes; this tool exposes the individual warning records already present in
 * the generated site inventory, so an agent can see which pages are affected.
 */
import {
  defaultInventoryPath,
  InventoryLoadError,
  loadSiteInventory,
} from '../graph/load-graph.js';
import type { SiteInventory } from '../graph/schema.js';
import type { ToolContentResult } from './types.js';

/** A single warning record, flattened from a page in the inventory. */
export type SiteWarning = {
  code: string;
  route: string;
  title: string | null;
  message: string;
};

export type SiteWarnings = {
  generatedCommit?: string;
  warningCount: number;
  warnings: SiteWarning[];
};

/**
 * Flatten the warning records present in the inventory into a per-warning
 * list, preserving page and warning order.
 *
 * Only fields backed by the generated artifact are included. The inventory
 * records warnings with `code` and `message` only — it carries no severity
 * and no generated-at timestamp — so none are fabricated here.
 */
export function buildSiteWarnings(inventory: SiteInventory): SiteWarnings {
  const warnings: SiteWarning[] = [];
  for (const page of inventory.pages ?? []) {
    for (const warning of page.warnings ?? []) {
      warnings.push({
        code: warning.code,
        route: page.route,
        title: page.title,
        message: warning.message,
      });
    }
  }

  return {
    generatedCommit: inventory.provenance?.commitSha,
    warningCount: warnings.length,
    warnings,
  };
}

/**
 * MCP tool handler. Returns a structured text result; on load/validation
 * errors returns a clear, actionable error result without stack traces.
 */
export async function getSiteWarningsToolHandler(): Promise<ToolContentResult> {
  try {
    const filePath = defaultInventoryPath();
    const inventory = loadSiteInventory(filePath);
    const warnings = buildSiteWarnings(inventory);
    return {
      content: [{ type: 'text', text: JSON.stringify(warnings, null, 2) }],
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
