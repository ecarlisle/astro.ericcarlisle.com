# Agent Workflow and Project Organization

This document explains how the AstroBlog repository is organized for agentic work.

## Top-level files

- `AGENTS.md` — General rules for all agents working in this repo. Read this first.
- `package.json` — Project scripts, dependencies, and package manager configuration.
- `biome.json` — Biome formatter and linter configuration.
- `astro.config.mjs` — Astro site configuration.

## Directory structure

### `.skills/`

Reusable task-specific agent instructions.

- Each skill lives in its own directory: `.skills/<name>/SKILL.md`.
- Skills include YAML frontmatter (`name`, `slug`, `description`, `category`, `applies_to`, `triggers`, `priority`, `version`) so agents can load relevant skills based on context.
- Examples: accessibility review, performance budget, design-system work, portfolio review, Figma handoff.

Agents should consult `.skills/` before starting implementation work.

### `docs/`

Human-readable project documentation.

- `docs/development/` — Development workflow, testing, architecture, and agent guidance.
- `docs/design-system/` — Design-system documentation, including the Figma agent brief.
- Other docs cover content conventions, change policy, deployment, SEO/accessibility, and project status.

Docs are long-term reference material, not one-time change plans.

### `specs/`

Concrete feature and change specifications.

- Each spec describes one planned change, including requirements, constraints, acceptance criteria, and validation.
- Use `specs/_template.md` as a starting point.
- Specs are not reusable skills; they are single-use plans.

Agents should read `specs/` before implementing any change that has a spec.

### `src/`

Application source code.

- `src/components/` — Astro components.
- `src/layouts/` — Page layouts.
- `src/pages/` — Route-level pages.
- `src/content/` — Blog post content (Markdown/MDX).
- `src/styles/` — Global CSS, component styles, and third-party overrides.
- `src/lib/` — Utility logic.

### `scripts/`

Project automation scripts.

- `scripts/lighthouse-all.mjs` — Run Lighthouse across all built pages.
- `scripts/jsonld-report.mjs` — Validate JSON-LD structured data output.

### `.pi/`

Pi-specific settings, extensions, commands, and local agent workflow helpers.

- `.pi/settings.json` — Extension and skill paths.
- `.pi/extensions/` — Project-local Pi extensions.
- `.pi/prompts/` — Reusable prompt templates.

## Typical agent workflow

1. Read `AGENTS.md`.
2. Check `specs/` for any relevant change specifications.
3. Load relevant `.skills/` files based on the task.
4. Read the docs that apply to the change area.
5. Inspect source files before editing.
6. Make the smallest safe change.
7. Preserve performance, accessibility, SEO, and minimal JavaScript.
8. Run the relevant checks.
9. Update docs or specs when project behavior or conventions change.

## Validation commands

Use these commands during development:

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | TypeScript and Astro diagnostics |
| `pnpm lint` | Biome lint and format checks |
| `pnpm build` | Production build, including Pagefind indexing |
| `pnpm preview` | Preview the production build locally |
| `pnpm lighthouse:all` | Full Lighthouse audit across all pages |
| `pnpm structured-data:report` | Build + validate JSON-LD output |
| `pnpm fallow:dead-code` | Dead code analysis |

Run only the checks relevant to the change when time or environment limits apply.

## Generated files

Do not edit generated output unless explicitly asked.

Avoid:

- `dist/`
- `node_modules/`
- `lh-reports/`
- `docs/context/`
- `.astro/`
