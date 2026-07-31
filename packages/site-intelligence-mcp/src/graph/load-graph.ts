/**
 * Load and validate the generated site inventory artifact.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type SiteInventory, validateSiteInventory } from './schema.js';

/** Thrown for missing, malformed, or structurally invalid inventory data. */
export class InventoryLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InventoryLoadError';
  }
}

/**
 * Walk upward from `startDir` to find the repository root, identified by the
 * presence of `pnpm-workspace.yaml`. This is independent of the caller's
 * current working directory and of the package's compiled output depth.
 * Returns null when no repository root is found before the filesystem root.
 */
export function findRepoRoot(startDir: string): string | null {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Resolve the inventory artifact path.
 *
 * Priority:
 *  1. `SITE_INTELLIGENCE_INVENTORY_PATH` env override (resolved against cwd).
 *  2. The repository root found by walking upward from this module's own
 *     compiled location, then `<repo>/dist/lab/site-inventory/data.json`.
 *     This does not depend on the caller's working directory, so it works
 *     when an MCP client launches the server with an unrelated cwd.
 *  3. Fallback to `<cwd>/dist/lab/site-inventory/data.json` as a convenience
 *     when launched from the repository root via a root pnpm script.
 */
export function defaultInventoryPath(): string {
  const override = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  if (override) {
    return resolve(override);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = findRepoRoot(here);
  if (repoRoot) {
    return resolve(repoRoot, 'dist', 'lab', 'site-inventory', 'data.json');
  }

  return resolve(process.cwd(), 'dist', 'lab', 'site-inventory', 'data.json');
}

/** Load and validate the site inventory artifact. */
export function loadSiteInventory(filePath: string): SiteInventory {
  if (!existsSync(filePath)) {
    throw new InventoryLoadError(
      `Site inventory data not found at "${filePath}". ` +
        'Generate it with `pnpm build` (the postbuild hook runs the inventory generator).',
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    throw new InventoryLoadError(`Site inventory at "${filePath}" is not valid JSON.`, {
      cause: error,
    });
  }

  const result = validateSiteInventory(raw);
  if (!result.ok) {
    throw new InventoryLoadError(
      `Site inventory at "${filePath}" is structurally invalid: ${result.error}`,
    );
  }

  return result.data;
}
