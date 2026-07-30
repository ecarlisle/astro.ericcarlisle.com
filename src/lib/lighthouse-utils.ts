/**
 * Shared utility functions for Lighthouse score processing.
 *
 * Pure functions used by the generator, footer component, and tests.
 */

export interface LighthousePageScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface LighthousePageData {
  route: string;
  scores: LighthousePageScores;
  timestamp: string | null;
  lighthouseVersion: string | null;
  formFactor: string;
}

export interface LighthouseScoresFile {
  generatedAt: string;
  commitSha: string;
  lighthouseVersion: string | null;
  pages: LighthousePageData[];
}

/**
 * Normalize a URL pathname to a canonical site route.
 * Ensures leading slash, strips index.html, ensures trailing slash.
 */
export function normalizeRoute(pathname: string): string {
  let path = pathname;
  // Remove trailing index.html
  path = path.replace(/\/index\.html$/, '/');
  // Ensure leading slash
  if (!path.startsWith('/')) path = `/${path}`;
  // Ensure trailing slash (for consistency with Astro output and sitemap)
  if (!path.endsWith('/')) path += '/';
  return path;
}

/**
 * Normalize a full Lighthouse report URL to a canonical site route.
 */
export function normalizeReportUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return normalizeRoute(url.pathname);
  } catch {
    return null;
  }
}

/**
 * Extract validated category scores from a Lighthouse categories object.
 * Returns null for categories that are missing or have null scores.
 */
export function extractScores(
  categories: Record<string, { score?: number | null }> | undefined,
): LighthousePageScores {
  function score(key: string): number | null {
    if (!categories?.[key]) return null;
    const s = categories[key]?.score;
    if (s == null) return null;
    const rounded = Math.round(s * 100);
    if (!Number.isFinite(rounded) || rounded < 0 || rounded > 100) return null;
    return rounded;
  }
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
  };
}

/**
 * Check whether at least one score in the set is non-null.
 */
export function hasAnyScore(scores: LighthousePageScores): boolean {
  return (
    scores.performance !== null ||
    scores.accessibility !== null ||
    scores.bestPractices !== null ||
    scores.seo !== null
  );
}

/**
 * Select the median representative entry from a list of records for the same route.
 * Uses Performance score as the sort key, with filename as tie-breaker.
 *
 * For an even number of entries, selects the upper-middle entry
 * (Math.floor(N/2)), which is the higher of the two middle values.
 * For 4 entries sorted [a, b, c, d], index 2 (c) is selected.
 * This is a deliberate policy; use the same selection in both the
 * generator and tests.
 */
export function selectRepresentative(
  entries: (LighthousePageData & { _file?: string })[],
): LighthousePageData {
  const sorted = [...entries].sort((a, b) => {
    const aScore = a.scores.performance ?? -1;
    const bScore = b.scores.performance ?? -1;
    if (aScore !== bScore) return aScore - bScore;
    return (a._file || '').localeCompare(b._file || '');
  });
  const medianIdx = Math.floor(sorted.length / 2);
  const { _file, ...rest } = sorted[medianIdx];
  return rest;
}

/**
 * Given a LighthouseScoresFile and a route string, find the matching page data.
 * Uses normalizeRoute on both sides for consistent matching.
 */
export function findPageData(
  scoresFile: LighthouseScoresFile,
  route: string,
): LighthousePageData | null {
  const normalized = normalizeRoute(route);
  return scoresFile.pages.find((p) => normalizeRoute(p.route) === normalized) ?? null;
}
