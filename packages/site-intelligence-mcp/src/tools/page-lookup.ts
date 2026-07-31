/**
 * Shared page lookup and route normalization for site-intelligence MCP tools.
 *
 * Provides a single normalization strategy and consistent error handling
 * for page lookup across all tools that accept a route parameter.
 */
import {
  defaultInventoryPath,
  InventoryLoadError,
  loadSiteInventory,
} from '../graph/load-graph.js';
import type { InventoryPage, SiteInventory } from '../graph/schema.js';

/** Normalize a route input to the canonical inventory format. */
export function normalizeRouteInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '/';
  }

  let path: string = trimmed;

  // Full URL: extract pathname
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return '/';
    }
  } else {
    // Path-only: strip fragment and query
    const parts = path.split('#');
    const pathPart = parts[0] ?? '';
    const queryParts = pathPart.split('?');
    path = queryParts[0] ?? '';
  }

  // Remove trailing index.html
  path = path.replace(/(^|\/)index\.html$/, '/');

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Ensure trailing slash
  if (!path.endsWith('/')) {
    path += '/';
  }

  return path;
}

/** Error thrown when a route is not found in the inventory. */
export class RouteNotFoundError extends Error {
  constructor(route: string) {
    super(`Route "${route}" not found in site inventory.`);
    this.name = 'RouteNotFoundError';
  }
}

/** Error thrown when route input is invalid. */
export class InvalidRouteInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRouteInputError';
  }
}

/**
 * Load the site inventory, returning a cached instance for the current process
 * to avoid repeated disk I/O during a single tool invocation.
 */
let inventoryCache: { path: string; data: SiteInventory } | null = null;

export function getInventory(inventoryPath?: string): SiteInventory {
  const path = inventoryPath ?? defaultInventoryPath();
  if (inventoryCache && inventoryCache.path === path) {
    return inventoryCache.data;
  }
  const data = loadSiteInventory(path);
  inventoryCache = { path, data };
  return data;
}

/**
 * Find a page by exact normalized route.
 * Throws RouteNotFoundError if not found.
 */
export function findPageByRoute(inventory: SiteInventory, route: string): InventoryPage {
  const page = inventory.pages.find((p) => p.route === route);
  if (!page) {
    throw new RouteNotFoundError(route);
  }
  return page;
}

/**
 * Validate route input: non-empty string after normalization.
 * Returns the normalized route, or throws InvalidRouteInputError.
 */
export function validateRouteInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new InvalidRouteInputError('Route must be a string.');
  }
  const normalized = normalizeRouteInput(input);
  if (normalized === '/') {
    // Allow root but reject empty/whitespace-only that normalized to root
    if (!input.trim()) {
      throw new InvalidRouteInputError('Route must be a non-empty string.');
    }
  }
  return normalized;
}

/**
 * Combined helper: validate input, load inventory, find page.
 * Throws InvalidRouteInputError or RouteNotFoundError with clear messages.
 */
export function lookupPage(routeInput: unknown, inventoryPath?: string): InventoryPage {
  const normalizedRoute = validateRouteInput(routeInput);
  const inventory = getInventory(inventoryPath);
  return findPageByRoute(inventory, normalizedRoute);
}

/**
 * Determine if a page is orphaned using the inventory's existing semantics.
 * An orphaned page is an indexable, built page expected to have internal links
 * but with inboundCount === 0. This matches the ORPHANED_PAGE warning logic.
 */
export function isPageOrphaned(page: InventoryPage): boolean {
  // Use the same logic as detectWarnings in site-inventory-core.mjs:
  // - built page
  // - indexable (normal classification)
  // - expected to have internal links
  // - inboundCount === 0
  if (!page.built) return false;
  if (page.classification !== 'normal') return false;
  return page.inboundCount === 0;
}
