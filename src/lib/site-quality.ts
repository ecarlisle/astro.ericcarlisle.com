/**
 * Site Quality helpers.
 *
 * Shared functions used by the /portfolio/site-quality/ page and its tests.
 */

/**
 * Extract a display pathname from a Lighthouse `requestedUrl`.
 *
 * Lighthouse audits the production build through a temporary local server
 * (e.g. `http://localhost:4321/about/`). We keep the original audited URL in
 * the generated data for provenance, but present only the pathname on the
 * public page so it does not appear that a localhost site was measured.
 *
 * We intentionally do NOT substitute `ericcarlisle.com` for `localhost`,
 * because that would falsely imply the live host was audited.
 *
 * Handles:
 *  - full http(s) URLs → pathname
 *  - root and nested routes (trailing slash preserved)
 *  - path-only inputs
 *  - malformed or missing values (fall back to the trimmed raw value or
 *    "unknown")
 */
export function lighthousePath(url: string | null | undefined): string {
  if (!url) return 'unknown';
  const trimmed = String(url).trim();
  if (!trimmed) return 'unknown';

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return normalizeDisplayPath(new URL(trimmed).pathname);
    } catch {
      // Malformed absolute URL — fall back to the raw value.
      return trimmed;
    }
  }

  // Path-only input: strip query/fragment and normalize consistently.
  const path = trimmed.split('#')[0].split('?')[0];
  return normalizeDisplayPath(path);
}

/** Normalize a pathname for display (trailing slash, index.html handling). */
function normalizeDisplayPath(pathname: string): string {
  let path = pathname;
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.endsWith('/index.html')) path = path.slice(0, -'index.html'.length);
  if (path !== '/' && !path.endsWith('/')) path += '/';
  return path;
}
