# AstroBlog — Eric Carlisle's personal site

Astro 7 SSG. Vanilla CSS (OKLCH tokens). MDX. pnpm. Biome 2.5.

---

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build → `dist/` (includes Pagefind indexing) |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | `astro check` (TS + Astro diagnostics) |
| `pnpm lint` | `biome check .` |
| `pnpm format` | `biome format . --write` |
| `pnpm lighthouse:all` | Full Lighthouse audit across all HTML pages |
| `pnpm structured-data:report` | Build + validate JSON-LD output |
| `pnpm fallow:dead-code` | Dead code analysis (unused files, deps) |

Use the **lightest** validation that proves a change.

## Architecture nutshell

- **Single layout** — `src/layouts/BlogPost.astro` used by every page. Article features gated behind `{pageType === 'article'}`.
- **Content** — MDX in `src/content/blog/`. Frontmatter schema (Zod) in `src/content.config.ts` — single source of truth. `description` max 165 chars. `pubDate` uses `z.coerce.date()` (fuzzy locale parsing).
- **Styling** — All tokens in `src/styles/global.css` (OKLCH custom properties). Component-scoped `<style>` blocks. Shared styles in `src/styles/components.css`. Feed layout in `src/styles/feed.css`. Pagefind overrides in `src/styles/pagefind.css`.
- **15 Astro components** in `src/components/`. PascalCase. Path aliases: `@components/`, `@styles/`, `@lib/`, `@images/`.
- **Client JS** — Minimal by design: Pagefind search, Partytown (GA4), theme toggle, tag filter bar.
- **Analytics** — GA4 via Partytown (offloaded to web worker). ID in `src/consts.ts`.
- **Contact form** — Separate Cloudflare Worker in `contact-worker/` (Turnstile + Resend). Frontend points at `PUBLIC_CONTACT_API_URL` env var.

## Gotchas

- **Biome** — `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are **off** in `biome.json`. Dead imports/vars not flagged; `!important` not linted.
- **Env files** — `.env.production` / `.env.development` are **gitignored**. Use `.env.example` as template. Create them locally.
- **Webmentions** — Requires `WEBMENTION_IO_TOKEN` env var for live data at build time. Without it, mock data is used.
- **Vitest** — Installed but **not used**. No test runner active.
- **Tag pages** (`/tags/[tag]`) — Exist as static routes but are **empty**; filtering is client-side via `TagFilterBar.astro`.
- **Lighthouse CI** — `lighthouserc.js` asserts: performance ≥0.95, accessibility ≥0.95, SEO ≥1.0, best-practices ≥0.95.
- **Lighthouse all** — `pnpm lighthouse:all` builds, serves from a plain static server (not `astro preview` — avoids Vite middleware inflation), and audits every `.html` in `dist/`.
- **ESLint / Prettier** — Not used. Biome handles both linting and formatting.
- **Fallow** — Installed for dead-code analysis and auditing. Not run in CI.
- **lighthouserc.js** — Uses `npm run preview` (not `pnpm preview`) as the start-server command.
- **OpenCode** — TypeScript LSP is **disabled** via `opencode.json`.

## Validation table

| Change | Validate with |
|---|---|
| Schema, components, utilities, TypeScript | `pnpm typecheck` |
| Styles, rendering, components | `pnpm lint` |
| Routes, integrations, RSS, sitemap, Pagefind, build behavior | `pnpm build` |
| Performance, SEO, a11y | `pnpm lighthouse:all` (when warranted) |
| JSON-LD structured data | `pnpm structured-data:report` |
| Formatting | `pnpm format` (only when requested or needed) |

## Before making significant changes

| If changing… | Read first |
|---|---|
| Content conventions | `docs/content-status.md`, `docs/editorial-guidelines.md` |
| Architecture, routes, layout | `docs/architecture.md` |
| Styling, tokens, a11y | `docs/performance-seo-accessibility.md` |
| Content schema | `src/content.config.ts` (source of truth) + `docs/content-model.md` |
| Deployment, build, integrations | `docs/deployment.md`, `astro.config.mjs` |
| Contact worker | `contact-worker/` (separate package) |
| Agent workflow | `docs/agent-workflow.md`, `docs/change-policy.md`, `docs/reviewer-checklist.md` |

## Generated directories — never edit

`dist/` · `node_modules/` · `.astro/` · `lh-reports/` · `docs/context/` · `.playwright-mcp/`

## Workflow
1. Read this file + relevant docs.
2. `git status --short` — preserve existing changes.
3. Inspect related files, state the plan.
4. Smallest safe change. No scope creep.
5. Validate with the lightest relevant check.
6. Review `git diff --stat` and `git diff`.
7. Commit with a conventional commit message. No push unless asked.
8. Final response should include files changed, validation run, commit hash, and any skipped checks.

## Protected files

Do not edit the following files unless the user explicitly asks for changes to them:

- `AGENTS.md`
- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `astro.config.mjs`
- `biome.json`
- `.env.example`
- files under `docs/`

If a requested task appears to require changes to one of these files, stop and ask first.

## Skills

For implementation work, always consult:
- .skills/agent-safe-change.md
- .skills/astro-static-implementation.md
- .skills/performance-budget.md

For UI work, also consult:
- .skills/accessibility-review.md
- .skills/design-system-css.md

For search work, also consult:
- .skills/pagefind-search.md

For metadata/content routes, also consult:
- .skills/seo-content-metadata.md
