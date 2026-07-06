# AstroBlog — Eric Carlisle's personal site

Astro 7 SSG. Vanilla CSS with OKLCH tokens. MDX. pnpm. Biome 2.5.

---

## Commands

| Command                       | What                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm dev`                    | Dev server at `localhost:4321`                         |
| `pnpm build`                  | Production build → `dist/` including Pagefind indexing |
| `pnpm preview`                | Preview production build                               |
| `pnpm typecheck`              | `astro check` for TypeScript and Astro diagnostics     |
| `pnpm lint`                   | `biome check .`                                        |
| `pnpm format`                 | `biome format . --write`                               |
| `pnpm lighthouse:all`         | Full Lighthouse audit across all HTML pages            |
| `pnpm structured-data:report` | Build and validate JSON-LD output                      |
| `pnpm fallow:dead-code`       | Dead code analysis for unused files and dependencies   |

Use the **lightest** validation that proves a change.

## Architecture nutshell

* **Single layout** — `src/layouts/BlogPost.astro` is used by every page. Article features are gated behind `{pageType === 'article'}`.
* **Content** — MDX lives in `src/content/blog/`. Frontmatter schema lives in `src/content.config.ts` as the single source of truth. `description` maxes at 165 characters. `pubDate` uses `z.coerce.date()`.
* **Styling** — Tokens live in `src/styles/global.css` as OKLCH custom properties. Component-scoped `<style>` blocks are used where appropriate. Shared styles live in `src/styles/components.css`. Feed layout lives in `src/styles/feed.css`. Pagefind overrides live in `src/styles/pagefind.css`.
* **Components** — Astro components live in `src/components/`. Use PascalCase. Path aliases include `@components/`, `@styles/`, `@lib/`, and `@images/`.
* **Client JS** — Minimal by design: Pagefind search, Partytown for GA4, theme toggle, and tag filtering.
* **Analytics** — GA4 runs through Partytown and is offloaded to a web worker. Site constants live in `src/consts.ts`.
* **Contact form** — The contact form uses a separate Cloudflare Worker in `contact-worker/` with Turnstile and Resend.

## Safe Change Policy

For every implementation task:

* Make the smallest change that satisfies the request.
* Inspect relevant files before editing.
* Preserve existing user-facing behavior unless the user explicitly asks to change it.
* Preserve visual appearance unless the user explicitly asks for visual changes.
* Preserve accessibility behavior unless fixing a clear accessibility defect.
* Preserve SEO metadata, structured data, routes, content schema behavior, and generated output unless the task explicitly includes them.
* Do not rewrite unrelated files.
* Do not rename routes, components, props, tokens, scripts, or public APIs unless required.
* Do not remove existing behavior unless explicitly requested.
* Do not add dependencies without clear justification.
* Do not invent missing requirements.
* Ask for clarification only when implementation would otherwise be unsafe or meaningfully ambiguous.
* Run the lightest validation that proves the change.
* Report changed files, verification steps, skipped checks, and tradeoffs.

Stop and report instead of guessing when:

* A requested file or component does not exist.
* The build system behaves differently than expected.
* A dependency conflicts with the project.
* The task would require deleting or replacing unrelated work.
* A change would alter user-facing behavior outside the requested scope.
* A change would alter routes, SEO metadata, structured data, accessibility behavior, or visual design outside the requested scope.
* The code appears generated, vendored, or managed by another tool.

## Gotchas

* **Biome** — `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are **off** in `biome.json`. Dead imports and variables may not be flagged. `!important` is not linted.
* **Env files** — `.env.production` and `.env.development` are **gitignored**. Use `.env.example` as the local template.
* **Webmentions** — Webmention data is fetched at build time. Without live credentials, mock or empty data may be used depending on local configuration.
* **Vitest** — Installed but **not used**. No active test runner is currently wired into the workflow.
* **Tag pages** — `/tags/[tag]` exists as static routes, but filtering is client-side through `TagFilterBar.astro`.
* **Lighthouse CI** — `lighthouserc.js` asserts performance ≥0.95, accessibility ≥0.95, SEO ≥1.0, and best-practices ≥0.95.
* **Lighthouse all** — `pnpm lighthouse:all` builds, serves from a plain static server, and audits every `.html` file in `dist/`.
* **ESLint / Prettier** — Not used. Biome handles linting and formatting.
* **Fallow** — Installed for dead-code analysis and auditing. Not run in CI.
* **OpenCode** — TypeScript LSP is disabled through `opencode.json`.

## Validation table

| Change                                                       | Validate with                               |
| ------------------------------------------------------------ | ------------------------------------------- |
| Schema, components, utilities, TypeScript                    | `pnpm typecheck`                            |
| Styles, rendering, components                                | `pnpm lint`                                 |
| Routes, integrations, RSS, sitemap, Pagefind, build behavior | `pnpm build`                                |
| Performance, SEO, accessibility                              | `pnpm lighthouse:all` when warranted        |
| JSON-LD structured data                                      | `pnpm structured-data:report`               |
| Formatting                                                   | `pnpm format` only when requested or needed |

## Before making significant changes

| If changing…                    | Read first                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Content conventions             | `docs/content-status.md`, `docs/editorial-guidelines.md`                                                        |
| Architecture, routes, layout    | `docs/architecture.md`                                                                                          |
| Styling, tokens, accessibility  | `docs/performance-seo-accessibility.md`, `.skills/design-system-css/SKILL.md`, `.skills/accessibility/SKILL.md` |
| Content schema                  | `src/content.config.ts`, `docs/content-model.md`                                                                |
| Deployment, build, integrations | `docs/deployment.md`, `astro.config.mjs`                                                                        |
| Contact worker                  | `contact-worker/`                                                                                               |
| Agent workflow                  | `docs/agent-workflow.md`, `docs/change-policy.md`, `docs/reviewer-checklist.md`                                 |

## Generated directories and generated files — never edit directly

Directories:

`dist/` · `node_modules/` · `.astro/` · `lh-reports/` · `docs/context/` · `.playwright-mcp/`

Generated structured-data reports:

`data/structured-data/jsonld-report.json` · `data/structured-data/jsonld-report.md`

Regenerate structured-data reports with:

```bash
pnpm structured-data:report
```

## Workflow

1. Read this file and relevant docs or skills.
2. Run `git status --short` and preserve existing user changes.
3. Inspect related files before editing.
4. State the intended change when the task is broad or risky.
5. Make the smallest safe change. No scope creep.
6. Validate with the lightest relevant check.
7. Review `git diff --stat` and `git diff`.
8. Commit with a conventional commit message only when asked or when the task explicitly includes committing.
9. Do not push unless asked.
10. Final response should include files changed, validation run, commit hash if committed, and skipped checks.

## Protected files

Do not edit the following files unless the user explicitly asks for changes to them:

* `AGENTS.md`
* `README.md`
* `package.json`
* `pnpm-lock.yaml`
* `astro.config.mjs`
* `biome.json`
* `.env.example`
* files under `docs/`

If a requested task appears to require changes to one of these files, stop and ask first.

## Skills

Use project-local skills from `.skills/<skill-name>/SKILL.md`.

For implementation work, consult as relevant:

* `.skills/astro-static-implementation/SKILL.md`
* `.skills/code-quality-refactor/SKILL.md`
* `.skills/performance-budget/SKILL.md`

For UI, layout, styling, or interaction work, also consult:

* `.skills/accessibility/SKILL.md`
* `.skills/design-system-css/SKILL.md`

For search work, also consult:

* `.skills/pagefind-search/SKILL.md`

For metadata, content routes, sitemap, robots, canonical URLs, Open Graph, Twitter Cards, or structured data, also consult:

* `.skills/seo-review/SKILL.md`

## Skill usage rule

Skills are task-specific playbooks. Use them when the task matches their scope.

Do not treat skills as permission to expand scope. The Safe Change Policy still applies.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

* For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists.
* Use `graphify path "<A>" "<B>"` for relationships.
* Use `graphify explain "<concept>"` for focused concepts.
* These commands return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
* Dirty `graphify-out/` files are expected after hooks or incremental updates. Dirty graph files are not a reason to skip graphify.
* Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
* If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
* Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
* After modifying code, run `graphify update .` to keep the graph current. This is AST-only and has no API cost.
