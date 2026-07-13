# Static-first Astro architecture with minimal client JavaScript

- Status: Accepted
- Date: 2026-07-12 (documenting existing decision)

## Context

The site needs to deliver fast, accessible pages for a personal blog and portfolio. Performance is a core quality attribute. The site does not require real-time interactivity beyond theme toggling, search, analytics, and tag filtering.

## Decision

Use Astro 7 as a static site generator (SSG) with the following constraints:

- Render all pages at build time to static HTML.
- Use a single layout (`BlogPost.astro`) for every page.
- Limit client-side JavaScript to four specific features: theme toggle, Pagefind search, Google Analytics (via Partytown), and tag filtering.
- Use vanilla CSS with CSS custom properties (OKLCH tokens) rather than a utility framework.
- Use local variable fonts rather than remote font services.

## Reasons

- Static output eliminates server runtime concerns and enables simple hosting (GitHub Pages).
- Minimal JavaScript reduces bundle size, improves Core Web Vitals, and lowers complexity.
- A single layout simplifies maintenance and ensures consistent structure.
- Local fonts avoid render-blocking network requests and privacy concerns.

## Tradeoffs

- No server-side rendering means form handling must be delegated to a separate Worker.
- No dynamic routing from a server means all routes must be known at build time.
- Client-side interactivity is limited; features requiring real-time data need Workers or external services.

## Consequences

- All content changes require a rebuild and redeploy.
- Contact form processing is handled by a separate Cloudflare Worker.
- Search is handled by Pagefind's static index rather than a server-side search engine.
- Performance budgets are enforceable because the attack surface for regressions is small.

## Related files and documentation

- `astro.config.mjs` — Site configuration and integrations
- `src/layouts/BlogPost.astro` — Single site layout
- `src/styles/global.css` — Token definitions and theme system
- `docs/architecture.md` — Architecture overview
- `docs/performance-seo-accessibility.md` — Quality standards
