# Testing

This project uses `pnpm` as its package manager. All commands assume `pnpm`.

## Available Checks

- `pnpm typecheck` — Runs `astro check` for TypeScript and Astro compilation errors.
- `pnpm lint` — Runs `biome check .` for code style and formatting issues.
- `pnpm build` — Runs `astro build` to produce the static output in `./dist/`.
- `pnpm lighthouse:all` — Runs Lighthouse audits across project routes via
  `node scripts/lighthouse-all.mjs`.

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

Playwright (`^1.60.0`) is available in `devDependencies` but is not currently
wired into a test suite or CI pipeline. If browser-based tests are added in
the future, they should use Playwright and be documented here.
