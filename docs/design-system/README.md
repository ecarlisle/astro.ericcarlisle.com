# KISS Design System

The KISS Design System is the application design system for ericcarlisle.com. It supports visual and behavioral consistency across the blog, portfolio, and supporting pages. It is not a public component library or npm package.

The design system includes tokens, shared styles, Astro components, layouts, patterns, accessibility conventions, and reference examples.

## Sources of Truth

| Source | Role |
|--------|------|
| `src/styles/global.css` | Tokens, typography, spacing, color palettes, theme definitions, base element styles |
| `src/styles/components.css` | Shared component patterns: buttons, tags, chips, cards, callouts, grids |
| `src/components/` | Astro components that compose the UI |
| `src/layouts/BlogPost.astro` | Single site layout used by every page |
| `inventory.json` | Machine-readable catalog of all reusable patterns |
| `icons.md` | Cross-tool workflow for selecting, vendoring, implementing, and validating UI icons |
| `src/pages/portfolio/design-system.astro` | Visual reference page with live component examples |
| `agent-guide.md` | Agent-specific guide for pattern discovery and implementation |
| `figma-agent-brief.md` | Brief for generating a Figma companion file |
| `docs/performance-seo-accessibility.md` | Quality standards: performance, accessibility, SEO conventions |

**Implementation files** (`src/styles/`, `src/components/`, `src/layouts/`) define actual behavior. Documentation files explain intent, context, and usage guidance.

## How to Find an Existing Pattern

1. **Search the inventory** — Open `inventory.json` and search by `name`, `kind`, or keyword in `purpose`.
2. **Inspect the implementation source** — Read the file listed in `source` to see the real implementation.
3. **Review the canonical example** — Visit the path in `canonicalExample` to see the pattern in a live context. Many examples use anchors (e.g., `/portfolio/design-system/#card`) to point to specific component demonstrations. Patterns with `canonicalExample: null` lack a dedicated demonstration and may be metadata-only, domain-specific, or not yet demonstrated.
4. **Check production usage** — Grep the codebase for the component import or CSS class to see where it is actually used.
5. **Review accessibility and usage guidance** — Read `accessibilityNotes`, `whenToUse`, and `whenNotToUse` in the inventory entry.

## When to Create a New Pattern

A new reusable pattern is generally justified when:

- The same visual or behavioral structure is repeated in three or more places.
- The pattern carries shared semantic meaning (e.g., all content cards share interaction expectations).
- Accessibility requirements apply consistently across usages.
- Meaningful consistency benefits outweigh the abstraction cost.
- The pattern will be maintained as a single source rather than diverging copies.

Avoid premature abstraction. If a pattern appears in only one or two places, inline implementation is usually simpler and easier to change.

## Updating the KISS Design System

When changing a design-system element, review the related materials together:

| Change | Review |
|--------|--------|
| Token added or renamed | Token source, inventory, Figma brief |
| Reusable component added or modified | Component source, inventory, canonical example |
| Shared CSS pattern added or modified | Style source, inventory, reference page |
| Pattern usage guidance changes | This guide, inventory, agent guide |
| Theme behavior changes | Token source, examples, accessibility validation |
| Accessibility behavior changes | Implementation, inventory notes, quality docs |
| Pattern retired or deprecated | Inventory status, examples, migration guidance |

## Themes and Accessibility

This site supports dark and light themes via CSS custom properties. The default is dark; light is applied via `[data-theme="light"]` or the user's `prefers-color-scheme` system preference.

**Theme expectations:**
- Use semantic tokens (`--color-link`, `--color-action`, `--bg-surface`) rather than raw palette values.
- All color combinations must meet WCAG AA contrast ratios in both themes.
- Focus outlines, hover states, and interactive feedback must be visible in both themes.

**Accessibility conventions:**
- Skip link on every page for keyboard navigation.
- Visible focus outlines (dashed, brand-primary color) on all interactive elements.
- Minimum 44px touch targets for buttons and icon links.
- Reduced-motion support: transitions and animations respect `prefers-reduced-motion: reduce`.
- Semantic HTML: native elements before ARIA, correct heading hierarchy, one `h1` per page.
- Heading permalinks: content-section titles that deserve a stable deep link get a sibling chain-link anchor with a visible focus ring, an accessible label, an `aria-hidden` icon, and a reduced-motion-safe `:target` highlight (see the [Heading Permalink pattern](inventory.json) and live use at [`/portfolio/#kiss-design-system`](/portfolio/#kiss-design-system)).

For detailed quality standards, see `docs/performance-seo-accessibility.md`.

## KISS Design System Maintenance Map

| Change | Review or update |
|--------|-----------------|
| Token added or renamed | Token source, inventory, Figma brief |
| Reusable component added | Component source, inventory, canonical example |
| Shared CSS pattern added | Style source, inventory, reference page |
| Pattern usage changes | Human guide, inventory, agent guide |
| Theme behavior changes | Tokens, examples, accessibility validation |
| Accessibility behavior changes | Implementation, inventory notes, quality docs |
| Pattern retired | Inventory status, examples, migration guidance |

## Related References

- [inventory.json](inventory.json) — Machine-readable pattern catalog
- [Icon workflow](icons.md) — Cross-tool selection, local SVG, accessibility, and attribution guidance
- [Visual reference page](/portfolio/design-system/) — Live component demos
- [Agent guide](agent-guide.md) — Pattern discovery for coding agents
- [Figma brief](figma-agent-brief.md) — Brief for Figma companion generation
- [Token source](../../src/styles/global.css) — CSS custom properties and theme definitions
- [Shared component styles](../../src/styles/components.css) — Buttons, tags, cards, grids
- [Performance, SEO, accessibility](../performance-seo-accessibility.md) — Quality standards
