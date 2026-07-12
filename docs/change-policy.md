# Change Policy

This document describes how changes to AstroBlog are evaluated and reviewed. It covers areas that require particular care and the kinds of changes that are generally safe to make without separate coordination.

The project follows a small-change, static-first, accessibility-aware approach. Changes that affect architecture, dependencies, content schema, routing, or deployment deserve deliberate review because they can ripple across many parts of the site.

Related documents: [AGENTS.md](../AGENTS.md) (agent change workflow), [reviewer-checklist.md](reviewer-checklist.md) (review criteria).

## Dependencies

The project keeps dependencies minimal. Before adding a new one, consider:

- Whether Astro, HTML, CSS, platform APIs, or existing dependencies can handle the need
- Performance and bundle-size impact
- Ongoing maintenance and security implications

Removing or upgrading existing dependencies carries similar considerations.

## Client-Side JavaScript

The site is static-first. Client-side JavaScript is used only where interaction requires it — search, analytics, theme toggle, tag filtering. Before adding more, consider:

- Whether HTML, CSS, or Astro build-time behavior is sufficient
- Whether progressive enhancement can deliver the feature
- Impact on keyboard and screen-reader behavior
- Performance implications

## Content Schema

The content schema in `src/content.config.ts` affects existing posts, listing pages, RSS, sitemap, metadata, search, article templates, and build behavior. Schema changes should:

- Identify all affected fields and downstream consumers
- Update existing content as needed
- Keep documentation in sync
- Run relevant validation checks

## Routes and URLs

Route changes can affect SEO, backlinks, RSS, internal links, search indexes, and shared URLs. When a route must change, consider redirects or compatibility behavior to preserve existing references.

## Metadata and SEO Structure

Metadata elements — canonical URLs, page titles, meta descriptions, Open Graph tags, structured data, RSS metadata, and sitemap entries — should be updated deliberately. They affect search indexing and social sharing.

## Deployment and Build Behavior

Build configuration, preview scripts, adapter settings, and hosting behavior are established and tested. Changes to `astro.config.mjs`, build scripts, sitemap or RSS integration, Cloudflare-related behavior, Partytown, or search indexing should be validated with a full build.

## Contact Worker

The Cloudflare Worker in `contact-worker/` handles validation, spam protection, rate limiting, secrets, and email delivery. It is a separate runtime surface and should be treated with the same care as the main site.

## Placeholder Content

Several blog posts exist as placeholder or test content. They validate layout, tags, pagination, search, metadata, styling, RSS, and sitemap behavior. Before removing placeholder content, confirm which validation coverage remains.

## Broad Refactors

Refactors that move many components, rename core files, replace styling patterns, rework layout architecture, rewrite content collection structure, or introduce new abstraction layers benefit from discussion before implementation.

## Changes Generally Safe Without Separate Coordination

These kinds of changes are usually straightforward when they stay within project conventions:

- Small accessibility improvements
- Minor semantic HTML improvements
- Small CSS token usage corrections
- Fixing typos
- Updating docs to match existing behavior
- Small targeted bug fixes
- Narrow component cleanup
- Removing unused code (when clearly unused and validated)

## Review Process

Reviewers look for:

- Unnecessary dependencies or client-side JavaScript
- Accessibility, metadata, or route changes that weren't accounted for
- Edits to generated files or deletion of placeholder content without coordination
- Broad refactors introduced without discussion
- Checks skipped or failing without explanation
- Documentation left stale after changing conventions or behavior

When changing architecture, content conventions, scripts, deployment behavior, styling conventions, accessibility patterns, or SEO behavior, update the relevant document in `docs/`. Prefer updating existing docs before creating new ones.
