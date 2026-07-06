# Eric Carlisle — AstroBlog

Personal blog at https://ericcarlisle.com. Built with Astro as a static site, focused on technical writing about web performance, accessibility, Astro, React, and modern CSS architecture.

## Stack

* **Framework:** Astro 7, static site output
* **Language:** TypeScript
* **Styling:** Vanilla CSS with OKLCH design tokens
* **Package manager:** pnpm
* **Runtime:** Node.js 22.12+
* **Linting / formatting:** Biome
* **Type checking:** `astro check`
* **Search:** Pagefind
* **Analytics:** Google Analytics 4 via Partytown
* **Structured data:** JSON-LD for site, person, and article metadata
* **Content:** MDX blog posts with schema-validated frontmatter

## Project Structure

```txt
.
├── public/
│   ├── favicon assets
│   └── static public images
├── src/
│   ├── assets/
│   │   └── images/              Blog hero images and social images
│   ├── components/              Reusable Astro components
│   ├── content/
│   │   └── blog/                MDX blog posts
│   ├── layouts/
│   │   └── BlogPost.astro       Shared page/article layout
│   ├── lib/                     Content, SEO, and utility helpers
│   ├── pages/                   Astro routes
│   ├── styles/                  Global and component CSS
│   ├── consts.ts                Site-wide constants
│   └── content.config.ts        Content collection schema
├── contact-worker/              Cloudflare Worker for the contact form
├── scripts/                     Build, image, audit, and reporting scripts
├── docs/                        Project notes and supporting documentation
├── astro.config.mjs
├── biome.json
├── package.json
└── pnpm-lock.yaml
```

## Architecture Notes

### Static-first Astro

The site is generated as static HTML. Interactive features are intentionally small and isolated so the default page experience stays fast, crawlable, and resilient.

### Content collections

Blog posts live in `src/content/blog/` and are validated through `src/content.config.ts`. Frontmatter drives titles, descriptions, publication dates, tags, hero images, social metadata, and article behavior.

### Shared layout

`src/layouts/BlogPost.astro` is the primary page layout. It supports article-specific features such as dates, reading time, tags, sharing, webmentions, and structured metadata while also serving non-article pages where appropriate.

### Design system

Global CSS custom properties define typography, spacing, color, surfaces, focus styles, and layout behavior. The site uses vanilla CSS rather than a utility framework.

### SEO and metadata

SEO behavior is handled through Astro components and static generation:

* Canonical URLs
* Open Graph metadata
* Twitter Card metadata
* RSS feed
* Sitemap generation
* JSON-LD structured data
* Article metadata
* Person and website schema

### Accessibility

The site prioritizes semantic HTML, readable typography, keyboard navigation, visible focus states, color contrast, reduced-motion support, and accessible labels for interactive elements.

### Search

Pagefind indexes the static output at build time. Search UI styles are isolated in `src/styles/pagefind.css`.

### Webmentions

Article pages can display webmentions fetched at build time. The presentation layer lives in `src/components/Webmentions.astro`, with fetch and normalization logic in `src/lib/webmentions.ts`.

### Contact form

The contact form frontend lives in the Astro site. Form submission is handled by the Cloudflare Worker in `contact-worker/`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
pnpm lint
pnpm format
pnpm fallow:dead-code
pnpm fallow:audit
pnpm lighthouse:all
pnpm structured-data:report
```

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Run validation before committing:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Run Lighthouse across the site:

```bash
pnpm lighthouse:all
```

Generate a structured data report:

```bash
pnpm structured-data:report
```

## Project Priorities

This project favors:

* Static-first delivery
* Minimal client-side JavaScript
* Strong accessibility defaults
* Clear content modeling
* High Lighthouse scores
* Durable semantic HTML
* Fast, readable pages
* SEO-friendly metadata and structured data
* Maintainable CSS without framework overhead

## Documentation Notes

This README is the repository front door. Deeper implementation details should live in focused documentation files under `docs/` rather than being duplicated here.
