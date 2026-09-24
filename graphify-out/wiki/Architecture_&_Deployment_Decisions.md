# Architecture & Deployment Decisions

> 36 nodes · cohesion 0.08

## Key Concepts

- **Architecture** (22 connections) — `docs/architecture.md`
- **Static Site Deployment** (12 connections) — `docs/deployment-static-site.md`
- **consts.ts** (11 connections) — `src/consts.ts`
- **Contact Worker** (9 connections) — `docs/deployment-contact-worker.md`
- **Analytics and Monitoring** (8 connections) — `docs/analytics-and-monitoring.md`
- **Environment Variables** (7 connections) — `docs/deployment-environment.md`
- **astro.config.mjs** (6 connections) — `docs/architecture.md`
- **Separate Cloudflare Worker for Contact Form Decision** (6 connections) — `docs/decisions/002-separate-cloudflare-worker-for-contact-form.md`
- **search.astro** (6 connections) — `src/pages/search.astro`
- **Static-First Astro Architecture Decision** (5 connections) — `docs/decisions/001-static-first-astro-architecture.md`
- **Pagefind for Static Site Search Decision** (5 connections) — `docs/decisions/003-pagefind-for-static-site-search.md`
- **GoogleAnalytics.astro** (4 connections) — `src/components/GoogleAnalytics.astro`
- **contact.astro** (3 connections) — `src/pages/contact.astro`
- **lighthouserc.js** (2 connections) — `docs/deployment-static-site.md`
- **contact-worker/wrangler.toml** (1 connections) — `docs/decisions/002-separate-cloudflare-worker-for-contact-form.md`
- **GA4 Analytics** (1 connections) — `docs/analytics-and-monitoring.md`
- **Sentry Monitoring** (1 connections) — `docs/analytics-and-monitoring.md`
- **Webmentions** (1 connections) — `docs/analytics-and-monitoring.md`
- **Generated Areas** (1 connections) — `docs/architecture.md`
- **Notable Integrations** (1 connections) — `docs/architecture.md`
- **Contact Worker Request Flow** (1 connections) — `docs/deployment-contact-worker.md`
- **Resend Email Delivery** (1 connections) — `docs/deployment-contact-worker.md`
- **Contact Worker Rollback Procedure** (1 connections) — `docs/deployment-contact-worker.md`
- **Turnstile CAPTCHA Verification** (1 connections) — `docs/deployment-contact-worker.md`
- **Environment Variable Files** (1 connections) — `docs/deployment-environment.md`
- *... and 11 more nodes in this community*

## Relationships

- [Agent Workflow & Site Policies](Agent_Workflow_%26_Site_Policies.md) (10 shared connections)
- [SEO & Structured Data](SEO_%26_Structured_Data.md) (8 shared connections)
- [Blog Listing UI](Blog_Listing_UI.md) (6 shared connections)
- [Design System & Agent Context](Design_System_%26_Agent_Context.md) (3 shared connections)
- [Contact Worker API](Contact_Worker_API.md) (2 shared connections)
- [Card Component](Card_Component.md) (1 shared connections)
- [Lighthouse Performance Footer](Lighthouse_Performance_Footer.md) (1 shared connections)
- [Navigation & Sharing Components](Navigation_%26_Sharing_Components.md) (1 shared connections)

## Source Files

- `docs/analytics-and-monitoring.md`
- `docs/architecture.md`
- `docs/decisions/001-static-first-astro-architecture.md`
- `docs/decisions/002-separate-cloudflare-worker-for-contact-form.md`
- `docs/decisions/003-pagefind-for-static-site-search.md`
- `docs/deployment-contact-worker.md`
- `docs/deployment-environment.md`
- `docs/deployment-static-site.md`
- `src/components/GoogleAnalytics.astro`
- `src/consts.ts`
- `src/pages/contact.astro`
- `src/pages/search.astro`
- `src/styles/pagefind.css`

## Audit Trail

- EXTRACTED: 126 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*