# AGENTS.md

AstroBlog is Eric Carlisle's Astro 7 static site. This file routes coding agents to the one doc or skill that owns each task. [README.md](README.md) is the human overview. `package.json`, `src/`, and config files are the source of truth for exact behavior.

## Working principles

- Load only the routing rows that match the task. Load more only when investigation shows a concrete need, and say why. Never skip a required source to save context.
- If a task references a feature, plan, or prior decision, read only the matching file in `specs/`.
- For all implementation work, follow [agent-safe-change](.agents/skills/agent-safe-change/SKILL.md) and [engineering-preferences](.agents/skills/engineering-preferences/SKILL.md). Apply engineering preferences only where repository guidance is silent.
- Make the smallest scoped change, preserve unrelated user changes, and run the checks in [Testing](docs/testing.md#when-to-run-each-check).
- Never edit [generated directories](docs/architecture.md#generated-areas).
- Commit or push only when the user authorizes it. Open pull requests ready for review so automated reviewers such as CodeRabbit run. Use a draft only when the owner asks for one or the work is not ready.
- Each fact has one owning doc. Link to it instead of restating it, and update it when the fact changes.

## Protected files

Get explicit user approval before editing `AGENTS.md`, `README.md`, `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `biome.json`, `.env.example`, or any file under `docs/`. If a task needs one, stop and ask first.

## Task routing

| Task | Read first |
|---|---|
| Write or edit any doc, or configure agent tools | [Writing Documentation](docs/documentation.md) |
| Follow the implementation or diagnosis workflow | [Standard Development Steps](docs/agent-workflow.md#standard-development-steps) |
| Plan or evaluate change scope | [Change Policy](docs/change-policy.md) |
| Review code or documentation | [Reviewer Checklist](docs/reviewer-checklist.md) |
| `/graphify`, or broad codebase, architecture, or file-relationship questions | [Graphify](docs/graphify.md) |
| Change pages, routes, layouts, components, or rendering | [Architecture](docs/architecture.md) |
| Change build configuration or Astro integrations | `astro.config.mjs`, [Notable Integrations](docs/architecture.md#notable-integrations), and [Change Policy](docs/change-policy.md#changes-that-need-care) |
| Change styling, tokens, themes, or reusable visual patterns | [Design System Inventory Usage](docs/design-system/agent-guide.md#how-agents-should-use-inventoryjson); query only matching entries in `docs/design-system/inventory.json` |
| Add or change UI icons | [Icon Workflow](docs/design-system/icons.md) |
| Generate or update the Figma companion file | [Figma Brief](docs/design-system/figma-agent-brief.md) |
| Create or review Storybook stories or the component lab | [Storybook](docs/testing.md#storybook), `.storybook/`, and the applicable UI skills |
| Change accessibility or semantic UI behavior | [Accessibility Rules](docs/performance-seo-accessibility.md#accessibility-rules) |
| Change client-side JavaScript, assets, loading, or performance | [Performance Rules](docs/performance-seo-accessibility.md#performance-rules) |
| Change page or post metadata or SEO | [SEO Rules](docs/performance-seo-accessibility.md#seo-rules) |
| Change RSS, sitemap, indexing, Site Inventory, or the SEO gate | [Site Inventory and SEO Gate](docs/site-inventory.md) and `src/pages/rss.xml.js` |
| Change structured data | [JSON-LD Structured Data](docs/structured-data.md) and [Author Profile](docs/author_profile.md) |
| Change static-site deployment or CI | [Static Site Deployment](docs/deployment-static-site.md) and `.github/workflows/astro.yml` |
| Change environment variables or secrets | [Environment Variables](docs/deployment-environment.md) and `.env.example` |
| Change Contact Worker implementation, deployment, or secrets | `contact-worker/` and [Contact Worker](docs/deployment-contact-worker.md) |
| Change analytics, Sentry, or webmentions | [Analytics and Monitoring](docs/analytics-and-monitoring.md) |
| Write or edit article prose or voice | [Editorial Guidelines](docs/editorial-guidelines.md) and [Voice Profile](.agents/voice/profile.md) |
| Analyze voice evidence or update the voice profile | [Analyze Writing Voice](.agents/skills/analyze-writing-voice/SKILL.md) and [Voice Evidence Ledger](.agents/voice/evidence.md) |
| Create, publish, unpublish, or rename a blog article | [Content Authoring](docs/content-authoring.md) |
| Change content schema or frontmatter fields | `src/content.config.ts` and [Blog Frontmatter](docs/content-model.md#blog-frontmatter) |
| Remove or replace placeholder/test content | [Placeholder/Test Content](docs/content-status.md#placeholdertest-content) and [Replacement Plan](docs/content-status.md#replacement-plan) |
| Make product or launch-readiness decisions | [Project Overview](docs/project-overview.md) and [Launch Checklist](docs/todo.md) |
| Audit, score, update evidence for, or refresh Context Health | [Context Health refresh](.agents/skills/context-health-refresh/SKILL.md) and [Context Health scoring rubric](docs/context-health-rubric.md) |

## Skill routing

Load a skill only when the task matches its scope.

| Task | Skill |
|---|---|
| Implement or review code, resolve Git divergence, write TypeScript, handle errors, or add tests | [engineering-preferences](.agents/skills/engineering-preferences/SKILL.md) |
| Modify Astro pages, layouts, components, routes, or rendered static output | [astro-static-implementation](.agents/skills/astro-static-implementation/SKILL.md) |
| Change dependencies, client JavaScript, images, fonts, embeds, search, analytics, animation, data fetching, interactive UI, resource loading, or bundle/build output | [performance-budget](.agents/skills/performance-budget/SKILL.md) |
| Add, change, or review UI semantics, keyboard behavior, focus, contrast, motion, forms, or navigation | [accessibility](.agents/skills/accessibility/SKILL.md) |
| Change CSS, tokens, spacing, typography, layout, themes, or component appearance | [design-system-css](.agents/skills/design-system-css/SKILL.md) |
| Implement or modify site search | [pagefind-search](.agents/skills/pagefind-search/SKILL.md) |
| Create or edit pages, posts, images, links, structured data, or page metadata | [seo-review](.agents/skills/seo-review/SKILL.md) |
| Draft, continue, rewrite, copy-edit, or review prose in the established voice (includes capturing voice evidence) | [write-in-a-voice](.agents/skills/write-in-a-voice/SKILL.md) |
| Analyze writing or speaking style, record voice evidence, or update the voice profile | [analyze-writing-voice](.agents/skills/analyze-writing-voice/SKILL.md) |
| Audit Context Health, change scores or evidence, or refresh the report | [context-health-refresh](.agents/skills/context-health-refresh/SKILL.md) |
