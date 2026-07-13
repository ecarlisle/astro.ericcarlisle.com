# Connected Schema.org graph for structured data

- Status: Accepted
- Date: 2026-07-12 (documenting existing decision)

## Context

The site needs structured data for search engines and AI agents to understand page types, content relationships, and authorship. Different page types (homepage, article, about, contact, portfolio, search) have different schema requirements.

## Decision

Implement structured data as a connected Schema.org graph using JSON-LD rather than:

- Per-page isolated schema objects.
- Microdata or RDFa annotations.
- No structured data.

The implementation:
- Uses a single component (`SchemaOrg.astro`) that generates all structured data.
- Connects entities via `@id` references (Person, WebSite, Blog, WebPage, etc.).
- Supports multiple page types via a `pageType` prop.
- Is included on every page via `BaseHead.astro`.

## Reasons

- Connected `@id` references allow search engines to understand entity relationships.
- JSON-LD is the recommended format by Google for structured data.
- A single component centralizes schema logic and reduces duplication.
- The graph structure supports future enrichment without restructuring existing data.

## Tradeoffs

- The graph is generated at build time; dynamic schema updates require rebuilds.
- Complex graph structures may be harder to debug than simple isolated schemas.
- Some schema properties may be underutilized if search engines don't consume them.

## Consequences

- Every page has structured data appropriate to its type.
- Author, site, and content relationships are machine-readable.
- Rich search results (FAQ, breadcrumbs, articles) are supported.
- The schema can be validated via `pnpm structured-data:report`.

## Related files and documentation

- `src/components/SchemaOrg.astro` — Schema generation component
- `src/components/BaseHead.astro` — Includes SchemaOrg on every page
- `docs/structured-data.md` — Structured data documentation
- `docs/architecture.md` — Architecture overview
