# AstroBlog — Eric Carlisle's Personal Site

Astro 7 static site with vanilla CSS (OKLCH tokens), MDX content, pnpm, and Biome. Personal blog, portfolio, and professional presence for Eric Carlisle.

## Quick Start

**Prerequisites:** Node >=22.12.0, pnpm 10.34.4

```bash
git clone <repo>
pnpm install
pnpm dev        # → http://localhost:4321
```

Copy `.env.example` to `.env.local` and fill in required values before running locally.

## Primary Commands

| Command | What |
| ------- | ---- |
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build → `dist/` (includes Pagefind indexing) |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | `astro check` (TS + Astro diagnostics) |
| `pnpm lint` | `biome check .` |
| `pnpm format` | `biome format . --write` |
| `pnpm lighthouse:all` | Full Lighthouse audit across all HTML pages |
| `pnpm structured-data:report` | Build + validate JSON-LD output |
| `pnpm fallow:dead-code` | Dead code analysis |
| `pnpm test:e2e` / `pnpm test:a11y` | Playwright tests |

See [docs/testing.md](docs/testing.md) for when to run each check.

## Project Structure

```
src/              → Pages, content, components, layouts, styles, utilities
contact-worker/   → Cloudflare Worker for contact form (Turnstile + Resend)
docs/             → Reference documentation
.skills/          → Agent playbooks for implementation tasks
```

## Documentation

| Area | Entry Point |
|------|-------------|
| Architecture, routes, layout | [docs/architecture.md](docs/architecture.md) |
| Development and testing | [docs/testing.md](docs/testing.md) |
| Content authoring | [docs/content-model.md](docs/content-model.md), [docs/editorial-guidelines.md](docs/editorial-guidelines.md) |
| Deployment and operations | [docs/deployment.md](docs/deployment.md) |
| Design system | [docs/design-system/](docs/design-system/) |
| Performance, SEO, accessibility | [docs/performance-seo-accessibility.md](docs/performance-seo-accessibility.md) |
| JSON-LD structured data | [docs/structured-data.md](docs/structured-data.md) |
| Change policy and review | [docs/change-policy.md](docs/change-policy.md), [docs/reviewer-checklist.md](docs/reviewer-checklist.md) |
| **Coding agent guidance** | **[AGENTS.md](AGENTS.md)** — workflow, validation, protected files |

## Integrations

| Integration | Purpose |
|-------------|---------|
| Partytown | GA4 analytics offloaded to web worker |
| Pagefind | Static site search at `/search` |
| Sentry + Spotlight | Error tracking (dev overlay via Spotlight) |
| Cloudflare Turnstile | CAPTCHA on contact form |
| Resend | Email delivery for contact form |
| Expressive Code | Syntax-highlighted code blocks |
| Playform Compress | Build output optimization |
| Playwright | Browser-based testing (a11y, routes, SEO) |

Integrations are configured in [astro.config.mjs](astro.config.mjs). Site constants live in [src/consts.ts](src/consts.ts).

## Gotchas

- **Biome** — `noUnusedVariables`, `noUnusedImports`, and `noImportantStyles` are **off** in `biome.json`.
- **Env files** — `.env.production` / `.env.development` are gitignored. Use `.env.example` as template.
- **Vitest** — Installed but not used. No active test runner.
- **Webmentions** — Requires `WEBMENTION_IO_TOKEN` for live data at build time. Without it, mock data is used.
- **Tag pages** (`/tags/[tag]`) — Static routes exist but are empty; filtering is client-side via `TagFilterBar.astro`.
- **OpenCode** — TypeScript LSP is disabled via `opencode.json`.

## Generated directories — never edit directly

`dist/` · `node_modules/` · `.astro/` · `lh-reports/` · `docs/context/` · `.playwright-mcp/`

## Protected files

Do not edit `AGENTS.md`, `README.md`, `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `biome.json`, `.env.example`, or files under `docs/` unless the user explicitly asks.

---

For coding agents: [AGENTS.md](AGENTS.md) governs agent behavior, safe change policy, validation requirements, and repository-specific constraints.
