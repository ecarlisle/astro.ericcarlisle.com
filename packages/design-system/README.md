# @ericcarlisle/design-system

Shared design tokens, fonts, and content-agnostic components for
`ericcarlisle.com` and any future properties that want the same visual
system, in a pnpm workspace package (`packages/design-system`).

Consumers depend on it via `workspace:*` and import from it using the real
package specifier — not a Vite alias — so it resolves identically in Astro,
Storybook, and any other build tool a future consumer might use:

```ts
import ThemeToggle from '@ericcarlisle/design-system/components/ThemeToggle.astro';
```

```css
@import "@ericcarlisle/design-system/fonts/index.css";
@import "@ericcarlisle/design-system/styles/tokens.css";
@import "@ericcarlisle/design-system/styles/base.css";
```

## What lives here

- **`src/fonts/index.css`** — the `@fontsource-variable` imports (Source Sans
  3, Plus Jakarta Sans, Fira Code). The package owns these dependencies.
- **`src/styles/tokens.css`** — every `:root` / `[data-theme]` custom
  property: color, type scale, spacing, radii, shadows, motion, layout
  rails. This is the single source of truth for the token set.
- **`src/styles/base.css`** — element resets, base typography, layout-rail
  utilities (`.rail`, `.rail--prose`, ...), the skip-link, and the
  `.technical-surface` decorative-background utility.
- **`src/components/`** — Astro components with no dependency on a
  consuming site's content model or business logic:
  - `PageHeader`, `HeaderLink`, `ThemeToggle`, `PaginationNav`,
    `ShareStrip`, `FormattedDate`
  - `CategoryTag` / `CategoryIcon` — an accent-colored chip with a Material
    Symbols icon. These take `accent` and `icon` as explicit props rather
    than looking them up from a label, so a consumer's own tag/category
    taxonomy stays in the consumer, not here. See `category-types.ts` for
    the `CategoryAccent` / `CategoryIconName` unions.

## What doesn't live here

Anything that encodes `ericcarlisle.com`'s own content, copy, or business
logic stays in that site's `src/components/`: `Card` and `TagFilterBar`
(compute accent/icon from this site's blog tag taxonomy), `PostGrid` (typed
to the blog content collection), `Header` / `Footer` (hardcoded nav and
social links), `SocialLinks` (Eric's personal profile URLs), and anything
analytics/SEO-related (`BaseHead`, `SchemaOrg`, `GoogleAnalytics`,
`Webmentions`, `PageQualityFooter`).

The dividing line: would this component make sense dropped into a
*different* site with the same visual system? If yes, it belongs here.

## Living reference

The full token reference and interactive component demos are documented on
the consuming site's `/portfolio/design-system/` page
(`src/pages/portfolio/design-system.astro`) and in Storybook
(`pnpm storybook`). Both render what's actually in this package — there's no
separate spec to keep in sync.
