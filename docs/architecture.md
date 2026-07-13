# Architecture

This is an Astro 7 static site.

## Core Areas

- `src/pages/` contains route-level pages.
- `src/content/blog/` contains Markdown and MDX blog posts.
- `src/content.config.ts` defines the blog frontmatter schema.
- `src/layouts/BlogPost.astro` renders blog articles and shared content pages.
- `src/components/` contains reusable Astro components.
- `src/styles/` contains global styles, component helpers, feed styles, and Pagefind overrides.
- `src/lib/` contains utility logic.
- `src/assets/images/` contains source images processed by Astro.
- `public/` contains static assets copied directly to the build.
- `contact-worker/` contains the Cloudflare Worker for contact form handling.
- `scripts/` contains project automation scripts.

## Generated Areas

These directories are produced during builds and automated processes. Changes made inside them will be overwritten:

- `dist/` — Production build output
- `node_modules/` — Package dependencies
- `lh-reports/` — Lighthouse audit reports
- `docs/context/` — Generated project context files

## Notable Integrations

- MDX for blog content
- RSS generation
- Sitemap generation
- Pagefind search
- Partytown for analytics isolation
- Expressive Code for code blocks
- Playform Compress for build output optimization
- GitHub Actions for CI/CD and deployment to GitHub Pages
- Cloudflare Workers for contact form handling
- Cloudflare Turnstile for CAPTCHA verification
- Resend for transactional email delivery
- Sentry for error tracking
- Google Analytics (GA4) for traffic analytics

## Documentation and Sources of Truth

Major project topics, where to learn about them, and where the exact source of truth lives.

| Topic | Human documentation | Source of truth |
|-------|--------------------|----------------|
| Package commands | [README.md](../README.md), [testing.md](testing.md) | `package.json` scripts |
| Content schema | [content-model.md](content-model.md), [content-authoring.md](content-authoring.md) | `src/content.config.ts` |
| Content files and publication behavior | [content-authoring.md](content-authoring.md) | `src/content/blog/`, `src/lib/blog-utils.ts` |
| Routes | [architecture.md](architecture.md) | `src/pages/` |
| Layouts | [architecture.md](architecture.md) | `src/layouts/` |
| Reusable components | [architecture.md](architecture.md), [design-system/agent-guide.md](design-system/agent-guide.md) | `src/components/` |
| Design tokens | [performance-seo-accessibility.md](performance-seo-accessibility.md) | `src/styles/global.css` |
| Shared component styles | [design-system/inventory.json](design-system/inventory.json) | `src/styles/components.css` and per-component styles |
| Design-system inventory | [design-system/agent-guide.md](design-system/agent-guide.md) | `design-system/inventory.json` |
| Structured data | [structured-data.md](structured-data.md) | `src/components/SchemaOrg.astro`, `src/components/BaseHead.astro` |
| RSS | [architecture.md](architecture.md) | `src/pages/rss.xml.js` |
| Sitemap | [deployment.md](deployment.md) | `@astrojs/sitemap` in `astro.config.mjs` |
| Pagefind search | [architecture.md](architecture.md) | `astro-pagefind` in `astro.config.mjs`, `src/pages/search/` |
| Analytics | [deployment.md](deployment.md) | `src/components/GoogleAnalytics.astro`, `GA_MEASUREMENT_ID` in `src/consts.ts` |
| CI/CD | [deployment.md](deployment.md) | `.github/workflows/astro.yml` |
| Frontend environment variables | [deployment.md](deployment.md) | `.env.local`, `.env.development`, `.env.production` |
| Cloudflare Worker (contact form) | [deployment.md](deployment.md) | `contact-worker/` directory |

## Architectural Decisions

Key design decisions that shape the repository:

- [Static-first Astro architecture](decisions/001-static-first-astro-architecture.md) — All pages render at build time; client JavaScript limited to four features (theme, search, analytics, tag filter).
- [Separate Cloudflare Worker for contact form](decisions/002-separate-cloudflare-worker-for-contact-form.md) — Form processing runs independently with its own deployment cycle, secrets, and CAPTCHA verification.
- [Pagefind for static search](decisions/003-pagefind-for-static-site-search.md) — Client-side search generated at build time from static HTML; no server-side search infrastructure.
- [Connected Schema.org graph](decisions/004-connected-schema-org-graph-for-structured-data.md) — JSON-LD structured data uses connected entity references across page types.
