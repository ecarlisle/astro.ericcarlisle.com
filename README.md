Eric Carlisle — AstroBlog
==========================

Personal blog at https://ericcarlisle.com. Built with Astro 7 static site
generation. Technical deep-dives on web performance, accessibility, React,
and modern CSS architecture.


Stack
-----

Framework:  Astro 7 (SSG, output: "static")
Language:   TypeScript 6.0
Styling:    Vanilla CSS with OKLCH design tokens — no Tailwind
Package:    pnpm (>=22.12.0 Node)
Linting:    Biome 2.5 (single quotes, trailing commas, semicolons)
Analysis:   fallow (dead code, complexity, plugin)
Typecheck:  astro check (via @astrojs/check)
Testing:    Vitest installed, not used


Project Structure
-----------------

src/
  content/
    blog/             .mdx posts, 20+ articles
    [content.config.ts](src/content.config.ts)  Zod schema for frontmatter validation
  [components/](src/components/)       14 Astro components (reusable UI)
  [layouts/](src/layouts/)
    [BlogPost.astro](src/layouts/BlogPost.astro)   Single shared layout (articles, about, style-guide)
  lib/
    [blog-utils.ts](src/lib/blog-utils.ts)     Tag taxonomy, post sorting
    [word-count.ts](src/lib/word-count.ts)     Word-count utilities (extracted from blog-utils)
    [webmentions.ts](src/lib/webmentions.ts)   Webmention.io client
  [pages/](src/pages/)             Route pages (index, blog, contact, tags, 404, about)
  styles/
    [global.css](src/styles/global.css)         Design tokens, typography, base layout
    [components.css](src/styles/components.css) Shared component styles
    [feed.css](src/styles/feed.css)             Blog feed list styles
    [pagefind.css](src/styles/pagefind.css)     Search UI overrides
  [assets/images/](src/assets/images/)     Hero images, avatars, OG images
    [consts.ts](src/consts.ts)                 Site-wide constants (author, social, analytics)

[contact-worker/](contact-worker/)      Cloudflare Worker (contact form API)
    [src/index.ts](contact-worker/src/index.ts) POST handler (validation, Turnstile, Resend email)
    [wrangler.toml](contact-worker/wrangler.toml) Deployment config
    [package.json](contact-worker/package.json) Worker dependencies


Architecture Highlights
-----------------------

Layout: Single [BlogPost.astro](src/layouts/BlogPost.astro) shared by all pages. Article-only features
  (TOC, reading progress bar, dates, pagination, tags) gated behind
  {pageType === 'article' && ...}.

Content: Posts are .mdx in [src/content/blog/](src/content/blog/) with Zod-validated frontmatter
  via [src/content.config.ts](src/content.config.ts). pubDate uses z.coerce.date() for fuzzy
  locale date parsing. description is capped at 165 characters.

Design Tokens: All metrics and colors live in [src/styles/global.css](src/styles/global.css) as CSS
  custom properties in OKLCH color space. No px/rem hard-coded anywhere.

Accessibility: WCAG AA compliant. Minimum 44px touch targets, dashed
  :focus-visible outlines, prefers-reduced-motion wrappers on animations.
  No --text-muted on --bg-surface-elevated (contrast failure guard).

Search: [Pagefind](https://pagefind.app/) indexes all static HTML at build time via [astro-pagefind](https://github.com/shishkin/astro-pagefind).

Analytics: Google Analytics 4 via [Partytown](https://partytown.builder.io/) (offloaded to web worker).

SEO: Sitemap ([@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)), RSS feed ([@astrojs/rss](https://docs.astro.build/en/guides/rss/)), JSON-LD structured
  data ([SchemaOrg.astro](src/components/SchemaOrg.astro) with BlogPosting + Person). Open Graph and Twitter
  Card metadata via [BaseHead.astro](src/components/BaseHead.astro).

Webmentions: Fetched from webmention.io at build time via WEBMENTION_IO_TOKEN
  env var (set in [.env.production](.env.production)). Brid.gy forwards social engagement
  from Bluesky and Mastodon.

Contact Form: POST handler lives in [contact-worker/](contact-worker/) as a separate Cloudflare
  Worker. Validates input, checks Turnstile CAPTCHA, rate limits, sends
  email via Resend API. Frontend in [contact.astro](src/pages/contact.astro) uses PUBLIC_CONTACT_API_URL
  env variable to point at worker URL (localhost:8787 in dev).

Tag Filtering: Client-side inline script via [TagFilterBar.astro](src/components/TagFilterBar.astro)
  on index/blog pages. Tag pages (/tags/[tag]) exist as static routes but are
  empty — filtering is done in-browser.

Reading Time: Server-side from word count (Math.ceil(wordCount / 200)).

Code Highlighting: Expressive Code via [astro-expressive-code](https://expressive-code.com/)
  with dark-plus theme and terminal frames for shell blocks.

Image Optimization: [Sharp](https://sharp.pixelplumbing.com/) compresses WebP hero images at build time
  via [@playform/compress](https://github.com/PlayForm/Compress).


CLI Commands
------------

pnpm dev              Dev server on localhost:4321
pnpm build            Build to ./dist/ (includes Pagefind indexing)
pnpm preview          Preview production build locally
pnpm typecheck        pnpm astro check
pnpm lint             pnpm exec biome check .
pnpm format           pnpm exec biome format . --write
pnpm fallow:dead-code   Dead code analysis (unused files, deps)
pnpm fallow:audit       Audit changed files since main
pnpm lighthouse:all   node scripts/lighthouse-all.mjs


Environment Files
-----------------

[.env.development](.env.development)          Dev vars (Turnstile test key, localhost worker URL)
[.env.production](.env.production)            Production vars (real keys, deployed worker URL)
.env.local            Local overrides (gitignored, not committed)
[.env.example](.env.example)                  Template for reference

Secrets for the Cloudflare Worker are set via [wrangler secret put](https://developers.cloudflare.com/workers/configuration/secrets/), not in env files.


Deployment
----------

Astro:     Static site output to ./dist/. Deploy to any static host.
Worker:    cd [contact-worker](contact-worker/) && wrangler deploy --env production.
           Secrets: wrangler secret put TURNSTILE_SECRET_KEY
                    wrangler secret put RESEND_API_KEY
                    wrangler secret put RESEND_FROM_EMAIL

API domain should be set via PUBLIC_CONTACT_API_URL in [.env.production](.env.production)
  and added to Cloudflare DNS if using a custom subdomain.
