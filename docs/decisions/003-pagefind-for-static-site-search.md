# Pagefind for static site search

- Status: Accepted
- Date: 2026-07-12 (documenting existing decision)

## Context

The site needs client-side search functionality to let visitors find blog articles by title, content, and tags. The search index must work without a server and must be generated at build time.

## Decision

Use Pagefind (`astro-pagefind`) for static site search rather than:

- Algolia DocSearch or similar hosted search services.
- A custom search implementation using lunr.js or similar.
- Server-side search via an API.

Pagefind:
- Generates a search index at build time from the static HTML output.
- Provides a client-side search UI injected at `/search`.
- Supports full-text search, filters, and result ranking.
- Restyles its UI via `src/styles/pagefind.css` using project tokens.

## Reasons

- Zero runtime infrastructure; the index is served as static files.
- No external service dependency or API key required.
- Built-in support for pagination, filtering, and ranking.
- Small client-side footprint; the search script loads on demand.
- Integrates naturally with Astro's static output.

## Tradeoffs

- The search UI is third-party markup; internal structure cannot be customized.
- Search index regeneration requires a full build.
- No real-time indexing of new content without redeployment.

## Consequences

- Search works offline and without network connectivity after initial load.
- The search UI must be restyled via CSS overrides rather than component customization.
- New content is searchable only after the next build and deploy.
- The search page uses client-side JavaScript for query execution and result rendering.

## Related files and documentation

- `src/pages/search.astro` — Search page
- `src/styles/pagefind.css` — Search UI restyling
- `astro.config.mjs` — Pagefind integration configuration
- `docs/architecture.md` — Integration overview
