# Testing

This project uses `pnpm` as its package manager. All commands assume `pnpm`.

## Available Checks

- `pnpm typecheck` — Runs `astro check` for TypeScript and Astro compilation errors.
- `pnpm lint` — Runs `biome check .` for code style and formatting issues.
- `pnpm build` — Runs `astro build` to produce the static output in `./dist/`.
- `pnpm validate:content` — Scans blog MDX/MD files for top-level h1 headings (layout already renders the title).
- `pnpm lighthouse:all` — Runs Lighthouse audits across project routes via
  `node scripts/lighthouse-all.mjs`.
  Lighthouse score requirements are defined in `lighthouserc.js`. See that file for the current thresholds.

## When to Run Each Check

| Check | When to run |
|---|---|
| `pnpm typecheck` | Frequently during development, before committing |
| `pnpm lint` | Before committing, before pushing |
| `pnpm build` | Before committing, to verify the output builds without errors |
| `pnpm lighthouse:all` | Before merging significant layout, performance, or accessibility changes |

## Docs-Only Changes

For changes restricted to documentation files (README.md, AGENTS.md, docs/),
running `pnpm lint` is the primary validation step. `pnpm build` and
`pnpm lighthouse:all` are not strictly necessary for pure documentation edits
but may be run to confirm no unintended side effects.

## Playwright

Playwright is configured for end-to-end and accessibility testing:

- `pnpm test:e2e` — Runs the full Playwright test suite (routes, a11y, SEO, Storybook checks).
- `pnpm test:a11y` — Runs only the accessibility tests in `tests/accessibility.spec.ts`.

Configuration lives in `playwright.config.ts`. Tests run against the production build served by a static file server. CI installs Chromium and runs `pnpm test:e2e` as part of the deployment workflow.

## Other Notes

- **Vitest** — Installed but not used. No active test runner.
- **Generated directories** — `dist/`, `node_modules/`, `.astro/`, `lh-reports/`, `docs/context/`, `.playwright-mcp/` are regenerated on each build and should not be edited directly.
