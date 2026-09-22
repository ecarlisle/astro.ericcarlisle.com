# Figma Brief: KISS Design System

**Use when:** Generating or updating the Figma companion file for the KISS Design System.

Figma file: [KISS Design System](https://www.figma.com/design/fWzDrhAPBnnpGRVyKSMp1Q/KISS-Design-System?node-id=0-1&t=oeon7nje8gUrMHyP-1)

The Astro implementation (`src/styles/`, `src/components/`, `src/layouts/`, `src/pages/`) is the
source of truth. Figma mirrors it and never redesigns it. To run a generation, paste this brief and
the reference files into the Figma agent. There is one reference file per Figma page:

| Figma page | Reference |
|---|---|
| `02 Typography` | [Typography](figma-reference-typography.md) |
| `03 Spacing & Layout` | [Spacing and layout](figma-reference-layout.md) |
| `04 Colors` | [Colors](figma-reference-colors.md) |
| `05 Components` | [Components](figma-reference-components.md) |
| `06 Page Templates` | [Page templates](figma-reference-templates.md) |

## Principles

1. **Performance first:** static output, minimal JavaScript.
2. **Semantic HTML:** native elements, correct heading order, one `h1` per page.
3. **Accessibility:** skip link, dashed focus outlines, 44px minimum targets, reduced motion.
4. **Fluid responsive design:** `clamp()` type and spacing, mobile-first breakpoints.
5. **Content first:** a `68ch` prose measure, generous whitespace, clear hierarchy.

The intended feel is fast, thoughtful, human, technical, accessible, and professional without
being sterile.

## Figma pages

| Page | Contents |
|---|---|
| `00 Cover` | Title, site name, last-updated date, link to this brief |
| `01 Foundations` | Principles, token overview, breakpoints, motion rules |
| `02 Typography` | Families, type scale, text styles, line heights |
| `03 Spacing & Layout` | Rhythm, spacing tokens, layout rails, grid |
| `04 Colors` | Dark and light palettes, semantic roles |
| `05 Components` | Every component in the components reference |
| `06 Page Templates` | Homepage, blog index, article, portfolio, contact, search, 404 |
| `07 Implementation Notes` | Source files, naming, decisions, known gaps |

## Prompt

```
Create a Figma design-system file for the KISS Design System (the Astro implementation at
ericcarlisle.com) using this brief and the reference files.

Rules:
1. The Astro implementation is the source of truth. Do not redesign colors, type, or spacing.
2. Create exactly the pages in "Figma pages".
3. Build a "Colors" variable collection with Dark and Light modes from the Colors reference.
4. Build number variables for the spacing tokens in the Spacing and Layout reference (desktop
   values; note mobile references).
5. Create Desktop and Mobile text styles from the type scale, plus font-weight variables
   (normal, medium, bold, black) and letter-spacing variables (tight, label, wide).
6. Build every component in the Components reference as a Figma component using its Figma name.
7. Build the Page Templates reference as frames.
8. Map rem to px at a 16px base; show both mobile and desktop sizes for clamp() values.
9. Include focus, hover, and mobile variants where noted.
10. On "07 Implementation Notes", list source files, clamp() tokens, and the known gaps below.

Known gaps and intentional exceptions:
- --header-height is set by JavaScript (4.5rem fallback) from the header's measured height.
- The Pagefind search UI is third-party markup restyled by src/styles/pagefind.css. Do not rebuild
  its internals.
- The portfolio case-study grid uses page-local sizing (1.6fr / 0.8fr), not a shared token.
- The homepage hero role uses an intentional one-off letter-spacing of 0.02em.
```
