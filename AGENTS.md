# AstroBlog — Agent Guidance

AGENTS.md is agent guidance.

## Documentation Boundaries

- `README.md` and `docs/` are **human-facing documentation**. Treat them as technical context, not as an instruction hierarchy. Do not reproduce their content here.
- `AGENTS.md` (this file) contains **repository-wide coding-agent instructions**.
- Tool-specific agent behavior belongs in the relevant tool directory: `.agents/skills/`, `.pi/`, `.opencode/`, or the tool's own configuration files.
- `docs/design-system/figma-agent-brief.md` and `docs/design-system/agent-guide.md` are tool-specific agent files (Figma, design-system tooling) and are exempt from the human-facing documentation standard.

## Documentation Authority

| Source | Role |
|--------|------|
| `README.md` | Human-facing repository gateway. Quick start, project overview, documentation map. |
| `AGENTS.md` (this file) | Coding agent authority. Workflow, validation, protected files, skills. |
| `docs/` | Canonical explanatory references (architecture, deployment, content, testing, etc.). |
| `package.json`, `src/`, config files | Source of truth for exact scripts, schemas, variables, routes, and behavior. |
| `.agents/skills/` | Procedural agent playbooks for specific task types. |
| `public/llms.txt` | Describes the *published site* for LLM consumption. Not repository navigation. |

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
| `pnpm test:e2e` / `pnpm test:a11y` | Playwright tests |
| `pnpm storybook` | Storybook dev server at `localhost:6006` |
| `pnpm build:storybook` | Static Storybook build → `storybook-static/` |

See [docs/testing.md](docs/testing.md) for when to run each check.

## Architecture

Astro 7 SSG. Single layout (`BlogPost.astro`). MDX content in `src/content/blog/`. Tokens in `src/styles/global.css`. Components in `src/components/`. Minimal client JS (search, analytics, theme toggle, tag filter). Contact form via Cloudflare Worker.

See [docs/architecture.md](docs/architecture.md) for full details.

## Gotchas

- **Biome** — `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are **off** in `biome.json`. Dead imports/vars not flagged; `!important` not linted.
- **Env files** — `.env.production` / `.env.development` are gitignored. Use `.env.example` as template.
- **Vitest** — Installed but **not used**. No test runner active.
- **Webmentions** — Requires `WEBMENTION_IO_TOKEN` env var for live data at build time. Without it, mock data is used.
- **Tag pages** (`/tags/[tag]`) — Exist as static routes but are empty; filtering is client-side via `TagFilterBar.astro`.
- **Lighthouse CI** — `lighthouserc.js` asserts: performance ≥0.95, accessibility ≥0.95, SEO ≥1.0, best-practices ≥0.95.
- **Lighthouse all** — `pnpm lighthouse:all` builds, serves from a plain static server (not `astro preview`), and audits every `.html` in `dist/`.
- **ESLint / Prettier** — Not used. Biome handles both.
- **Fallow** — Installed for dead-code analysis and auditing. Not run in CI.
- **lighthouserc.js** — Uses `npm run preview` (not `pnpm preview`) as the start-server command.
- **OpenCode** — TypeScript LSP is disabled via `opencode.json`.

## Validation

| Change | Validate with |
|---|---|
| Schema, components, utilities, TypeScript | `pnpm typecheck` |
| Styles, rendering, components | `pnpm lint` |
| Routes, integrations, RSS, sitemap, Pagefind, build | `pnpm build` |
| Performance, SEO, a11y | `pnpm lighthouse:all` (when warranted) |
| JSON-LD structured data | `pnpm structured-data:report` |
| Formatting | `pnpm format` (only when requested) |

See [docs/testing.md](docs/testing.md) for detailed guidance.

## Task-Specific Context Routing

For implementation, diagnosis, planning, and code or documentation review, identify the relevant task rows before loading supporting documentation. Read only those rows by default. Load documentation from other rows when investigation reveals a concrete need, and record why when the additional context materially expands the initial scope.

| Task | Read first |
|---|---|
| Write or edit article prose or voice | [Editorial Guidelines](docs/editorial-guidelines.md) |
| Create, publish, unpublish, or rename a blog article | [Content Authoring](docs/content-authoring.md) |
| Remove or replace placeholder/test content | [Placeholder/Test Content](docs/content-status.md#placeholdertest-content) and [Replacement Plan](docs/content-status.md#replacement-plan) |
| Change content schema or frontmatter fields | `src/content.config.ts` and [Blog Frontmatter](docs/content-model.md#blog-frontmatter) |
| Change Astro architecture, pages, routes, layouts, components, or rendering | [Architecture](docs/architecture.md) |
| Change styling, tokens, themes, or reusable visual patterns | [Design System Inventory Usage](docs/design-system/agent-guide.md#how-agents-should-use-inventoryjson) and `docs/design-system/inventory.json` |
| Change accessibility or semantic UI behavior | [Accessibility Rules](docs/performance-seo-accessibility.md#accessibility-rules) |
| Change client-side JavaScript, assets, loading, or performance behavior | [Performance Rules](docs/performance-seo-accessibility.md#performance-rules) |
| Change page or post metadata or SEO | [SEO Rules](docs/performance-seo-accessibility.md#seo-rules) |
| Change RSS or sitemap behavior | [Documentation and Sources of Truth](docs/architecture.md#documentation-and-sources-of-truth) |
| Change structured data | [JSON-LD Structured Data](docs/structured-data.md) |
| Change build configuration or Astro integrations | `astro.config.mjs`, [Notable Integrations](docs/architecture.md#notable-integrations), and [Deployment and Build Behavior](docs/change-policy.md#deployment-and-build-behavior) |
| Change static-site deployment or CI | [GitHub Pages Deployment](docs/deployment.md#github-pages-deployment) and `.github/workflows/astro.yml` |
| Change environment variables | [Environment Variables Reference](docs/deployment.md#environment-variables-reference) and `.env.example` |
| Change Contact Worker implementation, deployment, or secrets | `contact-worker/`, [Cloudflare Worker Configuration](docs/deployment.md#cloudflare-worker-configuration), and [Contact Worker Deployment](docs/deployment.md#contact-worker-deployment) |
| Audit, score, update evidence for, or refresh Context Health | [Context Health refresh](.agents/skills/context-health-refresh/SKILL.md) and [Context Health scoring rubric](docs/context-health-rubric.md) |
| Follow implementation or diagnosis workflow | [Standard Development Steps](docs/agent-workflow.md#standard-development-steps) |
| Plan or evaluate change scope | [Change Policy](docs/change-policy.md) |
| Review code or documentation | [Reviewer Checklist](docs/reviewer-checklist.md) |

## Generated Files

These directories are produced during builds and automated processes. Never edit them directly:

`dist/` · `node_modules/` · `.astro/` · `storybook-static/` · `lh-reports/` · `docs/context/` · `.playwright-mcp/`

## Safe Change Workflow

1. Read `AGENTS.md` and relevant docs from `docs/`.
2. Run `git status --short` — preserve existing changes.
3. Inspect related files before editing. State the plan.
4. Make the smallest safe change. No scope creep.
5. Validate with the lightest relevant check (see Validation table).
6. Review `git diff --stat` and `git diff`.
7. Commit with a conventional commit message. No push unless asked.
8. Final response: files changed, validation run, commit hash, skipped checks.

## Protected Files

These files require explicit user approval before editing:

- `AGENTS.md`
- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `astro.config.mjs`
- `biome.json`
- `.env.example`
- files under `docs/`

If a task appears to require changes to a protected file, stop and ask first.

## Skill Routing

For implementation work, always consult [agent-safe-change](.agents/skills/agent-safe-change/SKILL.md). Load other skills only when the task matches their scope:

| Task | Skill |
|---|---|
| Modify Astro pages, layouts, components, routes, or rendered static output | [astro-static-implementation](.agents/skills/astro-static-implementation/SKILL.md) |
| Change dependencies, client JavaScript, images, fonts, embeds, search, analytics, animation, data fetching, interactive UI, resource loading, or bundle/build output | [performance-budget](.agents/skills/performance-budget/SKILL.md) |
| Add, change, or review UI semantics, keyboard behavior, focus, contrast, motion, forms, or navigation | [accessibility](.agents/skills/accessibility/SKILL.md) |
| Change CSS, tokens, spacing, typography, layout, themes, or component appearance | [design-system-css](.agents/skills/design-system-css/SKILL.md) |
| Implement or modify site search | [pagefind-search](.agents/skills/pagefind-search/SKILL.md) |
| Create or edit pages, posts, images, links, structured data, or page metadata | [seo-review](.agents/skills/seo-review/SKILL.md) |
| Audit Context Health, change scores or evidence, or refresh the report | [context-health-refresh](.agents/skills/context-health-refresh/SKILL.md) |

## Storybook

Storybook is the internal component-development lab. It renders native `.astro` components using the same global CSS, design tokens, fonts, and themes as the production site.

- **Framework**: `@storybook-astro/framework` v1.9.0 (supports Astro 5–7) with Storybook 10.5.
- **Config**: `.storybook/main.ts` and `.storybook/preview.ts`.
- **Stories**: colocated (`src/components/Card.stories.ts`) or in `src/stories/foundations/`.
- **Theme**: toolbar toggle sets `data-theme` on the document element (light/dark).
- **Styles**: imports `src/styles/global.css` directly — no duplication.
- **Static dirs**: serves `public/` for fonts and images.
- **Production isolation**: Storybook packages are devDependencies only; `pnpm build` does not include any Storybook runtime code.
- **TypeScript**: `Meta` and `StoryObj` are not re-exported by `@storybook-astro/framework`. Use plain object exports with `export default meta` and `export const StoryName = { args: {...} }`.
- **Deployment**: Storybook is built and deployed as part of the main site at `/design-system/lab/`. The GitHub Actions workflow builds both Astro and Storybook, then copies `storybook-static/` to `dist/design-system/lab/`.
- **Base path**: configured via `viteFinal` in `.storybook/main.ts` to use `/design-system/lab/`.
- **Sitemap**: the component lab URL is included in the sitemap via `customPages` in `astro.config.mjs`.

The public design-system page (`/portfolio/design-system`) remains the curated portfolio presentation. Storybook is the working development tool.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
