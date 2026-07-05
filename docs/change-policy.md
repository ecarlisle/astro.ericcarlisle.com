# Change Policy

This document defines approval boundaries for AstroBlog changes.

Use this alongside:

```txt
AGENTS.md
docs/agent-workflow.md
docs/reviewer-checklist.md
```

The goal is to keep agent-assisted work safe, focused, and easy to review.

## Default Rule

Prefer the smallest safe change.

Before changing architecture, behavior, dependencies, content schema, routing, deployment, or user-facing design systems, check whether the change requires explicit approval.

## Changes That Require Explicit Approval

### Dependencies

Do not add, remove, or upgrade dependencies without explicit approval.

Before recommending a dependency, explain:

- Why the project needs it
- Why Astro, HTML, CSS, platform APIs, or existing dependencies are insufficient
- Expected impact on performance
- Expected impact on bundle size
- Expected maintenance/security implications

### Client-Side JavaScript

Do not introduce client-side JavaScript unless clearly required and approved when the impact is non-trivial.

Before adding client-side JavaScript, consider:

- HTML
- CSS
- Astro build-time behavior
- Static generation
- Progressive enhancement

If JavaScript is needed:

- Keep it small
- Avoid unnecessary hydration
- Preserve keyboard behavior
- Preserve screen-reader behavior
- Validate performance impact

### Content Schema

Do not change `src/content.config.ts` casually.

Schema changes may affect:

- Existing blog posts
- MDX content
- Listing pages
- RSS
- Sitemap
- Metadata
- Search
- Article templates
- Build/typecheck behavior

Before changing the schema:

- Identify affected fields
- Update related content
- Update docs
- Run relevant checks

### Routes and URLs

Do not change routes, slugs, or URL structure without explicit approval.

Route changes may affect:

- SEO
- Backlinks
- Sitemap output
- RSS links
- Internal links
- Search index behavior
- Portfolio links
- Shared URLs

If a route must change, consider redirects or compatibility behavior.

### Metadata and SEO Structure

Do not change metadata architecture casually.

Be careful with:

- Canonical URLs
- Page titles
- Meta descriptions
- Open Graph metadata
- Structured data
- RSS metadata
- Sitemap behavior
- Internal links

### Deployment and Build Behavior

Do not change deployment, build, adapter, or hosting behavior without explicit approval.

This includes:

- `astro.config.mjs`
- Build scripts
- Preview scripts
- Sitemap/RSS integration behavior
- Cloudflare-related behavior
- Partytown behavior
- Search indexing behavior

### Contact Worker

Do not change contact form worker behavior without explicit approval.

The worker may involve:

- Validation
- Spam protection
- Request/response shape
- Secrets
- Rate limiting
- Email delivery or notification behavior

Treat this as a separate runtime surface.

### Placeholder Content

Do not delete placeholder content unless explicitly asked.

Placeholder posts may validate:

- Layout
- Tags
- Pagination
- Search
- Metadata
- Styling
- RSS
- Sitemap behavior

If removing placeholder content, confirm which validation coverage remains.

### Broad Refactors

Do not perform broad refactors unless explicitly requested.

Examples requiring approval:

- Moving many components
- Renaming core files
- Replacing styling patterns
- Reworking layout architecture
- Rewriting content collection structure
- Introducing new abstraction layers

## Changes Usually Safe Without Additional Approval

These are generally safe when they stay within the user request and project conventions:

- Small accessibility improvements
- Minor semantic HTML improvements
- Small CSS token usage corrections
- Fixing obvious typos
- Updating docs to match existing behavior
- Small bug fixes with validation
- Narrow component cleanup
- Removing unused code only when clearly unused and validated

## Review Expectations

Reviewer should request changes when a diff:

- Adds unnecessary dependencies
- Adds avoidable client-side JavaScript
- Breaks accessibility
- Breaks metadata
- Changes routes unexpectedly
- Edits generated files
- Deletes placeholder content without approval
- Introduces broad refactors
- Fails checks without explanation
- Leaves documentation stale after changing conventions or behavior

Reviewer may approve with notes when:

- The change is correct
- Validation is adequate
- Remaining concerns are small, optional, or future-facing

## Documentation Expectations

When changing architecture, content conventions, scripts, deployment behavior, styling conventions, accessibility patterns, SEO behavior, or agent workflow, update the relevant document in `docs/`.

Prefer updating existing docs before creating new docs.
