/**
 * Shared search implementation for site-intelligence MCP tools.
 *
 * Provides deterministic search over the generated site inventory.
 */

import type { InventoryPage } from '../graph/schema.js';

/** A scored search result. */
export type SearchResult = {
  route: string;
  title: string | null;
  description: string | null;
  classification: string | null;
  score: number;
};

/** Normalize a query string for comparison. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Validate search query input. */
export function validateSearchQuery(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Query must be a string.');
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Query must be a non-empty string.');
  }
  return trimmed;
}

/** Tokenize a string into searchable terms. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Check if a string contains all query tokens. */
function containsAllTokens(haystack: string, tokens: string[]): boolean {
  const lower = haystack.toLowerCase();
  return tokens.every((token) => lower.includes(token));
}

/** Calculate search score for a page against the query. */
export function calculateScore(page: InventoryPage, query: string): number {
  const normalizedQuery = normalizeQuery(query);
  const tokens = tokenize(normalizedQuery);

  if (tokens.length === 0) return 0;

  const title = page.title ?? '';
  const route = page.route;
  const description = page.description ?? '';
  const headings = page.h1Texts.join(' ');
  const classification = page.classification ?? '';

  let score = 0;

  // 1. Exact title match
  if (title.toLowerCase() === normalizedQuery) {
    score += 1000;
  }

  // 2. Exact route match
  if (route.toLowerCase() === normalizedQuery) {
    score += 900;
  }

  // 3. Title prefix
  if (title.toLowerCase().startsWith(normalizedQuery)) {
    score += 800;
  }

  // 4. Route prefix
  if (route.toLowerCase().startsWith(normalizedQuery)) {
    score += 700;
  }

  // 5. Title substring
  if (containsAllTokens(title, tokens)) {
    score += 600;
  }

  // 6. Description substring
  if (containsAllTokens(description, tokens)) {
    score += 500;
  }

  // 7. Heading match (h1Texts)
  if (containsAllTokens(headings, tokens)) {
    score += 400;
  }

  // 8. Tag match (from route - e.g., /tags/3d-printing/ -> 3d-printing)
  const tagMatch = route.match(/\/tags\/([^/]+)\//);
  if (tagMatch?.[1] && tokens.some((t) => tagMatch[1]?.includes(t))) {
    score += 300;
  }

  // 9. Token match in any field
  if (containsAllTokens(title, tokens)) {
    score += 200;
  }
  if (containsAllTokens(description, tokens)) {
    score += 150;
  }
  if (containsAllTokens(headings, tokens)) {
    score += 100;
  }
  if (containsAllTokens(route, tokens)) {
    score += 50;
  }
  if (containsAllTokens(classification, tokens)) {
    score += 25;
  }

  return score;
}

/** Search pages in the inventory. */
export function searchPages(inventory: { pages: InventoryPage[] }, query: string): SearchResult[] {
  const validatedQuery = validateSearchQuery(query);

  const results: SearchResult[] = [];

  for (const page of inventory.pages) {
    const score = calculateScore(page, validatedQuery);
    if (score > 0) {
      results.push({
        route: page.route,
        title: page.title,
        description: page.description,
        classification: page.classification ?? null,
        score,
      });
    }
  }

  // Deterministic sorting: higher score first, then title, then route
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const titleA = (a.title ?? '').toLowerCase();
    const titleB = (b.title ?? '').toLowerCase();
    if (titleA !== titleB) {
      return titleA.localeCompare(titleB);
    }
    return a.route.localeCompare(b.route);
  });

  return results;
}
