# JSON-LD Structured Data

**Use when:** Changing JSON-LD output or its validation report.

## Where schema is defined

- **`src/components/SchemaOrg.astro`** generates every JSON-LD entity. Its `type` prop selects the
  schema types for the page.
- **`src/components/BaseHead.astro`** renders `SchemaOrg` on every page with page metadata, as an
  inline `<script type="application/ld+json">` in `<head>`.
- Entity design follows [ADR 004](decisions/004-connected-schema-org-graph-for-structured-data.md).
  Author data comes from [Author Profile](author_profile.md).

## Report

`pnpm structured-data:report` (alias `pnpm jsonld:report`) builds the site and scans the output.
Reports are written to `data/structured-data/` as `jsonld-report.json` (for tooling) and
`jsonld-report.md` (for people).

The report checks:

- JSON-LD present on every HTML page (a missing block is reported but does not fail);
- **top-level entity types**, meaning each `@graph` entry's `@type`, or the root's;
- **nested types**, found recursively inside properties and counted separately, never twice;
- `@id` values per page; and
- JSON parse errors, which are the only thing that makes it exit non-zero.

Example: in a `BreadcrumbList` whose `itemListElement` holds `ListItem` entries pointing at a
`WebPage`, the top-level type is `BreadcrumbList` and the nested types are `ListItem` and `WebPage`.

## Not yet validated

- Schema.org required vs. optional properties
- Whether referenced `@id` values exist in the graph
- Missing recommended types for a page kind, or types that do not fit the page's purpose
- Cross-page `@id` conventions
