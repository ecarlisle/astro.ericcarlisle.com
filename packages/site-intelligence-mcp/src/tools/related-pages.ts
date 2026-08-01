/**
 * Related pages implementation for site-intelligence MCP tools.
 *
 * Provides deterministic related-page discovery over the generated site inventory.
 * Uses only inventory-backed signals: link graph, shared tokens, classification.
 */

import type { InventoryPage } from '../graph/schema.js';
import { tokenize } from './search-helper.js';

/** A scored related page result with explanation. */
export type RelatedPageResult = {
  route: string;
  title: string | null;
  classification: string | null;
  score: number;
  reasons: string[];
};

/**
 * Configuration for related pages scoring weights.
 *
 * Scores are cumulative: a page accumulates points from every matching
 * signal, so result scores can exceed any single weight.
 */
export const RELATED_PAGES_WEIGHTS = {
  /** Direct outgoing link from source to target. */
  directOutgoing: 1000,
  /** Direct incoming link from target to source. */
  directIncoming: 1000,
  /** Per shared incoming neighbor (both pages linked from the same route). */
  sharedIncomingNeighbor: 300,
  /** Per shared outgoing neighbor (both pages link to the same route). */
  sharedOutgoingNeighbor: 300,
  /**
   * Maximum shared incoming neighbors counted toward the score. The reasons
   * array still reports the actual shared count.
   */
  maxSharedIncomingNeighbors: 3,
  /**
   * Maximum shared outgoing neighbors counted toward the score. The reasons
   * array still reports the actual shared count.
   */
  maxSharedOutgoingNeighbors: 3,
  /**
   * Shared classification weight for broad classifications (e.g. "normal")
   * that most pages share, so their relationship signal is weak.
   */
  sharedClassificationNormal: 50,
  /**
   * Shared classification weight for distinctive classifications (e.g. "lab")
   * that carry topical meaning.
   */
  sharedClassificationDistinctive: 200,
  /** Shared title token (normalized, stop words excluded). */
  sharedTitleToken: 150,
  /** Shared description token (normalized, stop words excluded). */
  sharedDescriptionToken: 100,
  /** Shared heading token from h1Texts (normalized, stop words excluded). */
  sharedHeadingToken: 100,
  /** Shared tag-route token (e.g., both under /tags/3d-printing/). */
  sharedTagToken: 200,
} as const;

/** Default maximum number of related pages to return. */
export const RELATED_PAGES_LIMIT = 5;

/**
 * Low-information tokens excluded from title, description, and heading
 * matching. Includes common English stop words plus the repeated site-title
 * boilerplate (e.g., "Blog | Eric Carlisle").
 */
export const RELATED_PAGES_STOP_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'with',
  'your',
  // Repeated site-title boilerplate
  'eric',
  'carlisle',
]);

/** Extract tag from route (e.g., /tags/3d-printing/ -> "3d-printing"). */
function extractTag(route: string): string | null {
  const match = route.match(/\/tags\/([^/]+)\//);
  return match?.[1] ?? null;
}

/**
 * Keep only tokens that carry meaning: non-stop-words containing at least one
 * letter or digit. Drops punctuation-only tokens such as "|" or "—" that are
 * part of the site-title boilerplate pattern.
 */
function meaningfulTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !RELATED_PAGES_STOP_WORDS.has(t) && /[a-z0-9]/.test(t));
}

/** Get normalized, stop-word-filtered tokens from a string. */
function getTokens(text: string): string[] {
  return meaningfulTokens(tokenize(text));
}

/** Get all tokens from a page's searchable fields. */
function getPageTokens(page: InventoryPage): {
  title: string[];
  description: string[];
  headings: string[];
  tag: string | null;
} {
  return {
    title: getTokens(page.title ?? ''),
    description: getTokens(page.description ?? ''),
    headings: page.h1Texts.flatMap((h) => getTokens(h)),
    tag: extractTag(page.route),
  };
}

/**
 * Find unique shared tokens between two token arrays. Both sides are
 * deduplicated so repeated words (e.g. repeated h1 headings) do not inflate
 * the shared-token count.
 */
function findSharedTokens(a: string[], b: string[]): string[] {
  const setA = new Set(a);
  const seen = new Set<string>();
  const shared: string[] = [];
  for (const token of b) {
    if (setA.has(token) && !seen.has(token)) {
      seen.add(token);
      shared.push(token);
    }
  }
  return shared;
}

/** Shared classification weight for a given classification value. */
function sharedClassificationWeight(classification: string): number {
  return classification === 'normal'
    ? RELATED_PAGES_WEIGHTS.sharedClassificationNormal
    : RELATED_PAGES_WEIGHTS.sharedClassificationDistinctive;
}

/** Calculate related pages for a given route. */
export function calculateRelatedPages(
  inventory: { pages: InventoryPage[] },
  sourceRoute: string,
  limit: number = 5,
): RelatedPageResult[] {
  const sourcePage = inventory.pages.find((p) => p.route === sourceRoute);
  if (!sourcePage) {
    return [];
  }

  const sourceTokens = getPageTokens(sourcePage);
  const sourceOutgoing = new Set(sourcePage.outgoing);
  const sourceIncoming = new Set(sourcePage.incoming);

  const results: RelatedPageResult[] = [];

  for (const page of inventory.pages) {
    if (page.route === sourceRoute) continue;

    const pageTokens = getPageTokens(page);
    let score = 0;
    const reasons: string[] = [];

    // Direct outgoing link
    if (sourceOutgoing.has(page.route)) {
      score += RELATED_PAGES_WEIGHTS.directOutgoing;
      reasons.push('linked directly');
    }

    // Direct incoming link
    if (sourceIncoming.has(page.route)) {
      score += RELATED_PAGES_WEIGHTS.directIncoming;
      reasons.push('linked from this page');
    }

    // Shared incoming neighbors (score capped; reason reports the actual count).
    // Deduplicate so repeated routes in a page's incoming collection do not
    // inflate the score, count, or reasons.
    const sharedIncoming = [...new Set(page.incoming.filter((r) => sourceIncoming.has(r)))];
    if (sharedIncoming.length > 0) {
      const counted = Math.min(
        sharedIncoming.length,
        RELATED_PAGES_WEIGHTS.maxSharedIncomingNeighbors,
      );
      score += counted * RELATED_PAGES_WEIGHTS.sharedIncomingNeighbor;
      if (sharedIncoming.length === 1) {
        reasons.push(`shared incoming neighbor: ${sharedIncoming[0]}`);
      } else {
        reasons.push(`${sharedIncoming.length} shared incoming neighbors`);
      }
    }

    // Shared outgoing neighbors (score capped; reason reports the actual count).
    // Deduplicate so repeated routes in a page's outgoing collection do not
    // inflate the score, count, or reasons.
    const sharedOutgoing = [...new Set(page.outgoing.filter((r) => sourceOutgoing.has(r)))];
    if (sharedOutgoing.length > 0) {
      const counted = Math.min(
        sharedOutgoing.length,
        RELATED_PAGES_WEIGHTS.maxSharedOutgoingNeighbors,
      );
      score += counted * RELATED_PAGES_WEIGHTS.sharedOutgoingNeighbor;
      if (sharedOutgoing.length === 1) {
        reasons.push(`shared outgoing neighbor: ${sharedOutgoing[0]}`);
      } else {
        reasons.push(`${sharedOutgoing.length} shared outgoing neighbors`);
      }
    }

    // Shared classification (broad vs distinctive weight)
    if (page.classification && page.classification === sourcePage.classification) {
      const weight = sharedClassificationWeight(page.classification);
      if (weight > 0) {
        score += weight;
        reasons.push(`shared classification: ${page.classification}`);
      }
    }

    // Shared title tokens
    const sharedTitleTokens = findSharedTokens(sourceTokens.title, pageTokens.title);
    if (sharedTitleTokens.length > 0) {
      score += sharedTitleTokens.length * RELATED_PAGES_WEIGHTS.sharedTitleToken;
      if (sharedTitleTokens.length === 1) {
        reasons.push(`shared title token: ${sharedTitleTokens[0]}`);
      } else {
        reasons.push(`${sharedTitleTokens.length} shared title tokens`);
      }
    }

    // Shared description tokens
    const sharedDescriptionTokens = findSharedTokens(
      sourceTokens.description,
      pageTokens.description,
    );
    if (sharedDescriptionTokens.length > 0) {
      score += sharedDescriptionTokens.length * RELATED_PAGES_WEIGHTS.sharedDescriptionToken;
      if (sharedDescriptionTokens.length === 1) {
        reasons.push(`shared description token: ${sharedDescriptionTokens[0]}`);
      } else {
        reasons.push(`${sharedDescriptionTokens.length} shared description tokens`);
      }
    }

    // Shared heading tokens
    const sharedHeadingTokens = findSharedTokens(sourceTokens.headings, pageTokens.headings);
    if (sharedHeadingTokens.length > 0) {
      score += sharedHeadingTokens.length * RELATED_PAGES_WEIGHTS.sharedHeadingToken;
      if (sharedHeadingTokens.length === 1) {
        reasons.push(`shared heading token: ${sharedHeadingTokens[0]}`);
      } else {
        reasons.push(`${sharedHeadingTokens.length} shared heading tokens`);
      }
    }

    // Shared tag
    if (sourceTokens.tag && pageTokens.tag && sourceTokens.tag === pageTokens.tag) {
      score += RELATED_PAGES_WEIGHTS.sharedTagToken;
      reasons.push(`shared tag: ${sourceTokens.tag}`);
    }

    if (score > 0) {
      results.push({
        route: page.route,
        title: page.title,
        classification: page.classification ?? null,
        score,
        reasons,
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

  return results.slice(0, limit);
}
