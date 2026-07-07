# Figma Design-System Companion Brief

> Paste this brief into a Figma agent to generate a companion design-system file for the Astro implementation of ericcarlisle.com.
> The Astro implementation is the source of truth. Do not redesign — mirror what is implemented.

---

## 1. Project Overview

- **Site:** Eric Carlisle personal site (Astro 7 static site)
- **Source of truth:** The Astro implementation in `src/styles/`, `src/components/`, `src/layouts/`, and `src/pages/`.
- **Goal for Figma:** Create a companion design-system file that documents the implemented tokens, typography, spacing, colors, components, and page templates so designers can reference and extend the system without drifting from the code.
- **Design feel:** Fast, thoughtful, human, technical, accessible, professional without being sterile.

---

## 2. Design Principles

1. **Performance first** — static output, minimal JavaScript, no global bundles for page-specific features.
2. **Minimal JavaScript** — prefer Astro, HTML, and CSS before adding client-side behavior.
3. **Semantic HTML** — native elements over ARIA, correct heading order, one `h1` per page.
4. **Accessibility** — skip link, visible focus outlines (`dashed`), 44 px minimum touch targets, reduced-motion support.
5. **Fluid responsive design** — `clamp()` tokens for type and spacing, mobile-first breakpoints.
6. **Content-first layout** — readable prose measure (`68ch`), generous whitespace, clear visual hierarchy.

---

## 3. Figma Pages to Create

Create these pages in order:

| Page | Purpose |
|------|---------|
| `00 Cover` | Title, site name, last-updated date, link to this brief. |
| `01 Foundations` | Principles, tokens overview, breakpoints, motion rules. |
| `02 Typography` | Font families, type scale, text styles, line heights. |
| `03 Spacing & Layout` | Rhythm scale, spacing tokens, layout rails, grid rules. |
| `04 Colors` | Dark and light palettes, semantic color roles, usage notes. |
| `05 Components` | Documented components (see section 8). |
| `06 Page Templates` | Homepage, blog index, article, portfolio, contact, search, 404. |
| `07 Implementation Notes` | Source files, naming conventions, decisions, known gaps. |

---

## 4. Typography

### Font families

| Token | Value | Figma font |
|-------|-------|------------|
| `--font-copy` | `"Inter Variable", system-ui, sans-serif` | Inter |
| `--font-headers` | `"Plus Jakarta Sans Variable", system-ui, sans-serif` | Plus Jakarta Sans |
| `--font-mono` | `"Fira Code Variable", ui-monospace, monospace` | Fira Code |

### Font-weight tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | `400` | Body text, default copy |
| `--font-weight-medium` | `600` | Tag-card names, result labels, reply author |
| `--font-weight-bold` | `700` | Headings, buttons, active nav, stat values |
| `--font-weight-black` | `900` | Site title |

### Letter-spacing tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--letter-spacing-tight` | `-0.03em` | Site title |
| `--letter-spacing-label` | `0.05em` | Uppercase labels (TOC, share, webmentions, repo links) |
| `--letter-spacing-wide` | `0.08em` | 404 label |

### Type scale (all use `clamp()`)

| Token | Clamp value | Mobile ref | Desktop ref | Line-height token |
|-------|-------------|------------|-------------|-------------------|
| `--type-size-small` | `clamp(0.8125rem, calc(0.2vw + 0.77rem), 0.9375rem)` | 13 px | 15 px | body |
| `--type-size-body` | `clamp(1rem, calc(0.3vw + 0.94rem), 1.125rem)` | 16 px | 18 px | `--line-height-body: 1.65` |
| `--type-size-base` | `var(--type-size-body)` | — | — | — |
| `--type-size-large` | `clamp(1.125rem, calc(0.35vw + 1.05rem), 1.375rem)` | 18 px | 22 px | — |
| `--type-size-h5` | `clamp(1rem, calc(0.28vw + 0.94rem), 1.1875rem)` | 16 px | 19 px | `--line-height-h5: 1.6` |
| `--type-size-h4` | `clamp(1.125rem, calc(0.57vw + 1.07rem), 1.5rem)` | 18 px | 24 px | `--line-height-h4: 1.55` |
| `--type-size-h3` | `clamp(1.375rem, calc(1.14vw + 1.15rem), 2rem)` | 22 px | 32 px | `--line-height-h3: 1.45` |
| `--type-size-h2` | `clamp(1.625rem, calc(2.13vw + 1.2rem), 2.8rem)` | 26 px | 45 px | `--line-height-h2: 1.35` |
| `--type-size-h1` | `clamp(2rem, calc(3.64vw + 1.27rem), 4rem)` | 32 px | 64 px | `--line-height-h1: 1.3` |
| `--type-size-card-title` | `clamp(1.375rem, calc(0.7vw + 1.2rem), 2rem)` | 22 px | 32 px | 1.2 |
| `--type-size-featured-card-title` | `clamp(1.75rem, calc(1.25vw + 1.45rem), 2.75rem)` | 28 px | 44 px | 1.2 |
| `--type-size-blockquote` | `1.1em` | relative | relative | body |

### Heading defaults

- Font family: `Plus Jakarta Sans`
- Font weight: `var(--font-weight-bold)` (`700`)
- Color: `text-primary`
- Margin: `0` (specific spacing applied per element)
- `h1`, `h2`, `h3` use `text-wrap: balance`

### Suggested Figma text styles

Name each style `Desktop / ...` and `Mobile / ...` using the reference sizes above.

- `Body`
- `Body Small`
- `Body Large`
- `H1`
- `H2`
- `H3`
- `H4`
- `H5`
- `Card Title`
- `Featured Card Title`
- `Mono / Meta`
- `Mono / Small`
- `Tag / Chip`
- `Button`
- `Eyebrow` (uppercase, `letter-spacing: var(--letter-spacing-label)`, `--type-size-small`)

### Usage notes

- Body text in `.prose p` is max `68ch` wide.
- `code` uses `var(--font-mono)` at `0.95em` with `--bg-surface` background and `--radius-sm` radius.
- `pre` blocks use `--space-component` padding, `--bg-surface` background, `--border-main` border.
- Uppercase labels (TOC heading, share label, webmentions heading, repo label) use `--type-size-small`, uppercase, `letter-spacing: var(--letter-spacing-label)`, `--text-muted` color.

---

## 5. Spacing

### Rhythm token

| Token | Value | Mobile ref | Desktop ref |
|-------|-------|------------|-------------|
| `--rhythm` | `clamp(1.65rem, calc(0.75vw + 1.5rem), 2.0625rem)` | 26.4 px | 33 px |

### Spacing scale (multiples of rhythm)

| Token | Calculation | Mobile ref | Desktop ref | Usage |
|-------|-------------|------------|-------------|-------|
| `--space-xs` | `var(--rhythm) * 0.5` | 13.2 px | 16.5 px | Inline gaps, small margins |
| `--space-sm` | `var(--rhythm) * 0.75` | 19.8 px | 24.75 px | Strong inline gaps |
| `--space-md` | `var(--rhythm) * 1` | 26.4 px | 33 px | Component padding/gap |
| `--space-lg` | `var(--rhythm) * 1.5` | 39.6 px | 49.5 px | Large component gaps |
| `--space-xl` | `var(--rhythm) * 2` | 52.8 px | 66 px | Section gaps |
| `--space-section` | `var(--rhythm) * 2.5` | 66 px | 82.5 px | Major section separators |
| `--space-layout` | `var(--rhythm) * 3` | 79.2 px | 99 px | Top/bottom page spacing |

### Semantic spacing aliases

| Token | Maps to |
|-------|---------|
| `--space-inline` | `--space-xs` |
| `--space-inline-strong` | `--space-sm` |
| `--space-component` | `--space-md` |
| `--space-component-lg` | `--space-lg` |

### Suggested Figma number variables

Create variables named exactly as the tokens above, with values set to the desktop references. Add a second collection or mode for mobile references if desired.

---

## 6. Layout

### Layout rails

| Token | Value | Approx px | Usage |
|-------|-------|-----------|-------|
| `--layout-rail-prose` | `68ch` | ~680 px | Readable prose paragraphs, article headers |
| `--layout-rail-page` | `72rem` | 1152 px | Main content max-width |
| `--layout-rail-wide` | `80rem` | 1280 px | Wide layouts (rarely used) |

### Site frame

- `.site-frame` adds `--space-component` padding.
- Header and footer use `.site-frame`.

### Main content

```css
main {
  max-width: var(--layout-rail-page);
  margin-inline: auto;
  padding: var(--space-layout) var(--space-component);
  flex: 1;
}
```

- Mobile (`<=720px`): `padding: var(--space-component)`.

### Header

- Fixed position at top.
- Background: `--bg-surface`.
- Border bottom: `1px solid var(--border-muted)`.
- Min height: `4.5rem` desktop / `4rem` mobile.
- Internal nav max-width: `--layout-rail-page`.
- Body offset: `padding-top: var(--header-height, 4.5rem)` (set by JS).
- Header hides on scroll down, reveals on scroll up.
- Mobile: hamburger menu (`aria-expanded`) opens a two-column dropdown.

### Footer

- Centered text.
- Color: `--text-secondary`.
- Social links below copyright, gap `--space-inline`, margin-top `--space-component`.

### Prose layout

- `.prose` centers content.
- `.prose p, .prose li` max-width: `68ch`.
- Headings have top margins using `--space-xl`/`--space-lg`.
- `scroll-margin-top` accounts for fixed header height.

### Grid

- `.grid` uses `display: grid`, gap `--space-component`.
- `.grid--cards`: `repeat(auto-fit, minmax(280px, 1fr))`.
- `.grid--featured-first`: first card spans full width; title uses `--type-size-featured-card-title`.
- Mobile (`<=720px`): `.grid--cards` becomes single column; featured-first override removed.

### Breakpoints

| Name | Width | Notes |
|------|-------|-------|
| Mobile max | `720px` | Main padding reduction, card grid single column |
| Header collapse | `840px` | Hamburger menu appears |
| Social hide | `1024px` | Header social links hidden |
| Homepage stack | `800px` | Hero becomes single column |

---

## 7. Colors

### Dark palette (default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-main` | `#0b1020` | Page background |
| `--bg-surface` | `#111a2e` | Cards, header, code blocks |
| `--bg-surface-elevated` | `#18243a` | Elevated surfaces, hover states |
| `--text-primary` | `#f8fafc` | Headings, primary text |
| `--text-secondary` | `#cbd5e1` | Body text, descriptions |
| `--text-muted` | `#94a3b8` | Meta, captions, labels |
| `--brand-primary` | `#5ea8ff` | Links, actions, focus |
| `--brand-accent` | `#38d9a9` | Link hover, success states |
| `--brand-highlight` | `#ffb86b` | Highlights, marks |
| `--border-main` | `#26344d` | Card borders, dividers |
| `--border-muted` | `#1a2638` | Header border, subtle separators |
| `--border-control` | `#52627a` | Form input borders |

### Light palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-main` | `#f8fafc` | Page background |
| `--bg-surface` | `#ffffff` | Cards, header, code blocks |
| `--bg-surface-elevated` | `#e8eef7` | Elevated surfaces |
| `--text-primary` | `#0f172a` | Headings, primary text |
| `--text-secondary` | `#334155` | Body text |
| `--text-muted` | `#475569` | Meta, captions |
| `--brand-primary` | `#005fcc` | Links, actions, focus |
| `--brand-accent` | `#007a5a` | Link hover, success |
| `--brand-highlight` | `#a14b00` | Highlights |
| `--border-main` | `#cbd5e1` | Card borders, dividers |
| `--border-muted` | `#e2e8f0` | Header border |
| `--border-control` | `#64748b` | Form input borders |

### Semantic color roles

| Token | Dark value | Light value | Usage |
|-------|------------|-------------|-------|
| `--color-link` | `--brand-primary` | `--brand-primary` | Default links |
| `--color-link-hover` | `--brand-accent` | `--brand-accent` | Hovered links |
| `--color-action` | `--brand-primary` | `--brand-primary` | Buttons, CTAs |
| `--color-action-hover` | `#3d8ee0` | `#004799` | Button hover |
| `--color-focus` | `--color-link` | `--color-link` | Focus outlines |
| `--color-success` | `--brand-accent` | `--brand-accent` | Success states |
| `--color-text-primary` | `--text-primary` | `--text-primary` | Semantic text primary |
| `--color-text-secondary` | `--text-secondary` | `--text-secondary` | Semantic text secondary |
| `--color-text-muted` | `--text-muted` | `--text-muted` | Semantic text muted |
| `--color-card-bg` | `--bg-surface` | `--bg-surface` | Card backgrounds |
| `--color-card-bg-elevated` | `--bg-surface-elevated` | `--bg-surface-elevated` | Elevated card backgrounds |
| `--color-card-border` | `--border-main` | `--border-main` | Card borders |

### Suggested Figma variable names

Create a `Colors` collection with modes `Dark` and `Light`:

- `bg/main`
- `bg/surface`
- `bg/surface-elevated`
- `text/primary`
- `text/secondary`
- `text/muted`
- `brand/primary`
- `brand/accent`
- `brand/highlight`
- `border/main`
- `border/muted`
- `border/control`
- `action/default`
- `action/hover`
- `link/default`
- `link/hover`
- `focus`
- `success`
- `card/bg`
- `card/bg-elevated`
- `card/border`

---

## 8. Components

### Header

- **Source:** `src/components/Header.astro`
- **Purpose:** Fixed top navigation with site title, primary links, search icon, theme toggle, and social links.
- **Typography:** Site title uses `Plus Jakarta Sans 900`, `clamp(1.25rem, 0.55vw + 1.1rem, 1.65rem)`, `letter-spacing: -0.03em`.
- **Spacing:** Nav min-height `4.5rem`/`4rem`, links padded with `--space-inline` / `--space-inline-strong`.
- **States/variants:**
  - Desktop: horizontal layout.
  - `<=1024px`: social links hidden.
  - `<=840px`: hamburger menu, dropdown two-column grid.
  - Scroll down: `.header--hidden` (`translateY(-100%)`).
  - Active link: `border-bottom-color: var(--color-link)`.
- **Accessibility:** Skip link, `aria-expanded` on menu toggle, `aria-label` on search, `aria-current="page"` on active link, focus-visible outlines.
- **Figma name:** `Header / Desktop`, `Header / Mobile Open`, `Header / Mobile Closed`.

### Footer

- **Source:** `src/components/Footer.astro`
- **Purpose:** Copyright notice and social links.
- **Typography:** `--text-secondary`, centered.
- **Spacing:** Social links gap `--space-inline`, margin-top `--space-component`.
- **Figma name:** `Footer`.

### HeaderLink

- **Source:** `src/components/HeaderLink.astro`
- **Purpose:** Navigation link with active-state detection.
- **Typography:** `--font-copy`, `--text-primary`.
- **States:** Default (`border-bottom: 2px solid transparent`), hover (`--color-action` border), active (`--color-link` border, `font-weight: 700`).
- **Accessibility:** `aria-current="page"` when active.
- **Figma name:** `Nav Link`, `Nav Link / Active`.

### Card

- **Source:** `src/components/Card.astro`
- **Purpose:** Content card for posts, projects, or listings.
- **Container:** `.card` — padding `--space-component`, background `--color-card-bg`, border `--size-border-pixel solid var(--color-card-border)`, radius `--radius-lg`.
- **Typography:** Title uses `--type-size-card-title` (or `--type-size-featured-card-title` when first in featured grid), line-height `1.2`. Meta uses `--type-size-small` `--text-muted`.
- **Spacing:** Stack children with `> * + *` margin-top `--space-inline-strong`. Image margin negative `--space-component` top/sides.
- **States/variants:**
  - Hover: `box-shadow: var(--shadow-lg)`, `border-color: var(--color-action)`, `transform: translateY(-4px)` (motion allowed).
  - With image: `card-image` at top, `aspect-ratio: 2 / 1`, radius top only.
  - Featured: larger title size.
- **Accessibility:** Entire card clickable via pseudo-element on `.card-link`, tags remain clickable.
- **Figma name:** `Card / Default`, `Card / With Image`, `Card / Featured`.

### PostGrid

- **Source:** `src/components/PostGrid.astro`
- **Purpose:** Renders a list of blog post cards.
- **Layout:** `ul.grid.grid--cards`.
- **Figma name:** `Post Grid`.

### Button

- **Source:** `src/styles/components.css` (`.button`)
- **Purpose:** Primary CTA.
- **Container:** `display: inline-flex`, min-height `--size-touch-target-min`, padding `--space-inline` `--space-component`, radius `--radius-md`, background `--color-action`, color `--bg-surface`.
- **Typography:** `--type-size-body`.
- **States:** Hover (`--color-action-hover`, `box-shadow: var(--shadow-md)`, `translateY(-1px)`).
- **Variant:** `.button--outline` — shared transparent-background button with `--color-action` border/text; previously homepage-only, now in `src/styles/components.css`.
- **Figma name:** `Button / Primary`, `Button / Outline`.

### Tag and Chip

- **Source:** `src/styles/components.css` (`.tag`, `.chip`)
- **Purpose:** `.tag` is interactive (link). `.chip` is static.
- **Container:** `display: inline-flex`, padding `0.2em 0.6em`, radius `999px`, background `--bg-surface-elevated`, color `--text-secondary`.
- **Typography:** `--font-mono`, `--type-size-small`.
- **States:** Tag hover uses `--color-action-hover` background and `--bg-main` text.
- **Figma name:** `Tag`, `Chip`.

### Callout

- **Source:** `src/styles/components.css` (`.callout`)
- **Purpose:** Highlighted informational block.
- **Container:** Padding `--space-component`, left border `--size-border-thick` (`4px`) solid `--color-link`, radius `--radius-md`, background `--color-card-bg`, color `--text-secondary`.
- **Figma name:** `Callout`.

### Back Link

- **Source:** `src/styles/components.css` (`.back-link`)
- **Purpose:** Return navigation above articles.
- **Typography:** `--type-size-small`, `--text-muted`.
- **Figma name:** `Back Link`.

### Reading Progress Bar

- **Source:** `src/styles/global.css` (`.reading-progress`)
- **Purpose:** Fixed reading-progress indicator on articles.
- **Container:** Fixed top, height `3px`, background `--color-link`, width animated 0–100%.
- **Accessibility:** `role="progressbar"`, `aria-valuenow`.
- **Figma name:** `Reading Progress Bar`.

### Skip Link

- **Source:** `src/styles/global.css` (`.skip-link`)
- **Purpose:** Keyboard-only skip-to-content link.
- **Figma name:** `Skip Link`.

### SocialLinks

- **Source:** `src/components/SocialLinks.astro`
- **Purpose:** Icon links to social profiles.
- **Container:** `44px × 44px` touch target, radius `--radius-md`, color `--text-secondary`.
- **States:** Hover color `--color-link`.
- **Accessibility:** Each icon has `.sr-only` text and `aria-hidden="true"` SVG.
- **Figma name:** `Social Links`.

### ThemeToggle

- **Source:** `src/components/ThemeToggle.astro`
- **Purpose:** Light/dark theme toggle button.
- **Container:** `44px × 44px`, transparent background, radius `--radius-md`.
- **Icons:** Sun (shown in dark) and moon (shown in light), `20px × 20px`.
- **Accessibility:** `aria-label="Toggle light/dark theme"`.
- **Figma name:** `Theme Toggle / Dark`, `Theme Toggle / Light`.

### ShareStrip

- **Source:** `src/components/ShareStrip.astro`
- **Purpose:** Social share links for articles.
- **Container:** Vertical flex, gap `--space-inline`, padding `--space-component 0`.
- **Label:** "Share" uppercase, `--type-size-small`, `--text-muted`, `letter-spacing: 0.05em`.
- **Icons:** `44px × 44px`, color `--text-secondary`, hover `--color-link-hover`.
- **Figma name:** `Share Strip`.

### TagFilterBar

- **Source:** `src/components/TagFilterBar.astro`
- **Purpose:** Tag filter list or post tags.
- **Container:** Flex wrap, gap `--space-sm`, centered.
- **Items:** Pill shape (`border-radius: 999px`), padding `0.3em 0.7em`, `--type-size-small`, `--text-muted`.
- **States:** Hover background `--bg-surface`, color `--color-link`.
- **Figma name:** `Tag Filter Bar`.

### PaginationNav

- **Source:** `src/components/PaginationNav.astro`
- **Purpose:** Previous/next post or page navigation.
- **Container:** `display: grid; grid-template-columns: 1fr 1fr`, gap `--space-component`, border-top `--size-border-pixel solid var(--border-main)`.
- **Typography:** Label `--type-size-small` `--text-muted`; title `--font-headers 700`.
- **States:** Hover background `--bg-surface`, color `--color-link`.
- **Figma name:** `Pagination Nav`.

### Table of Contents (TOC)

- **Source:** `src/styles/components.css` (`.toc`)
- **Purpose:** Sticky article sidebar navigation.
- **Position:** Sticky, top below header.
- **Typography:** Heading `--type-size-small`, uppercase, `--text-muted`, `letter-spacing: 0.05em`.
- **Links:** Block, left border `--size-border-pixel` transparent, padding-left `--space-inline`.
- **States:** Hover/active color `--color-action`, border-left `--color-action`.
- **Figma name:** `Table of Contents`.

### Webmentions

- **Source:** `src/components/Webmentions.astro`
- **Purpose:** Display likes, reposts, and replies.
- **Container:** Margin-top `--space-section`, border-top `--size-border-pixel solid var(--border-main)`.
- **Avatars:** `32px` circle, background `--bg-surface`.
- **Replies:** Card with padding `--space-component`, background `--bg-surface`, border `--border-muted`, radius `--radius-md`.
- **Figma name:** `Webmentions / Reactions`, `Webmentions / Reply`.

### Stats Grid

- **Source:** `src/styles/components.css` (`.stats-grid`, `.stat`)
- **Purpose:** 4-column stat display.
- **Container:** Grid `repeat(4, 1fr)`, gap `--space-component`, max-width `--layout-rail-prose`.
- **Stat card:** padding `--space-component`, background `--color-card-bg`, border `--border-muted`, radius `--radius-md`, centered.
- **Typography:** Value `--type-size-h3`, `--font-mono`, `--color-action`; label `--type-size-small`, `--text-secondary`.
- **Responsive:** `<=720px` becomes `repeat(2, 1fr)`.
- **Figma name:** `Stats Grid`, `Stat Card`.

### Contact Form

- **Source:** `src/pages/contact.astro`
- **Purpose:** Contact form with inputs and success card.
- **Container:** Max-width `--layout-rail-prose`, flex column gap `--space-component`.
- **Inputs:** Padding `--space-inline` `--space-sm`, background `--bg-surface`, border `--size-border-pixel solid var(--border-control)`, radius `--radius-sm`.
- **Focus:** Border `--color-action`, `box-shadow: 0 0 0 1px var(--color-action)`.
- **Success card:** `--bg-surface`, `--border-main`, left border `--size-border-thick` `--color-success`, radius `--radius-md`.
- **Figma name:** `Contact Form`, `Contact Success Card`.

### Search UI

- **Source:** `src/pages/search.astro`, `src/styles/pagefind.css`
- **Purpose:** Pagefind search interface.
- **Notes:** Mostly third-party UI restyled with project tokens. Document the search input as a large text field (`min-height: 44px`, radius `--radius-md`, border `--border-control`) and results as cards matching the project card style.
- **Figma name:** `Search / Input`, `Search / Result Card`.

### 404 Page

- **Source:** `src/pages/404.astro`
- **Purpose:** Friendly not-found page.
- **Typography:** Code `404` uses `--font-mono`, `clamp(4rem, 12vw, 8rem)`, `--color-action`.
- **Figma name:** `404 Page`.

---

## 9. Page Templates

Create these frames/artboards using the components above.

| Template | Key layout notes |
|----------|------------------|
| **Homepage** | Hero: 2-col grid (`1fr auto`), gap `--space-section`. Avatar `280px` circle desktop, `200px` tablet, `140px` mobile. Latest writing section with `grid--cards grid--featured-first`. |
| **Blog Index** | `collection-header` with title and description. `TagFilterBar`. `PostGrid`. Optional `PaginationNav`. |
| **Article** | `.page-header--article` max-width `1020px`. Hero image max-width `1020px`, `aspect-ratio: 2 / 1`. Two-column content/sidebar (`post-layout`). TOC sticky in sidebar. Share strip above TOC. Pagination nav and webmentions below content. Reading progress bar fixed at top. |
| **Portfolio** | Full-width case-study cards in 2-col grid (`1.6fr 0.8fr`), gap `--space-component-lg`/`--space-section`. Repo list with GitHub icon. Tag clusters. |
| **Contact** | Centered prose max-width `68ch`. Form stacked. Success card state. |
| **Search** | Search input, results as cards. |
| **404** | Centered vertical flex, min-height `60vh`. |

---

## 10. Figma Agent Instructions

> Paste the following directly into the Figma agent prompt.

```
Create a Figma design-system companion file for the Astro site ericcarlisle.com using the brief above.

Rules:
1. Use the Astro implementation as the source of truth. Do not redesign colors, type, or spacing.
2. Create the exact pages listed in section 3.
3. Build a color variable collection named "Colors" with Dark and Light modes using the hex values in section 7.
4. Build number variables for spacing tokens in section 5 (desktop values are fine; note mobile references).
5. Create text styles for Desktop and Mobile using the type scale in section 4.
   - Also create font-weight variables (`normal`, `medium`, `bold`, `black`) and letter-spacing variables (`tight`, `label`, `wide`) from section 4.
6. Build each component listed in section 8 as a Figma component with the suggested Figma names.
7. Build the page templates in section 9 as frames/artboards.
8. Preserve exact CSS values: rems should map to px assuming 16px base, clamp() values should show both mobile and desktop reference sizes.
9. Include focus states, hover states, and mobile variants where noted.
10. On page 07 Implementation Notes, list the source files, any clamp() tokens, and the known gaps below.

Known gaps / intentional exceptions to document:
- `--header-height` is JS-managed with a 4.5rem fallback; the header measures its own rendered height and writes it back to this custom property so body padding stays exact.
- Pagefind search UI is third-party markup injected at runtime and restyled via `src/styles/pagefind.css`; do not rebuild its internal component structure in Figma.
- Portfolio case-study grid uses page-local sizing (`1.6fr / 0.8fr`) in `src/pages/portfolio.astro`, not a shared grid token.
- Homepage hero role uses a one-off `letter-spacing: 0.02em` that is intentionally not tokenized.
```

---

## 11. Source Files Referenced

- `src/styles/global.css`
- `src/styles/components.css`
- `src/styles/feed.css`
- `src/styles/pagefind.css`
- `src/layouts/BlogPost.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/HeaderLink.astro`
- `src/components/Card.astro`
- `src/components/PostGrid.astro`
- `src/components/SocialLinks.astro`
- `src/components/ThemeToggle.astro`
- `src/components/ShareStrip.astro`
- `src/components/TagFilterBar.astro`
- `src/components/PaginationNav.astro`
- `src/components/Webmentions.astro`
- `src/pages/index.astro`
- `src/pages/blog.astro`
- `src/pages/portfolio.astro`
- `src/pages/contact.astro`
- `src/pages/search.astro`
- `src/pages/404.astro`
- `src/consts.ts`
