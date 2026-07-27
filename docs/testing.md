# Testing

This project uses `pnpm` as its package manager. All commands assume `pnpm`.

## Available Checks

- `pnpm typecheck` — Runs `astro check` for TypeScript and Astro compilation errors.
- `pnpm lint` — Runs `biome check .` for code style and formatting issues.
- `pnpm build` — Runs `astro build` to produce the static output in `./dist/`.
- `pnpm validate:content` — Scans blog MDX/MD files for top-level h1 headings (layout already renders the title).
- `pnpm validate:agent-docs` — Validates local links and documented package-script names in agent-facing documentation.
- `pnpm lighthouse:all` — Runs Lighthouse audits across project routes via
  `node scripts/lighthouse-all.mjs`.
  Lighthouse score requirements are defined in `lighthouserc.js`. See that file for the current thresholds.
- `pnpm structured-data:report` — Builds the site and validates generated JSON-LD.
- `pnpm context:health` / `pnpm context:health:validate` — Regenerates and validates the Context Health report.
- `pnpm fallow:dead-code` — Reports unused files and dependencies; Fallow is not run in CI.

## When to Run Each Check

| Check | When to run |
|---|---|
| `pnpm typecheck` | Frequently during development, before committing |
| `pnpm lint` | Before committing, before pushing |
| `pnpm build` | Before committing, to verify the output builds without errors |
| `pnpm validate:agent-docs` | After changing AGENTS.md, README.md, docs, or skill routing |
| `pnpm lighthouse:all` | Before merging significant layout, performance, or accessibility changes |

## Docs-Only Changes

For changes restricted to documentation files (`README.md`, `AGENTS.md`, `docs/`, or agent skills),
run `pnpm validate:agent-docs` and `pnpm lint`. `pnpm build` and
`pnpm lighthouse:all` are not strictly necessary for pure documentation edits
but may be run to confirm no unintended side effects.

## Playwright

Playwright is configured for end-to-end and accessibility testing:

- `pnpm test:e2e` — Runs the full Playwright test suite (routes, a11y, SEO, Storybook checks).
- `pnpm test:a11y` — Runs only the accessibility tests in `tests/accessibility.spec.ts`.

Configuration lives in `playwright.config.ts`. Tests run against the production build served by a static file server. CI installs Chromium and runs `pnpm test:e2e` as part of the deployment workflow.

## Storybook

Storybook is the internal component-development lab. Configuration lives in `.storybook/`; stories
are colocated as `src/**/*.stories.*` or kept under `src/components/story-fixtures/`. The preview
imports the production global styles and exposes light and dark themes.

- `pnpm storybook` — Starts the lab at `localhost:6006`.
- `pnpm build:storybook` — Builds `storybook-static/`.
- `pnpm verify:storybook-isolation` — Confirms Storybook packages do not enter the ordinary Astro production bundle.

The deployment workflow copies the static Storybook build to `/design-system/lab/`, matching the
base path in `.storybook/main.ts`. Storybook packages remain development dependencies. Use plain
object story exports because `Meta` and `StoryObj` are not re-exported by
`@storybook-astro/framework`.

## Other Notes

- **Vitest** — Installed but not used. No active test runner.
- **Biome** — `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are disabled in `biome.json`.
- **Lighthouse** — `pnpm lighthouse:all` serves every generated HTML page from a plain static server. `lighthouserc.js` defines CI thresholds and uses `npm run preview` as its start-server command.
- **Generated directories** — `dist/`, `node_modules/`, `.astro/`, `lh-reports/`, `docs/context/`, `.playwright-mcp/` are regenerated on each build and should not be edited directly.
