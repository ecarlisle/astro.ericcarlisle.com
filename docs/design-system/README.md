# KISS Design System

**Use when:** Changing tokens, themes, shared styles, components, or reusable visual patterns, or deciding whether a new pattern is justified.

The KISS Design System is the application design system for ericcarlisle.com. It is not a public component library or package. Implementation files define behavior; these docs explain intent and usage.

## Sources of Truth

| Source | Role |
|---|---|
| `src/styles/global.css` | Tokens, typography, spacing, palettes, themes, base element styles |
| `src/styles/components.css` | Shared patterns: buttons, tags, chips, cards, callouts, grids |
| `src/components/`, `src/layouts/BlogPost.astro` | Components and the single site layout |
| [inventory.json](inventory.json) | Machine-readable catalog of every reusable pattern ([how to query it](agent-guide.md)) |
| `src/pages/portfolio/design-system.astro` | Live reference page at `/portfolio/design-system/` |
| [icons.md](icons.md) | Icon selection, vendoring, accessibility, and attribution |
| [figma-agent-brief.md](figma-agent-brief.md) | Figma companion-file generation |
| [Performance, SEO, and accessibility](../performance-seo-accessibility.md) | Quality rules |

## Find an existing pattern

1. Search `inventory.json` by `name`, `kind`, or `purpose`.
2. Read the file in `source`.
3. View the `canonicalExample`, often an anchor such as `/portfolio/design-system/#card`. A value of `null` means the pattern has no demonstration yet.
4. Grep for the component import or CSS class to find real usage.
5. Respect `accessibilityNotes`, `whenToUse`, and `whenNotToUse`.

## Create a new pattern only when

- the same structure repeats in three or more places;
- it carries shared semantic meaning or consistent accessibility requirements;
- the consistency benefit outweighs the abstraction cost; and
- it will be maintained as a single source.

With one or two uses, keep the code inline.

## Themes

Dark is the default. Light applies through `[data-theme="light"]` or `prefers-color-scheme`.

- Use semantic tokens (`--color-link`, `--color-action`, `--bg-surface`), not raw palette values.
- Every color pair meets WCAG AA in both themes.
- Focus, hover, and interactive feedback are visible in both themes.

Accessibility conventions (skip link, dashed focus outlines, 44px targets, reduced motion, heading permalinks) are defined in [Accessibility Rules](../performance-seo-accessibility.md#accessibility-rules).

## Maintenance map

| Change | Review or update |
|---|---|
| Token added or renamed | Token source, inventory, and the matching Reference section of the [Figma brief](figma-agent-brief.md) |
| Component or page layout changed | The Components or Page Templates section of the [Figma brief](figma-agent-brief.md) |
| Component or shared CSS pattern added or changed | Source, inventory, canonical example or reference page |
| Usage guidance changes | This file, inventory, [agent guide](agent-guide.md) |
| Theme behavior changes | Tokens, examples, contrast validation |
| Accessibility behavior changes | Implementation, inventory notes, quality docs |
| Pattern retired | Inventory status, examples, migration guidance |
