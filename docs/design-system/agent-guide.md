# Agent Guide: Design System Inventory

This directory contains a machine-readable inventory of the reusable design patterns
implemented across `ericcarlisle.com`.

For human-facing design-system documentation, see [README.md](README.md).

## Files

| File | Purpose |
|------|---------|
| `README.md` | Human-facing design-system documentation (entry point for developers and maintainers). |
| `inventory.json` | Structured JSON inventory of every reusable component, layout, content pattern, form pattern, typography pattern, and metadata pattern. |
| `figma-agent-brief.md` | Detailed brief for generating a Figma companion file that mirrors the Astro implementation. |

## How agents should use inventory.json

### 1. Pattern lookup before implementation

Before creating a new UI element, query `inventory.json` to see if a pattern already exists.
Use the `name` and `kind` fields to identify matches, then read the `source` file for
the implementation.

```json
{
  "name": "Button",
  "kind": "content pattern",
  "source": "src/styles/components.css"
}
```

### 2. Understand the context

The `purpose`, `whenToUse`, and `whenNotToUse` fields describe the intended scope of each
pattern. Respect these boundaries. For example: Tag / Chip are metadata labels, not navigation.

### 3. Follow the source of truth

The `source` field points to the exact file where the pattern is implemented.
The `styleSources` field lists all CSS files that contribute styles to the pattern.
Always read these files before modifying or extending a pattern.

### 4. Accessibility requirements

The `accessibilityNotes` field documents known accessibility considerations for each
pattern. Preserve these when modifying patterns and replicate them when using patterns
in new contexts.

### 5. Pattern relationships

The `relatedPatterns` array lists other patterns that commonly compose with this one.
Use it to discover related patterns rather than duplicating functionality.

### 6. Status conventions

| Status | Meaning |
|--------|---------|
| `stable` | Production-ready, actively used, breaking changes require migration. |
| `deprecated` | Being phased out. Do not use in new contexts. |
| `experimental` | May change. Use with caution. |

### 7. Notable exclusions

The inventory intentionally excludes:

- **GraphifyPlugin, OpenCode/Pi plugins** — These are agent-infrastructure tools, not
  design-system patterns.
- **Astro-generated types** — `CollectionEntry`, `CollectionKey`, etc., are generated
  by Astro's content layer, not designed patterns.
- **Content collection helpers** — `getCollection`, `getEntry`, etc., are data-access
  utilities, not UI patterns.
- **Author metadata constants** — `AUTHOR_NAME`, `AUTHOR_GITHUB`, etc., are configuration
  values, not reusable patterns.
- **Analytics constants** — `GA_MEASUREMENT_ID`, `WEBMENTION_IO_TOKEN`, etc., are
  deployment configuration.
- **Generic utility functions** — `computeTagData`, `getPostWordCount`, etc., are
  internal helpers with no UI surface.
- **Third-party overlays** — The Pagefind search UI and Turnstile widget are external
  libraries restyled with project tokens but not owned by this system.

### 8. Canonical examples

Patterns with `"canonicalExample": null` lack a dedicated demonstration on the
design-system reference page. When implementing or significantly changing one of
these patterns, consider adding an example to `/portfolio/design-system/`.

Many canonical examples use anchors (e.g., `/portfolio/design-system/#card`) to point to specific component demonstrations. These anchors correspond to explicit `id` attributes on component demo headings in the design-system page.

## Quick reference table

| Kind | Count | Patterns |
|------|-------|----------|
| component | 10 | HeaderLink, Card, PostGrid, SocialLinks, ThemeToggle, ShareStrip, TagFilterBar, PaginationNav, FormattedDate, Webmentions, ModelResourceLinks |
| layout | 1 | BlogPost |
| navigation pattern | 2 | Header, Footer |
| content pattern | 7 | Button, Tag / Chip, Callout, TOC Sidebar, Stats Grid, Reading Progress Bar, Skip Link, Card Grid |
| form pattern | 1 | Contact Form |
| typography pattern | 3 | Prose, Code Block, Blockquote |
| metadata pattern | 2 | BaseHead, SchemaOrg |

> Note: Counts are approximate; some patterns span multiple categories.
> Always read `inventory.json` for the authoritative list.
