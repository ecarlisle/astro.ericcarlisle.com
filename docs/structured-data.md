# JSON-LD Structured Data

This site uses [JSON-LD](https://json-ld.org/) for structured data. All schema
generation happens in a single component.

## Where Schema Is Defined

- **`src/components/SchemaOrg.astro`** — Generates all JSON-LD entities. The
  component accepts a `type` prop that selects which schema types to emit for
  the current page.
- **`src/components/BaseHead.astro`** — Invokes `SchemaOrg` on every page
  (line 124) and passes page-level metadata as props.

The rendered JSON-LD is injected as an inline `<script type="application/ld+json">`
element in the page `<head>`.

## Running the Report

```sh
pnpm structured-data:report
```

Or the shorter alias:

```sh
pnpm jsonld:report
```

Both commands build the site and then scan the output for JSON-LD blocks.

## Report Output

Reports are written to `data/structured-data/`:

| File | Format | Purpose |
|---|---|---|
| `jsonld-report.json` | JSON | Machine-readable report for tooling |
| `jsonld-report.md` | Markdown | Human-readable summary |

## What the Report Checks

- Presence of JSON-LD on every HTML page
- **Top-level entity types** — the `@type` values declared at the top level of
  each JSON-LD `@graph` entry (or root object when there is no `@graph`). These
  are the primary schema types for the page (e.g. `BlogPosting`, `WebPage`,
  `Person`).
- **Nested/supporting schema object types** — `@type` values found recursively
  inside properties of top-level entities (e.g. `ImageObject` inside a
  `BlogPosting`'s `image` property, or `ListItem` inside a `BreadcrumbList`'s
  `itemListElement`). These are collected separately from top-level types and
  are **not** double-counted with the top-level entity coverage.
- `@id` values found per page
- Parse errors (malformed JSON)
- Pages that are missing JSON-LD entirely

### Top-Level vs Nested: An Example

Given this JSON-LD snippet:

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "item": { "@type": "WebPage", ... } },
    { "@type": "ListItem", "position": 2, ... }
  ]
}
```

- **Top-level entity type**: `BreadcrumbList`
- **Nested/supporting types**: `ListItem`, `WebPage`

Both lists are reported separately so you can distinguish which schema types are
the page's primary entities vs supporting objects referenced in property values.

## What It Does Not Yet Validate

- Schema.org property correctness (required vs optional properties)
- `@id` reference consistency (whether referenced `@id` values exist elsewhere
  in the graph)
- Missing recommended types for specific page kinds
- Whether types match the expected page purpose
- Cross-page consistency of `@id` conventions

## CI Possibility

The `pnpm structured-data:report` command exits with a non-zero status only if
JSON-LD parse errors are detected. This makes it suitable for a CI check step.
Pages with no JSON-LD are reported but do not fail the script.

In the future, a CI workflow could:

1. Run `pnpm structured-data:report`
2. Fail the build if parse errors exist
3. Optionally upload the report as a build artifact
