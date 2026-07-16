# Project Organization and Development Workflow

This document explains how the AstroBlog repository is organized and provides a development workflow reference for human contributors.

For coding-agent behavioral rules, see [AGENTS.md](../AGENTS.md).

## Top-level files

- `AGENTS.md` — Coding-agent behavioral rules, validation, and safe-change workflow (agent-specific).
- `package.json` — Project scripts, dependencies, and package manager configuration.
- `biome.json` — Biome formatter and linter configuration.
- `astro.config.mjs` — Astro site configuration.
- `.env.example` — Environment variable template for local development.

## Directory structure

### `.agents/skills/`

Reusable task-specific implementation guides. Each skill lives in its own directory (`.agents/skills/<name>/SKILL.md`) and includes YAML frontmatter so tools can load relevant skills based on context.

Examples: accessibility review, performance budget, design-system work, portfolio review, Figma handoff.

### `docs/`

Human-readable project documentation.

- `docs/development/` — Development workflow, testing, architecture, and project organization.
- `docs/design-system/` — Design-system documentation, including the Figma agent brief.
- Other docs cover content conventions, change policy, deployment, SEO/accessibility, and project status.

See the [documentation index](../README.md#documentation) for a complete map.

### `specs/`

Concrete feature and change specifications. Each spec describes one planned change, including requirements, constraints, acceptance criteria, and validation. Use `specs/_template.md` as a starting point. Specs are single-use plans, not reusable guides.

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

Project-specific tool settings, extensions, commands, and prompt templates.

- `.pi/settings.json` — Extension and skill paths.
- `.pi/extensions/` — Project-local extensions.
- `.pi/prompts/` — Reusable prompt templates.

### `contact-worker/`

Cloudflare Worker for handling contact form submissions. Deploys independently from the main site.

See [deployment.md](../deployment.md#contact-worker-deployment) for details.

## Development Steps

1. Check `specs/` for any relevant change specifications.
2. Read the docs that apply to the change area.
3. Inspect source files before editing.
4. Make the smallest safe change.
5. Preserve performance, accessibility, SEO, and minimal JavaScript.
6. Run the relevant checks.
7. Update docs or specs when project behavior or conventions change.

## Validation Commands

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | TypeScript and Astro diagnostics |
| `pnpm lint` | Biome lint and format checks |
| `pnpm build` | Production build, including Pagefind indexing |
| `pnpm preview` | Preview the production build locally |
| `pnpm lighthouse:all` | Full Lighthouse audit across all pages |
| `pnpm structured-data:report` | Build + validate JSON-LD output |
| `pnpm fallow:dead-code` | Dead code analysis |

See [testing.md](../testing.md) for when to run each check.

## Generated Files

The build process produces output in several directories. These are regenerated on each build and should not be edited directly:

- `dist/` — Production build output
- `node_modules/` — Package dependencies
- `lh-reports/` — Lighthouse audit reports
- `docs/context/` — Generated project context files
- `.astro/` — Astro build cache
