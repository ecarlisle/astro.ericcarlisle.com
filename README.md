# AstroBlog — Eric Carlisle's Personal Site

Astro 7 static site with vanilla CSS (OKLCH tokens), MDX content, pnpm, and Biome. Personal blog, portfolio, and professional presence for Eric Carlisle.

## Quick Start

**Prerequisites:** Node >=22.19.0, pnpm 10.34.4

```bash
git clone <repo>
pnpm install
cp .env.example .env.local   # then fill in values; see docs/deployment-environment.md
pnpm dev                     # → http://localhost:4321
```

Every validation and maintenance command is in [docs/testing.md](docs/testing.md).

## Project Structure

```
src/              → Pages, content, components, layouts, styles, utilities
contact-worker/   → Cloudflare Worker for the contact form (Turnstile + Resend)
docs/             → Documentation for humans and agents
specs/            → Single-use change specifications
.agents/skills/   → Shared agent skills
```

Full structure and integrations: [docs/architecture.md](docs/architecture.md).

## Documentation

Each doc opens with a **Use when** line and owns its facts; others link to it. How to write docs
here: [docs/documentation.md](docs/documentation.md).

| Area | Entry Point |
|------|-------------|
| Architecture, routes, integrations, sources of truth | [docs/architecture.md](docs/architecture.md) |
| Validation and testing | [docs/testing.md](docs/testing.md) |
| Content | [docs/content-authoring.md](docs/content-authoring.md) (workflow), [docs/content-model.md](docs/content-model.md) (schema), [docs/editorial-guidelines.md](docs/editorial-guidelines.md) (voice) |
| Deployment | [static site](docs/deployment-static-site.md), [environment variables](docs/deployment-environment.md), [contact Worker](docs/deployment-contact-worker.md) |
| Operations | [site inventory and SEO gate](docs/site-inventory.md), [analytics and monitoring](docs/analytics-and-monitoring.md) |
| Design system | [docs/design-system/README.md](docs/design-system/README.md) |
| Performance, SEO, accessibility | [docs/performance-seo-accessibility.md](docs/performance-seo-accessibility.md) |
| JSON-LD structured data | [docs/structured-data.md](docs/structured-data.md) |
| Change policy and review | [docs/change-policy.md](docs/change-policy.md), [docs/reviewer-checklist.md](docs/reviewer-checklist.md) |
| **Coding agents** | **[AGENTS.md](AGENTS.md)**: principles, protected files, and task routing |

## Agent compatibility shims

Instructions live once, in [AGENTS.md](AGENTS.md). Tools that expect their own file get a thin
pointer, never a copy.

| Agent | Reads | Shim |
|---|---|---|
| Claude Code | `CLAUDE.md` | `CLAUDE.md` is a symlink to `AGENTS.md` |
| Codex, Cursor, OpenCode, Pi | `AGENTS.md` natively | None |
| Gemini CLI | `context.fileName` | [.gemini/settings.json](.gemini/settings.json) points to `AGENTS.md` |
| GitHub Copilot | `AGENTS.md` on agent surfaces; `.github/copilot-instructions.md` on chat surfaces | [.github/copilot-instructions.md](.github/copilot-instructions.md) points to `AGENTS.md` |

## Shared skills directory

Skills live once, under `.agents/skills/`. Tool-specific skill directories are symlinks to it:

```
.claude/skills -> ../.agents/skills
.codex/skills  -> ../.agents/skills
```

When adding a tool that reads skills from its own directory, symlink that directory. Do not copy
files into it.

---

Coding agents should read [AGENTS.md](AGENTS.md) before modifying the repository.
