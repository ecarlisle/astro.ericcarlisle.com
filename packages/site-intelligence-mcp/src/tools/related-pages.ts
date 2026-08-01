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

/** Configuration for related pages scoring weights. */
export const RELATED_PAGES_WEIGHTS = {
  /** Direct outgoing link from source to target. */
  directOutgoing: 1000,
  /** Direct incoming link from target to source. */
  directIncoming: 1000,
  /** Shared incoming neighbor (both linked from same page). */
  sharedIncomingNeighbor: 300,
  /** Shared outgoing neighbor (both link to same page). */
  sharedOutgoingNeighbor: 300,
  /** Same classification (e.g., both "normal", both "lab"). */
  sharedClassification: 200,
  /** Shared title token (normalized). */
  sharedTitleToken: 150,
  /** Shared description token (normalized). */
  sharedDescriptionToken: 100,
  /** Shared heading token (from h1Texts). */
  sharedHeadingToken: 100,
  /** Shared tag-route token (e.g., both under /tags/3d-printing/). */
  sharedTagToken: 200,
} as const;

/** Default maximum number of related pages to return. */
export const RELATED_PAGES_LIMIT = 5;

/** Extract tag from route (e.g., /tags/3d-printing/ -> "3d-printing"). */
function extractTag(route: string): string | null {
  const match = route.match(/\/tags\/([^/]+)\//);
  return match?.[1] ?? null;
}

/** Get normalized tokens from a string. */
function getTokens(text: string): string[] {
  return tokenize(text);
}

/** Get all tokens from a page's searchable fields. */
function getPageTokens(page: InventoryPage): {
  title: string[];
  description: string[];
  headings: string[];
  tag: string | null;
  classification: string[];
} {
  return {
    title: getTokens(page.title ?? ''),
    description: getTokens(page.description ?? ''),
    headings: page.h1Texts.flatMap((h) => getTokens(h)),
    tag: extractTag(page.route),
    classification: page.classification ? [page.classification.toLowerCase()] : [],
  };
}

/** Find shared tokens between two token arrays. */
function findSharedTokens(a: string[], b: string[]): string[] {
  const setA = new Set(a);
  return b.filter((t) => setA.has(t));
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

    // Shared incoming neighbors
    const sharedIncoming = page.incoming.filter((r) => sourceIncoming.has(r));
    if (sharedIncoming.length > 0) {
      score += sharedIncoming.length * RELATED_PAGES_WEIGHTS.sharedIncomingNeighbor;
      if (sharedIncoming.length === 1) {
        reasons.push(`shared incoming neighbor: ${sharedIncoming[0]}`);
      } else {
        reasons.push(`${sharedIncoming.length} shared incoming neighbors`);
      }
    }

    // Shared outgoing neighbors
    const sharedOutgoing = page.outgoing.filter((r) => sourceOutgoing.has(r));
    if (sharedOutgoing.length > 0) {
      score += sharedOutgoing.length * RELATED_PAGES_WEIGHTS.sharedOutgoingNeighbor;
      if (sharedOutgoing.length === 1) {
        reasons.push(`shared outgoing neighbor: ${sharedOutgoing[0]}`);
      } else {
        reasons.push(`${sharedOutgoing.length} shared outgoing neighbors`);
      }
    }

    // Shared classification
    if (page.classification && page.classification === sourcePage.classification) {
      score += RELATED_PAGES_WEIGHTS.sharedClassification;
      reasons.push(`shared classification: ${page.classification}`);
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
