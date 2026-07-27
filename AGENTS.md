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

`package.json` is the source of truth for exact scripts. Common checks are `pnpm typecheck`,
`pnpm lint`, and `pnpm build`; see [Testing](docs/testing.md) for the complete validation
reference and when to run each check.

## Architecture

Astro 7 SSG. Single layout (`BlogPost.astro`). MDX content in `src/content/blog/`. Tokens in `src/styles/global.css`. Components in `src/components/`. Minimal client JS (search, analytics, theme toggle, tag filter). Contact form via Cloudflare Worker.

See [docs/architecture.md](docs/architecture.md) for full details.

## Gotchas

- **Biome** — This repository does not use ESLint or Prettier. `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are **off** in `biome.json`.
- **Env files** — `.env.production` / `.env.development` are gitignored. Use `.env.example` as template.

## Validation

| Change | Validate with |
|---|---|
| Schema, components, utilities, TypeScript | `pnpm typecheck` |
| Styles, rendering, components | `pnpm lint` |
| Routes, integrations, RSS, sitemap, Pagefind, build | `pnpm build` |
| Performance, SEO, a11y | `pnpm lighthouse:all` (when warranted) |
| JSON-LD structured data | `pnpm structured-data:report` |
| Agent documentation and routing | `pnpm validate:agent-docs` |
| Formatting | `pnpm format` (only when requested) |

See [docs/testing.md](docs/testing.md) for detailed guidance.

## Task-Specific Context Routing

For implementation, diagnosis, planning, and code or documentation review, identify the relevant
task rows before loading supporting documentation. Read only those rows by default. Load another
row only when investigation reveals a concrete need, and record why when it materially expands the
initial scope. Never omit a required source to reduce context size or improve a Context Health score.

When a task references a feature, plan, specification, or prior implementation decision, inspect
filenames under `specs/` and read only the matching specification. Do not load the directory as a
corpus. Use the standard development steps when workflow guidance is also needed.

| Task | Read first |
|---|---|
| Write or edit article prose or voice | [Editorial Guidelines](docs/editorial-guidelines.md) |
| Create, publish, unpublish, or rename a blog article | [Content Authoring](docs/content-authoring.md) |
| Remove or replace placeholder/test content | [Placeholder/Test Content](docs/content-status.md#placeholdertest-content) and [Replacement Plan](docs/content-status.md#replacement-plan) |
| Change content schema or frontmatter fields | `src/content.config.ts` and [Blog Frontmatter](docs/content-model.md#blog-frontmatter) |
| Change Astro architecture, pages, routes, layouts, components, or rendering | [Architecture](docs/architecture.md) |
| Change styling, tokens, themes, or reusable visual patterns | [Design System Inventory Usage](docs/design-system/agent-guide.md#how-agents-should-use-inventoryjson); query only matching entries in `docs/design-system/inventory.json` |
| Change accessibility or semantic UI behavior | [Accessibility Rules](docs/performance-seo-accessibility.md#accessibility-rules) |
| Change client-side JavaScript, assets, loading, or performance behavior | [Performance Rules](docs/performance-seo-accessibility.md#performance-rules) |
| Change page or post metadata or SEO | [SEO Rules](docs/performance-seo-accessibility.md#seo-rules) |
| Change RSS or sitemap behavior | [Documentation and Sources of Truth](docs/architecture.md#documentation-and-sources-of-truth) |
| Change structured data | [JSON-LD Structured Data](docs/structured-data.md) |
| Change build configuration or Astro integrations | `astro.config.mjs`, [Notable Integrations](docs/architecture.md#notable-integrations), and [Deployment and Build Behavior](docs/change-policy.md#deployment-and-build-behavior) |
| Change static-site deployment or CI | [GitHub Pages Deployment](docs/deployment.md#github-pages-deployment) and `.github/workflows/astro.yml` |
| Change environment variables | [Environment Variables Reference](docs/deployment.md#environment-variables-reference) and `.env.example` |
| Change Contact Worker implementation, deployment, or secrets | `contact-worker/` and [Contact Worker Deployment](docs/deployment.md#contact-worker-deployment) |
| Create or review Storybook stories or the component lab | [Storybook](docs/testing.md#storybook), `.storybook/`, and the applicable UI skills |
| Audit, score, update evidence for, or refresh Context Health | [Context Health refresh](.agents/skills/context-health-refresh/SKILL.md) and [Context Health scoring rubric](docs/context-health-rubric.md) |
| Follow implementation or diagnosis workflow | [Standard Development Steps](docs/agent-workflow.md#standard-development-steps) |
| Plan or evaluate change scope | [Change Policy](docs/change-policy.md) |
| Review code or documentation | [Reviewer Checklist](docs/reviewer-checklist.md) |

## Generated Files

These directories are produced during builds and automated processes. Never edit them directly:

`dist/` · `node_modules/` · `.astro/` · `storybook-static/` · `lh-reports/` · `docs/context/` · `.playwright-mcp/`

## Safe Change Workflow

Use [agent-safe-change](.agents/skills/agent-safe-change/SKILL.md) for the full procedure. Always
inspect the working tree, preserve unrelated user changes, make the smallest scoped change, run
proportionate validation, and review the final diff. Commit or push only when the user authorizes it.

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
| Draft or substantially revise explanatory prose | [copy-edit](.agents/skills/copy-edit/SKILL.md) |
| Audit Context Health, change scores or evidence, or refresh the report | [context-health-refresh](.agents/skills/context-health-refresh/SKILL.md) |

## Storybook

Storybook is the internal component-development lab at `/design-system/lab/`; the public
design-system page remains the curated portfolio presentation. See
[Storybook](docs/testing.md#storybook) for source locations, commands, deployment, and isolation.

## graphify

When the user types `/graphify`, use the installed Graphify skill or instructions before doing
anything else. When `graphify-out/graph.json` exists, follow those instructions for codebase
questions and graph refreshes; detailed command selection belongs to Graphify.
