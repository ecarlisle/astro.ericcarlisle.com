# Figma Brief: KISS Design System

**Use when:** Generating or updating the Figma companion file for the KISS Design System.

Figma file: [KISS Design System](https://www.figma.com/design/fWzDrhAPBnnpGRVyKSMp1Q/KISS-Design-System?node-id=0-1&t=oeon7nje8gUrMHyP-1)

To run a generation, paste this whole file into the Figma agent. It is a paste-in payload, so it is
exempt from the 600-word limit (see [Writing Documentation](../documentation.md#length)).

The Astro implementation (`src/styles/`, `src/components/`, `src/layouts/`, `src/pages/`) is the
source of truth. Figma mirrors it and never redesigns it. Reference values are copied from
`src/styles/global.css` and the components, which win any conflict. When a token or component
changes, update the matching Reference section.

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
| `05 Components` | Every component in the Components reference section |
| `06 Page Templates` | Homepage, blog index, article, portfolio, contact, search, 404 |
| `07 Implementation Notes` | Source files, naming, decisions, known gaps |

## Prompt

```
Create a Figma design-system file for the KISS Design System (the Astro implementation at
ericcarlisle.com) using this brief.

Rules:
1. The Astro implementation is the source of truth. Do not redesign colors, type, or spacing.
2. Create exactly the pages in "Figma pages".
3. Build a "Colors" variable collection with Dark and Light modes from the Colors reference section.
4. Build number variables for the spacing tokens in the Spacing and Layout reference section (desktop
   values; note mobile references).
5. Create Desktop and Mobile text styles from the type scale, plus font-weight variables
   (normal, medium, bold, black) and letter-spacing variables (tight, label, wide).
6. Build every component in the Components reference section as a Figma component using its Figma name.
7. Build the Page Templates reference section as frames.
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

## Reference: Typography

Reference px values assume a 16px base.

### Families and weights

| Token | Value | Figma font |
|---|---|---|
| `--font-copy` | `"Source Sans 3 Variable", system-ui, sans-serif` | Source Sans 3 |
| `--font-headers` | `"Plus Jakarta Sans Variable", system-ui, sans-serif` | Plus Jakarta Sans |
| `--font-mono` | `"Fira Code Variable", ui-monospace, monospace` | Fira Code |

Weights: `--font-weight-normal` 400 (body), `-medium` 600 (tag names, result labels), `-bold` 700
(headings, buttons, active nav, stats), `-black` 900 (site title).

Letter spacing: `--letter-spacing-tight` −0.03em (site title), `-label` 0.05em (uppercase labels),
`-wide` 0.08em (404 label).

| Token | Clamp | Mobile / desktop | Line height |
|---|---|---|---|
| `--type-size-small` | `clamp(0.8125rem, calc(0.2vw + 0.77rem), 0.9375rem)` | 13 / 15 | body |
| `--type-size-body` (= `-base`) | `clamp(1rem, calc(0.3vw + 0.94rem), 1.125rem)` | 16 / 18 | 1.65 |
| `--type-size-large` | `clamp(1.125rem, calc(0.35vw + 1.05rem), 1.375rem)` | 18 / 22 | — |
| `--type-size-h5` | `clamp(1rem, calc(0.28vw + 0.94rem), 1.1875rem)` | 16 / 19 | 1.6 |
| `--type-size-h4` | `clamp(1.125rem, calc(0.57vw + 1.07rem), 1.5rem)` | 18 / 24 | 1.55 |
| `--type-size-h3` | `clamp(1.375rem, calc(1.14vw + 1.15rem), 2rem)` | 22 / 32 | 1.45 |
| `--type-size-h2` | `clamp(1.625rem, calc(2.13vw + 1.2rem), 2.8rem)` | 26 / 45 | 1.35 |
| `--type-size-h1` | `clamp(2rem, calc(3.64vw + 1.27rem), 4rem)` | 32 / 64 | 1.3 |
| `--type-size-card-title` | `clamp(1.375rem, calc(0.7vw + 1.2rem), 2rem)` | 22 / 32 | 1.2 |
| `--type-size-featured-card-title` | `clamp(1.75rem, calc(1.25vw + 1.45rem), 2.75rem)` | 28 / 44 | 1.2 |
| `--type-size-blockquote` | `1.1em` | relative | body |

Headings use Plus Jakarta Sans 700, `text-primary`, margin 0; `h1`–`h3` use `text-wrap: balance`.

**Text styles** (as `Desktop / …` and `Mobile / …`): Body, Body Small, Body Large, H1–H5, Card
Title, Featured Card Title, Mono / Meta, Mono / Small, Tag / Chip, Button, and Eyebrow (uppercase,
label spacing, small size).

**Prose:** `.prose p` and `li` max `68ch`. Inline `code` is mono 0.95em on `--bg-surface` with
`--radius-sm`. `pre` has `--space-component` padding, `--bg-surface`, and `--border-main`.
Uppercase labels are small, uppercase, label-spaced, and `--text-muted`.

**Heading permalink states** (for H2 and H3; no new tokens):

- **Default:** muted chain icon (about 0.6 opacity) in `--color-link`.
- **Hover:** full opacity in `--color-link-hover` on a `--bg-surface` chip.
- **Focus:** the hover state plus a dashed `--color-focus` outline with a 3px offset.
- **Targeted:** an accent highlight; a static inset bar under reduced motion.
- **Wrapped:** the icon stays bound to the final word.
- **Themes:** render in both dark and light.

## Reference: Spacing and Layout

### Spacing

`--rhythm`: `clamp(1.65rem, calc(0.75vw + 1.5rem), 2.0625rem)` (26.4 / 33px).

| Token | Rhythm × | Mobile / desktop px | Alias |
|---|---|---|---|
| `--space-xs` | 0.5 | 13.2 / 16.5 | `--space-inline` |
| `--space-sm` | 0.75 | 19.8 / 24.75 | `--space-inline-strong` |
| `--space-md` | 1 | 26.4 / 33 | `--space-component` |
| `--space-lg` | 1.5 | 39.6 / 49.5 | `--space-component-lg` |
| `--space-xl` | 2 | 52.8 / 66 | Section gaps |
| `--space-section` | 2.5 | 66 / 82.5 | Major separators |
| `--space-layout` | 3 | 79.2 / 99 | Page top and bottom |

Name the Figma number variables after the tokens, using desktop values. A mobile mode is optional.

### Layout

Rails: `--layout-rail-prose` `68ch` (~680px), `--layout-rail-page` `72rem` (1152px),
`--layout-rail-wide` `80rem` (1280px, rarely used).

- **Main:** max width is the page rail, centered, padded `--space-layout` / `--space-component`.
  At ≤720px, padding is `--space-component`.
- **Header:** fixed, `--bg-surface`, `1px` bottom border in `--border-muted`, min height 4.5rem
  (4rem on mobile). It hides on scroll down and reveals on scroll up. Mobile uses a hamburger menu
  with a two-column dropdown.
- **Footer:** centered, `--text-secondary`. Social links sit below with a `--space-inline` gap
  and a `--space-component` top margin.
- **Site frame:** `.site-frame` wraps the header and footer with `--space-component` padding.
- **Grid:** `.grid--cards` is `repeat(auto-fit, minmax(280px, 1fr))` with a `--space-component`
  gap. `.grid--featured-first` makes the first card full width. At ≤720px, both collapse to a
  single column.

| Breakpoint | Width | Effect |
|---|---|---|
| Mobile | 720px | Reduced padding; single-column cards |
| Homepage stack | 800px | Hero becomes single column |
| Header collapse | 840px | Hamburger menu |
| Social hide | 1024px | Header social links hidden |

## Reference: Colors

### Palettes

| Token | Dark (default) | Light | Usage |
|---|---|---|---|
| `--bg-main` | `#0b1020` | `#f8fafc` | Page background |
| `--bg-surface` | `#111a2e` | `#ffffff` | Cards, header, code |
| `--bg-surface-elevated` | `#18243a` | `#e8eef7` | Elevated and hover surfaces |
| `--text-primary` | `#f8fafc` | `#0f172a` | Headings, primary text |
| `--text-secondary` | `#cbd5e1` | `#334155` | Body text |
| `--text-muted` | `#94a3b8` | `#475569` | Meta, captions, labels |
| `--brand-primary` | `#5ea8ff` | `#005fcc` | Links, actions, focus |
| `--brand-accent` | `#38d9a9` | `#007a5a` | Link hover, success |
| `--brand-highlight` | `#ffb86b` | `#a14b00` | Highlights |
| `--color-danger` | `#ff8a8a` | `#b42318` | Errors, destructive states |
| `--color-warning` | `#f5d35c` | `#7a5b00` | Warnings |
| `--border-main` | `#26344d` | `#cbd5e1` | Card borders, dividers |
| `--border-muted` | `#1a2638` | `#e2e8f0` | Header border |
| `--border-control` | `#61728b` | `#64748b` | Form inputs (3:1 or better on all surfaces) |

### Semantic roles

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--color-link` | `--brand-primary` | same | Links |
| `--color-link-hover` | `--brand-accent` | same | Hovered links |
| `--color-action` | `--brand-primary` | same | Buttons, CTAs |
| `--color-action-hover` | `#3d8ee0` | `#004799` | Button hover |
| `--color-action-active` | `#3787d8` | `#003a7d` | Button pressed |
| `--color-on-action` | `--bg-surface` | same | Content on action color |
| `--color-focus` | `--color-link` | same | Focus outlines |
| `--color-success` | `--brand-accent` | same | Success |

Text and card surfaces have no semantic alias. Use the `--text-*`, `--bg-surface*`, and
`--border-main` tokens directly.

### Z-index

| Token | Value | Usage |
|---|---|---|
| `--z-decoration` | −1 | Decorative backdrops in an isolated stacking context |
| `--z-raised` | 1 | Content above a local backdrop or overlay (card link, tags, facades) |
| `--z-control` | 2 | Controls above a raised overlay |
| `--z-header` | 100 | Fixed header |
| `--z-header-accent` | 101 | Reading-progress bar |
| `--z-skip-link` | 9999 | Focused skip link |

### Figma variables

Create a `Colors` collection with `Dark` and `Light` modes:

`bg/main` · `bg/surface` · `bg/surface-elevated` · `text/primary` · `text/secondary` ·
`text/muted` · `brand/primary` · `brand/accent` · `brand/highlight` · `border/main` ·
`border/muted` · `border/control` · `action/default` · `action/hover` · `action/active` ·
`link/default` · `link/hover` · `focus` · `success` · `danger` · `warning`

## Reference: Components

Sources, purposes, and accessibility notes live in [inventory.json](inventory.json); this section
holds only Figma names, tokens, and states.

| Figma name | Visual spec | States and variants |
|---|---|---|
| `Header / Desktop`, `/ Mobile Open`, `/ Mobile Closed` | Site title: Plus Jakarta Sans 900, `clamp(1.25rem, 0.55vw + 1.1rem, 1.65rem)`, tight spacing. Nav min height 4.5rem / 4rem. | Social links hidden ≤1024px; hamburger ≤840px; hidden on scroll down; active link underlined in `--color-link` |
| `Footer` | Centered, `--text-secondary` | — |
| `Nav Link`, `Nav Link / Active` | `--font-copy`, `--text-primary`, 2px transparent bottom border | Hover: `--color-action` border. Active: `--color-link` border, weight 700 |
| `Card / Default`, `/ With Image`, `/ Featured` | `--space-component` padding, `--bg-surface`, 1px `--border-main`, `--radius-lg`. Title `--type-size-card-title` at 1.2 line height; meta small and muted. Children stack with a `--space-inline-strong` gap. | Hover: `--shadow-lg`, `--color-action` border, lift 4px. Image: 2:1, top radius, bleeds to the padding edge. Featured: featured title size. |
| `Post Grid` | `ul.grid.grid--cards` | — |
| `Button / Primary`, `/ Outline` | Inline flex, min height `--size-touch-target-min`, padding `--space-inline` / `--space-component`, `--radius-md`, `--color-action` background, `--color-on-action` text, body size | Hover: `--color-action-hover`, `--shadow-md`, lift 1px. Outline: transparent background with `--color-action` border and text |
| `Tag`, `Chip` | Pill (`--radius-full`), `0.2em 0.6em` padding, `--bg-surface-elevated`, `--text-secondary`, mono small | Tag hover: `--color-action-hover` background, `--bg-main` text. Chip is static. |
| `Callout` | `--space-component` padding, 4px left border in `--color-link`, `--radius-md`, `--bg-surface`, `--text-secondary` | — |
| `Back Link` | Small, `--text-muted` | — |
| `Reading Progress Bar` | Fixed top, 3px tall, `--color-link`, width 0–100% | — |
| `Skip Link` | Visible only on keyboard focus | — |
| `Social Links` | 44×44px targets, `--radius-md`, `--text-secondary` | Hover: `--color-link` |
| `Theme Toggle / Dark`, `/ Light` | 44×44px, transparent, `--radius-md`; 20px sun and moon icons | Sun shows in dark, moon in light |
| `Share Strip` | Vertical flex, `--space-inline` gap. "Share" label is uppercase, small, and muted. 44px icons in `--text-secondary`. | Hover: `--color-link-hover` |
| `Tag Filter Bar` | Centered wrapping flex, `--space-sm` gap. Pills with `0.3em 0.7em` padding, small, muted. | Hover: `--bg-surface`, `--color-link` |
| `Pagination Nav` | Two-column grid, `--space-component` gap, top border `--border-main`. Small muted label; title in headers font at 700. | Hover: `--bg-surface`, `--color-link` |
| `Table of Contents` | Sticky below the header. Uppercase small muted heading. Links have a transparent left border and `--space-inline` padding. | Hover and active: `--color-action` text and border |
| `Webmentions / Reactions`, `/ Reply` | `--space-section` top margin and border. 32px circular avatars. Reply cards: `--space-component` padding, `--bg-surface`, `--border-muted`, `--radius-md`. | — |
| `Stats Grid`, `Stat Card` | Four columns within the prose rail. Stat card: `--bg-surface`, `--border-muted`, `--radius-md`, centered. Value in h3 size, mono, `--color-action`; label small, `--text-secondary`. | Two columns ≤720px |
| `Contact Form`, `Contact Success Card` | Prose rail, column gap `--space-component`. Inputs: `--space-inline` / `--space-sm` padding, `--bg-surface`, 1px `--border-control`, `--radius-sm`. | Focus: `--color-action` border plus a 1px ring. Success card: 4px left border in `--color-success` |
| `Search / Input`, `/ Result Card` | Pagefind UI (`src/pages/search.astro`, `src/styles/pagefind.css`). Input: min 44px, `--radius-md`, `--border-control`. Results styled as cards. | — |
| `404 Page` | Mono "404" at `clamp(4rem, 12vw, 8rem)` in `--color-action` (`src/pages/404.astro`) | — |

## Reference: Page Templates

| Template | Layout |
|---|---|
| Homepage | Hero: two-column grid (`1fr auto`) with a `--space-section` gap. Avatar is 280 / 200 / 140px (desktop / tablet / mobile). "Latest writing" uses `grid--cards grid--featured-first`. |
| Blog index | Collection header, Tag Filter Bar, Post Grid, and optional Pagination Nav |
| Article | Header and 2:1 hero at max 1020px. Content and sidebar columns, with the Share Strip above a sticky TOC. Pagination and webmentions below. Reading progress bar. |
| Portfolio | Case-study cards in a `1.6fr 0.8fr` grid, repo list with a GitHub icon, and tag clusters |
| Contact | Centered `68ch` prose, stacked form, and success-card state |
| Search | Search input with card results |
| 404 | Centered vertical flex, min height `60vh` |
