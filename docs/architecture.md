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
