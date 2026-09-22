# Testing

**Use when:** Choosing or running validation, or changing test, lint, Playwright, or Storybook tooling.

This file is the single source for validation commands. `package.json` is the source of truth for exact script definitions. Use `pnpm` only.

## When to Run Each Check

| Change | Check |
|---|---|
| Schema, components, utilities, TypeScript | `pnpm typecheck` (`astro check`) |
| Anything, before committing | `pnpm lint` (`biome check .`) |
| Routes, integrations, RSS, sitemap, Pagefind, build | `pnpm build` (output in `dist/`) |
| SEO, sitemap, metadata, links, navigation, content | `pnpm validate:seo` after a build with Storybook copied to `dist/design-system/lab/` ([details](site-inventory.md#seo-gate)) |
| Blog Markdown/MDX | `pnpm validate:content` (rejects top-level `h1`; the layout renders the title) |
| JSON-LD | `pnpm structured-data:report` ([details](structured-data.md)) |
| `AGENTS.md`, `README.md`, docs, or skill routing | `pnpm validate:agent-docs` (checks links, heading anchors, and `pnpm` script names in `AGENTS.md`, `README.md`, all of `docs/`, and routed skills; not run in CI) |
| Context Health report or its measured files | `pnpm context:health` to refresh sizes, then `pnpm context:health:validate` |
| Significant layout, performance, or accessibility | `pnpm lighthouse:all` (thresholds in `lighthouserc.js`) |
| Dead-code review (not run in CI) | `pnpm fallow:dead-code` |
| Formatting | `pnpm format`, only when requested |

**Docs-only changes:** run `pnpm validate:agent-docs` and `pnpm lint`. A build is optional.

## Playwright

`pnpm test:e2e` runs the full suite (routes, accessibility, SEO, Storybook) against the production build. `pnpm test:a11y` runs only `tests/accessibility.spec.ts`. Configuration lives in `playwright.config.ts`. CI runs the full suite on every build.

## Storybook

Storybook is the internal component lab, deployed at `/design-system/lab/`. The public design-system page remains the curated portfolio presentation. Configuration lives in `.storybook/`. Stories are colocated as `src/**/*.stories.*` or kept in `src/components/story-fixtures/`. The preview imports production global styles and exposes light and dark themes.

| Command | Purpose |
|---|---|
| `pnpm storybook` | Lab at `localhost:6006` |
| `pnpm build:storybook` | Builds `storybook-static/` |
| `pnpm verify:storybook-isolation` | Confirms Storybook stays out of the production bundle |

Storybook packages stay dev dependencies. Use plain-object story exports, because `@storybook-astro/framework` does not re-export `Meta` or `StoryObj`.

## Tooling notes

- **Biome** replaces ESLint and Prettier. `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are off in `biome.json`.
- **Vitest** is installed but unused; there is no active unit-test runner.
- **Lighthouse** (`pnpm lighthouse:all`) serves every generated page from a static server. `lighthouserc.js` uses `npm run preview` as its start command.
- **Generated directories** are listed in [Architecture](architecture.md#generated-areas).
