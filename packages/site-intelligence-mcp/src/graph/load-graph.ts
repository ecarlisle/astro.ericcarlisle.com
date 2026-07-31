/**
 * Load and validate the generated site inventory artifact.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
 * Resolve the inventory artifact path.
 *
 * Priority:
 *  1. `SITE_INTELLIGENCE_INVENTORY_PATH` env override (resolved against cwd).
 *  2. A path resolved relative to this package's location inside the
 *     repository (`packages/site-intelligence-mcp/dist/…` → repo root
 *     `dist/lab/site-inventory/data.json`). This does not depend on the
 *     caller's working directory.
 *  3. Fallback to `<cwd>/dist/lab/site-inventory/data.json` for convenience
 *     when launched from the repository root (e.g. via a root pnpm script).
 */
export function defaultInventoryPath(): string {
  const override = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
  if (override) {
    return resolve(override);
  }

  // Compiled module lives at packages/site-intelligence-mcp/dist/<file>.
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRootFromPackage = resolve(here, '..', '..', '..');
  const packageRelative = resolve(
    repoRootFromPackage,
    'dist',
    'lab',
    'site-inventory',
    'data.json',
  );
  if (existsSync(packageRelative)) {
    return packageRelative;
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
