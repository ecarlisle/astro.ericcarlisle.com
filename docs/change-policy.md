# Change Policy

**Use when:** Planning a change, judging its scope, or deciding whether it needs discussion first.

The project favors small, static-first, accessibility-aware changes. Changes to architecture,
dependencies, the content schema, routing, or deployment get deliberate review because they ripple
across the site. Review criteria are in the [Reviewer Checklist](reviewer-checklist.md).

## Changes that need care

| Area | Before changing, confirm |
|---|---|
| Dependencies | Astro, HTML, CSS, platform APIs, or existing dependencies cannot do the job. Weigh bundle size, maintenance, and security. Upgrades and removals need the same care. |
| Client-side JavaScript | HTML, CSS, or build-time Astro is not enough, and progressive enhancement works. Keyboard, screen-reader, and performance impact are acceptable. Current client JavaScript covers search, analytics, theme toggle, and tag filter only. |
| Content schema (`src/content.config.ts`) | You have identified every affected field and consumer (posts, listings, RSS, sitemap, metadata, search, templates), updated existing content, and kept docs in sync. |
| Routes and URLs | Redirects preserve existing references (SEO, backlinks, RSS, search indexes, shared URLs). |
| Metadata and SEO | Canonicals, titles, descriptions, Open Graph, structured data, RSS, and sitemap changes are deliberate. |
| Build and deployment | Changes to `astro.config.mjs`, build scripts, RSS or sitemap integration, Cloudflare behavior, Partytown, or search indexing pass a full `pnpm build`. |
| Contact Worker | `contact-worker/` is a separate runtime with its own validation, spam protection, rate limiting, secrets, and email delivery. Treat it with the same care as the site. |
| Placeholder content | You know which test coverage the post provides; see [Content Status](content-status.md). |
| Broad refactors | Moving many components, renaming core files, replacing styling patterns, reworking layout or content collections, or adding abstraction layers needs discussion first. |

## Usually safe without coordination

These are fine when they stay within project conventions:

- Small accessibility, semantic HTML, or CSS-token fixes
- Typo fixes and docs that match existing behavior
- Small, targeted bug fixes and narrow component cleanup
- Removing code that is clearly unused and validated

## Keep docs current

When architecture, content conventions, scripts, deployment, styling, accessibility, or SEO behavior
changes, update the one doc that owns that fact. Prefer editing an existing doc to creating a new
one.
