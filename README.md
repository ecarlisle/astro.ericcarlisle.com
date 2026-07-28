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
| `pnpm typecheck` | `astro check` (TS + Astro diagnostics) |
| `pnpm lint` | `biome check .` |
| `pnpm test:e2e` | Full Playwright suite |

See [docs/testing.md](docs/testing.md) for all validation and maintenance commands.

## Project Structure

```
src/              → Pages, content, components, layouts, styles, utilities
contact-worker/   → Cloudflare Worker for contact form (Turnstile + Resend)
docs/             → Reference documentation
.agents/skills/   → Task-specific implementation guides
```

## Documentation

| Area | Entry Point |
|------|-------------|
| Architecture, routes, layout | [docs/architecture.md](docs/architecture.md) |
| Development and testing | [docs/testing.md](docs/testing.md) |
| Content authoring | [docs/content-authoring.md](docs/content-authoring.md) (workflow), [docs/content-model.md](docs/content-model.md) (schema), [docs/editorial-guidelines.md](docs/editorial-guidelines.md) (voice) |
| Deployment and operations | [docs/deployment.md](docs/deployment.md) |
| Design system | [docs/design-system/README.md](docs/design-system/README.md) |
| Performance, SEO, accessibility | [docs/performance-seo-accessibility.md](docs/performance-seo-accessibility.md) |
| JSON-LD structured data | [docs/structured-data.md](docs/structured-data.md) |
| Change policy and review | [docs/change-policy.md](docs/change-policy.md), [docs/reviewer-checklist.md](docs/reviewer-checklist.md) |
| **Coding agents** | **[AGENTS.md](AGENTS.md)** — behavioral rules, validation, and safe-change workflow |

## Integrations

| Integration | Purpose |
|-------------|---------|
| Partytown | GA4 analytics offloaded to web worker |
| Pagefind | Static site search at `/search` |
| Sentry | Error tracking (currently unconfigured) |
| Cloudflare Turnstile | CAPTCHA on contact form |
| Resend | Email delivery for contact form |
| Expressive Code | Syntax-highlighted code blocks |
| Playform Compress | Build output optimization |
| Playwright | Browser-based testing (a11y, routes, SEO) |

Integrations are configured in [astro.config.mjs](astro.config.mjs). Site constants live in [src/consts.ts](src/consts.ts).

---

Coding agents should read [AGENTS.md](AGENTS.md) before modifying the repository.
