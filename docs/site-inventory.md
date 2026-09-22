# Site Inventory and SEO Gate

**Use when:** Changing or debugging `/lab/site-inventory/`, `pnpm validate:seo`, sitemap filtering, or inventory warnings.

`/lab/site-inventory/` reports on the generated build for the site owner. It is not a public sitemap, and it does not measure live availability, crawling, or indexing.

## Data flow

`pnpm build` runs `postbuild` (`scripts/generate-site-inventory.mjs`), which writes `dist/lab/site-inventory/data.json`. The page loads that file at runtime. Nothing is committed under `src/`. CI regenerates the inventory after the final Storybook copy so the data matches the uploaded artifact.

To view it locally, run `pnpm build`, then `pnpm preview`. `pnpm dev` does not serve `dist/`.

Output is deterministic: the same input produces byte-identical JSON. It records the Git commit, not a timestamp.

## What it cross-checks

- **Built HTML pages.** This includes registered external artifacts. Tool output (Pagefind, Partytown, `_astro/`, icons) and files inside artifacts are excluded.
- **The XML sitemap.**
- **Internal `<a href>` links.**

For each URL, it records whether the page was built, sitemap membership, title, description, canonical, robots, H1 count, inbound links, `lastmod`, and warnings.

## Warnings

`MISSING_FROM_SITEMAP` · `NO_BUILT_PAGE` · `ORPHANED_PAGE` · `NOINDEX_IN_SITEMAP` · `REDIRECT_IN_SITEMAP` · `MISSING_CANONICAL` · `CANONICAL_MISMATCH` · `CANONICAL_TARGET_MISSING` · `MISSING_TITLE` · `MISSING_DESCRIPTION` · `MISSING_H1` · `MULTIPLE_H1S` · `DUPLICATE_TITLE` · `DUPLICATE_DESCRIPTION` · `DUPLICATE_CANONICAL`

## SEO gate

`pnpm validate:seo` (`scripts/validate-seo.mjs`) makes the indexing-relevant warnings fatal. It also adds these checks:

- `BROKEN_INTERNAL_LINK`, resolved against built routes and registered artifacts
- `REDUNDANT_ALT_PREFIX`
- Policy assertions: `SEARCH_NOINDEX`, `DESIGN_SYSTEM_INDEXABLE`, and `STORYBOOK_NOINDEX` (when Storybook is present)
- Naming: the design-system reference page and the portfolio must say `KISS Design System`, never the retired names `Design System Companion` or `Astro Blog Design System`

## Classification and exceptions

Pages are classified as normal, `noindex`, redirect, 404, lab (`/lab/*`), or external artifact (`/design-system/lab/`). Redirects are detected from Astro's `<meta http-equiv="refresh">` output and the legacy `/posts/*` list. A mismatched canonical is not redirect evidence; that page gets `CANONICAL_MISMATCH`.

The exceptions live in `scripts/site-inventory-core.mjs`:

- `/lab/*` and `/404.html/` expect no inbound links and no sitemap entry.
- The 404 page's `/404/` canonical is an Astro convention.
- Only indexable pages receive `ORPHANED_PAGE`.
- Redirects are non-indexable; the gate checks that their canonical target exists.
- Storybook is one artifact, represented by `dist/design-system/lab/index.html`.

## Indexing policy

`scripts/seo-policy.mjs` is the single source for indexing and sitemap decisions. Both the `@astrojs/sitemap` filter and `pnpm validate:seo` use it. The route-by-route table is in [Indexing and sitemap policy](performance-seo-accessibility.md#indexing-and-sitemap-policy).
