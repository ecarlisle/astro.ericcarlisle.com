# Deployment and Operations

A complete reference for deploying, configuring, and maintaining ericcarlisle.com.

## Deployment Architecture

The site has two independent deployment surfaces:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Static Site (GitHub Pages)                                         │
│                                                                     │
│  Source → GitHub Actions → Astro build → GitHub Pages               │
│  HTML, CSS, JS, images, RSS, sitemap, Pagefind index                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Contact Form Worker (Cloudflare Workers)                           │
│                                                                     │
│  Form → Worker → Turnstile verification → Resend email API          │
│  Separate deployment, separate secrets                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Key points:**
- The static site and the Worker deploy independently
- Changes to the static site do not affect the Worker
- Changes to the Worker do not require a static site rebuild
- The static site is served from GitHub Pages via Cloudflare DNS
- The Worker runs on Cloudflare's edge network

## Local Environment Setup

### Quick Start

```sh
git clone <repo>
cd ericcarlisle.com
pnpm install
cp .env.example .env.local
# Edit .env.local with your values (see below)
pnpm dev
```

### Environment Files

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template with safe placeholders | Yes |
| `.env.local` | Local development overrides | No (gitignored) |
| `.env.development` | Dev-specific values | No (gitignored) |
| `.env.production` | Production-specific values | No (gitignored) |

Astro loads environment variables in this order:
1. `.env` (all modes)
2. `.env.local` (all modes)
3. `.env.[mode]` (`.env.development` or `.env.production`)
4. `.env.[mode].local` (`.env.development.local` or `.env.production.local`)

### What to Put in `.env.local`

For local development, you need:

```sh
# Required for contact form to work
PUBLIC_CONTACT_API_URL=https://your-worker.workers.dev
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA  # Test key

# Optional: enables live webmentions
WEBMENTION_IO_TOKEN=your-token
```

### What's Safe to Expose

Variables prefixed with `PUBLIC_` are embedded in the built HTML and visible to browsers. Only put non-sensitive values in these:

- `PUBLIC_CONTACT_API_URL` — The Worker endpoint URL (not a secret)
- `PUBLIC_TURNSTILE_SITE_KEY` — The Turnstile site key (designed to be public)

**Never put secrets in `PUBLIC_` variables.**

### Fallback Behavior

| Variable | Missing Behavior |
|----------|-----------------|
| `PUBLIC_CONTACT_API_URL` | Contact form shows "not configured" error |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget hidden; dev warning shown |
| `WEBMENTION_IO_TOKEN` | Mock data in dev, omitted in production |
| `SITE` | Defaults to `https://ericcarlisle.com` |

## Environment Variables Reference

### Astro and Frontend Variables

| Variable | Scope | Required | Public | Purpose |
|----------|-------|----------|--------|---------|
| `PUBLIC_CONTACT_API_URL` | Build + Runtime | Yes | Yes | Cloudflare Worker endpoint URL |
| `PUBLIC_TURNSTILE_SITE_KEY` | Build + Runtime | Yes* | Yes | Turnstile CAPTCHA site key |
| `WEBMENTION_IO_TOKEN` | Build-time | No | No | webmention.io API token |
| `SITE` | Build-time | No | No | Site URL (set automatically in CI) |

*Required for contact form functionality; contact page works without it but shows a warning.

### GitHub Actions Configuration

The workflow (`.github/workflows/astro.yml`) uses **repository variables** (not secrets) for:

| Variable | Type | Purpose |
|----------|------|---------|
| `PUBLIC_TURNSTILE_SITE_KEY` | Repository variable | Passed to Astro build |
| `PUBLIC_CONTACT_API_URL` | Repository variable | Passed to Astro build |

These are set in: **GitHub repo → Settings → Secrets and variables → Actions → Variables**

### Cloudflare Worker Configuration

The Worker (`contact-worker/`) uses **secrets** (not environment variables):

| Secret | Purpose | Set via |
|--------|---------|---------|
| `TURNSTILE_SECRET_KEY` | Turnstile verification | `wrangler secret put` |
| `RESEND_API_KEY` | Resend email API | `wrangler secret put` |
| `RESEND_FROM_EMAIL` | Sender address | `wrangler secret put` |
| `RESEND_TO_EMAIL` | Recipient address | `wrangler secret put` |

The Worker also has environment-specific names configured in `wrangler.toml`:
- `development` → `ericcarlisle-contact-dev`
- `production` → `ericcarlisle-contact`

## GitHub Pages Deployment

### Workflow File

`.github/workflows/astro.yml`

### Triggers

- **Push to `main`** — Automatic deployment
- **Manual** — `workflow_dispatch` from GitHub UI

### Build Process

1. **Checkout** — `actions/checkout@v4`
2. **Setup pnpm** — `pnpm/action-setup@v4` (version 10.34.4)
3. **Setup Node** — `actions/setup-node@v4` (Node 24)
4. **Configure Pages** — `actions/configure-pages@v5`
5. **Install dependencies** — `pnpm install --frozen-lockfile`
6. **Typecheck** — `pnpm typecheck`
7. **Verify env vars** — Checks `PUBLIC_TURNSTILE_SITE_KEY` and `PUBLIC_CONTACT_API_URL` exist
8. **Build** — `pnpm build` with environment variables injected
9. **Verify contact endpoint** — Confirms Worker URL appears in built HTML
10. **Upload artifact** — `actions/upload-pages-artifact@v4`
11. **Deploy** — `actions/deploy-pages@v4`

### Page Quality Footer

Every page includes a compact line in the footer reporting Lighthouse lab scores:

```text
Page quality: Performance 84 · Accessibility 100 · Best practices 96 · SEO 100
```

These are automated Lighthouse lab measurements, run against the candidate build during deployment. All four categories refer to the standard Lighthouse category scores (Performance, Accessibility, Best Practices, and SEO), not field Core Web Vitals.

**How it works:**
1. After the initial build, `pnpm lighthouse:all` runs Lighthouse on every HTML page
2. `pnpm lighthouse:scores` extracts and validates per-route scores from those reports
3. The final `pnpm build` renders the scores into each page's footer
4. Full reports are uploaded as a workflow artifact (retained 14 days)

**What it reports:**
- Lighthouse 13 mobile simulation with default throttling
- Median representative run (if multiple runs exist for a route)
- The candidate build is measured, then the site is rebuilt with the scores embedded
- Minor score differences between the measured candidate and the final rebuild are expected

**When no data is available:**
- Local development and production builds without a prior Lighthouse audit render the footer without the quality line
- The component gracefully degrades — no placeholder scores or broken output
- `.env`, `.env.local`, and local builds are unaffected

**Reproducing locally:**
```sh
pnpm lighthouse:report    # build → audit → generate scores
```

Full reports appear in `lh-reports/`. The generated score data lives at `src/generated/lighthouse-scores.json` but is not committed (it is deployment-specific).

### Site Inventory

`/lab/site-inventory/` is a post-build inventory of the generated site. It is a
developer/owner tool, not a public sitemap or a guarantee of search indexing.

**What it measures.** The generator cross-references three independent inputs
produced from the same `dist/` build:

1. **Generated HTML pages** — normal site HTML pages plus explicitly
   registered external artifacts. Generated tool files (Pagefind, Partytown,
   `_astro/` assets, icons) and the internal files of external artifacts are
   not inventoried as normal pages.
2. **The XML sitemap** — parsed from the generated `sitemap-index.xml` and
   sitemap files
3. **Internal links** — `<a href>` anchors extracted from the generated HTML

For each URL it records whether a page was built, whether it is in the sitemap,
title/description/canonical/robots metadata, H1 count, inbound-link count,
sitemap `lastmod`, and any warnings.

**Build/data flow.**

```text
pnpm build                         # Astro build → dist/
  └─ postbuild                     # node scripts/generate-site-inventory.mjs
       └─ dist/lab/site-inventory/data.json   (deployment-specific JSON)
```

The Astro page at `/lab/site-inventory/` loads `data.json` at runtime, so the
deployed page always reflects the same final build that produced it — including
post-build additions such as the Storybook copy at `/design-system/lab/`. No
generated inventory data is committed under `src/`; `data.json` is written only
into `dist/`. The CI workflow regenerates the inventory after the final
Storybook copy so the measured artifact matches the uploaded artifact.

**Warnings.** The generator emits machine-readable warning codes:

- `MISSING_FROM_SITEMAP` — indexable built page not in the sitemap
- `NO_BUILT_PAGE` — sitemap URL with no generated HTML file
- `ORPHANED_PAGE` — indexable page with zero inbound internal links
- `NOINDEX_IN_SITEMAP` — `noindex` page included in the sitemap
- `MISSING_CANONICAL` / `CANONICAL_MISMATCH` / `CANONICAL_TARGET_MISSING`
- `MISSING_TITLE` / `MISSING_DESCRIPTION` / `MISSING_H1` / `MULTIPLE_H1S`
- `DUPLICATE_TITLE` / `DUPLICATE_DESCRIPTION`

**Classifications and intentional exceptions.** Pages are classified as
normal, `noindex`, redirect, 404, lab (`/lab/*`), or external artifact
(`/design-system/lab/`). Redirects are identified from actual redirect
evidence — Astro's generated `<meta http-equiv="refresh">` markup — and from
an explicit legacy route list (`/posts/*`). A canonical that differs from the
route is **not** treated as redirect evidence; a normal page with a mismatched
canonical remains a normal page and receives `CANONICAL_MISMATCH`. Exceptions
are centralized in `scripts/site-inventory-core.mjs`:

- `/lab/*`, `/404.html/`, `/search/`, `/tags/` — no inbound links expected
- `/lab/*`, `/404.html/`, `/tags/` — not expected in the sitemap
- The 404 page's canonical (`/404/`) is an intentional Astro convention
- `ORPHANED_PAGE` is only emitted for indexable pages; non-indexable
  redirects and `noindex` pages never receive orphan warnings
- Redirect pages are non-indexable; their canonical target existence is
  checked instead
- Storybook at `/design-system/lab/` is a single external artifact,
  represented by `dist/design-system/lab/index.html` as build evidence.
  Its internal HTML files are not inventoried as normal pages. A local build
  without Storybook reports it as not built (`NO_BUILT_PAGE`); the CI
  deployment copies Storybook before regenerating the inventory, so the
  final artifact reports it as built and in the sitemap.

The sitemap configuration (`astro.config.mjs`) uses a pathname-aware filter
that excludes root `/lab/*` routes, `/posts/*` redirects, and
`/portfolio/design-system/` (noindex), while preserving
`/design-system/lab/` (Storybook), which is declared via `customPages`.

**Deterministic output.** Running the generator twice against identical input
produces byte-identical JSON. The output carries git commit provenance, not a
wall-clock timestamp.

**Running locally.**

```sh
pnpm build                        # runs the inventory as postbuild
# or explicitly:
pnpm build && pnpm inventory:generate
```

**Limits.** The inventory describes the generated build and its internal
consistency. It does not measure live availability, whether the sitemap has
been submitted or crawled, or search indexing status. A healthy inventory does
not guarantee that a page is indexed or live.

### Required Repository Settings

1. **GitHub Pages** enabled:
   - Source: GitHub Actions
   - Custom domain: `ericcarlisle.com` (if configured in Cloudflare DNS)

2. **Repository variables** set:
   - `PUBLIC_TURNSTILE_SITE_KEY`
   - `PUBLIC_CONTACT_API_URL`

### Post-Deployment Verification

After each deployment, verify:
- Homepage loads at `https://ericcarlisle.com`
- Blog articles render correctly
- Contact form endpoint is configured (check page source for `data-contact-api-url`)
- RSS feed at `/rss.xml`
- Sitemap at `/sitemap-index.xml`
- Search works at `/search`

### Rollback

**Revert a commit and push:**

This is the most reliable recovery path:

```sh
# Revert a specific commit
git revert <commit-hash>
git push origin main
```

The workflow triggers automatically and deploys the previous state.

**Alternative: Rerun previous workflow**

GitHub Actions retains workflow run history. You can re-run a previous successful build:

1. Go to **Actions** → **Deploy Astro site to Pages**
2. Find a working deployment run from before the issue
3. Click **Re-run all jobs**

This re-executes the build and deploy steps using the code from that commit. This can work for recovery, but reverting a commit is more predictable and auditable.

## Contact Worker Deployment

### Worker Purpose

The Cloudflare Worker handles contact form submissions:
1. Validates form input
2. Checks honeypot field (anti-bot)
3. Rate limits by IP (5 requests/minute)
4. Verifies Turnstile CAPTCHA token
5. Sends email via Resend API

### Local Development

```sh
cd contact-worker
pnpm install
pnpm dev        # Starts Wrangler dev server
```

The Worker runs locally at `http://localhost:8787`.

### Type Checking

```sh
cd contact-worker
pnpm typecheck
```

### Deployment Commands

```sh
cd contact-worker

# Deploy to development
pnpm deploy:dev

# Deploy to production
pnpm deploy:prod

# Or use Wrangler directly
wrangler deploy --env production
```

### Setting Secrets

First time or when rotating keys:

```sh
cd contact-worker
wrangler secret put TURNSTILE_SECRET_KEY --env production
wrangler secret put RESEND_API_KEY --env production
wrangler secret put RESEND_FROM_EMAIL --env production
wrangler secret put RESEND_TO_EMAIL --env production
```

### Request Flow

```text
Browser → POST JSON to Worker
  ↓
Parse and validate input
  ↓
Check honeypot field (reject if filled)
  ↓
Check timestamp (reject if < 3 seconds — too fast)
  ↓
Rate limit check (5 requests/minute per IP)
  ↓
Verify Turnstile token with Cloudflare
  ↓
Send email via Resend API
  ↓
Return success or error JSON
```

### Rate Limiting

- **Limit:** 5 requests per minute per IP
- **Window:** 60 seconds, sliding
- **Response:** HTTP 429 with error message
- **Storage:** In-memory (resets on Worker restart)

### CORS

The Worker currently accepts cross-origin requests from any origin (`Access-Control-Allow-Origin: *`). It handles OPTIONS preflight requests and allows the `POST` method with `Content-Type` headers.

Abuse resistance relies on:
- Turnstile CAPTCHA verification (must pass before email is sent)
- Rate limiting (5 requests per minute per IP)
- Input validation (required fields, honeypot, timing check)
- No credentials are sent or accepted

This configuration is intentional for the contact form use case. The Worker does not return sensitive data — only a success or error status.

## Turnstile Behavior

### Keys

| Key Type | Public? | Purpose |
|----------|---------|---------|
| Site Key | Yes | Embedded in HTML, shown to users |
| Secret Key | No | Server-side verification only |

### Test Keys for Local Development

Cloudflare provides official test keys that always pass verification. For end-to-end local testing, you must use the matching pair:

```text
Frontend site key:    1x00000000000000000000AA
Worker secret key:    1x0000000000000000000000000000000AA
```

- The **site key** is public and belongs in your frontend `.env.local` as `PUBLIC_TURNSTILE_SITE_KEY`.
- The **secret key** belongs only in the Worker's Wrangler secret (`TURNSTILE_SECRET_KEY`), never in the frontend environment.
- These keys are for development and testing only and must not be used in production.
- This pair is configured to always pass verification, so local form submissions will succeed regardless of CAPTCHA state.

### Production Keys

Production keys are created in the **Cloudflare Dashboard → Turnstile → Create Site Key**. They are distinct from the test keys above and perform real verification.

### How It Works

1. **Frontend** loads Turnstile script when `PUBLIC_TURNSTILE_SITE_KEY` is set
2. **User** sees CAPTCHA challenge (or invisible verification)
3. **Turnstile** generates a token, placed in `cf-turnstile-response` field
4. **Frontend** sends token with form data to Worker
5. **Worker** verifies token with `https://challenges.cloudflare.com/turnstile/v0/siteverify`
6. **Worker** sends `secret`, `response` (token), and `remoteip`

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| "CAPTCHA verification failed" | Expired or invalid token | User should retry |
| Widget doesn't appear | Missing `PUBLIC_TURNSTILE_SITE_KEY` | Set the variable |
| Widget appears but can't verify | Wrong secret key | Check Worker secrets |
| Works locally, fails in production | Test keys in production | Use real keys |

### Where Keys Belong

| Key | Location |
|-----|----------|
| Site Key | `PUBLIC_TURNSTILE_SITE_KEY` in `.env.local` or GitHub Actions vars |
| Secret Key | Worker secret: `TURNSTILE_SECRET_KEY` |

## Resend Behavior

### Configuration

| Setting | Source | Purpose |
|---------|--------|---------|
| API Key | Worker secret: `RESEND_API_KEY` | Authenticates with Resend |
| From Address | Worker secret: `RESEND_FROM_EMAIL` | Sender address |
| To Address | Worker secret: `RESEND_TO_EMAIL` | Recipient address |

### Domain Verification

Resend requires domain verification:
1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM)
3. Use a verified sender address

The `RESEND_FROM_EMAIL` must be from a verified domain.

### Email Format

Emails are sent as HTML with:
- Subject: `[Contact] {user's subject}`
- Reply-To: User's email address
- Body: Name, email, and message (HTML-escaped)

### Failure Handling

| Scenario | Worker Response |
|----------|-----------------|
| Resend API error | HTTP 500, "Failed to send message" |
| Invalid API key | HTTP 500, logged to console |
| Invalid sender address | HTTP 500, logged to console |
| Network error | HTTP 500, logged to console |

## Analytics and Monitoring

### Google Analytics (GA4)

**Configuration:**
- Measurement ID: `G-70E1BWCFJ3` (in `src/consts.ts`)
- Implementation: `src/components/GoogleAnalytics.astro`
- Offloaded to web worker via Partytown

**Behavior:**
- Loads on all pages
- Scripts run in Partytown web worker (not main thread)
- No impact on Core Web Vitals

### Sentry Error Tracking

Sentry is included as an integration (`@sentry/astro`) but is **not configured with a DSN**. The integration is present in `astro.config.mjs` with only `telemetry: false` set.

**Current behavior:**
- No DSN is passed to the integration
- No browser or server SDK is initialized
- No errors are captured or reported
- Build warnings appear about missing `authToken` for source map uploads

**To enable Sentry in the future:**
1. Create a Sentry project and obtain a DSN
2. Update `astro.config.mjs` to pass the DSN to the integration (e.g., `sentry({ dsn: '...' })`)
3. Set `SENTRY_AUTH_TOKEN` for source map uploads
4. Set `SENTRY_ORG` and `SENTRY_PROJECT` to identify the Sentry project

Without these steps, Sentry is inert — it does not capture errors or affect runtime behavior.

- Works with or without Sentry

### Webmentions

**Configuration:**
- `WEBMENTION_IO_TOKEN` — API token for webmention.io

**Behavior:**
- With token: fetches real webmentions at build time
- Without token in dev: returns mock data
- Without token in production: webmention section omitted

## Deployment Verification Checklist

After deploying, verify these items:

### Static Site

- [ ] Homepage loads at `https://ericcarlisle.com`
- [ ] Representative blog article renders (`/blog/[slug]/`)
- [ ] Previously drafted article returns 404 (`/blog/good-agent-context-is-carved-not-copied/`)
- [ ] RSS feed valid at `/rss.xml`
- [ ] Sitemap present at `/sitemap-index.xml`
- [ ] `robots.txt` present (if configured)
- [ ] Pagefind search works at `/search`
- [ ] Structured data present in page source
- [ ] No console errors in browser

### Contact Form

- [ ] Contact page loads at `/contact`
- [ ] Turnstile widget appears
- [ ] Form submits successfully
- [ ] Confirmation email received
- [ ] Error handling works (try submitting empty form)

### Analytics

- [ ] GA4 events firing (check with GA DebugView)
- [ ] No analytics errors in console

### Performance

- [ ] Lighthouse performance ≥ 95
- [ ] Lighthouse accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 100
- [ ] Lighthouse best practices ≥ 95

Run full audit: `pnpm lighthouse:all`

## Rollback and Recovery

### Static Site (GitHub Pages)

**Recommended: Revert a commit**

1. Identify the commit that introduced the issue
2. Revert it:

```sh
git revert <commit-hash>
git push origin main
```

3. The workflow triggers automatically and deploys the corrected state
4. Verify the deployment at the live URL

**Alternative: Rerun a previous workflow**

GitHub Actions retains workflow run history. You can re-run a previous successful build:

1. Go to **Actions** → **Deploy Astro site to Pages**
2. Find a working deployment run from before the issue
3. Click **Re-run all jobs**

This re-executes the build and deploy steps using that commit's code. Rerunning a workflow is faster than reverting, but reverting creates a more predictable and auditable history.

### Cloudflare Worker

The Worker deploys independently from the static site. There is no automated rollback mechanism.

**Recovery procedure using a temporary worktree:**

```sh
# Create a temporary worktree at a known-good commit (does not disturb main)
git worktree add ../astroblog-worker-rollback <known-good-commit>

# Install and deploy from the clean worktree
cd ../astroblog-worker-rollback/contact-worker
pnpm install --frozen-lockfile
pnpm exec wrangler deploy --env production

# Verify the deployed Worker before cleanup
cd ../astro.ericcarlisle.com
git worktree remove ../astroblog-worker-rollback
```

**Important:**
- The deployment must be run from a known-good commit.
- Worker secrets, bindings, routes, and environment configuration are not restored by Git and must be checked separately after rollback (`wrangler secret list --env production`).
- Verify the deployed Worker behaves correctly before removing the temporary worktree.
- No rollback is performed as part of this documentation task.

### Environment Configuration

If secrets are compromised or lost:
1. Rotate keys in respective services (Turnstile dashboard, Resend dashboard)
2. Update Worker secrets: `wrangler secret put <SECRET_NAME> --env production`
3. Update GitHub Actions variables if changed
4. Redeploy if necessary

### Verification After Recovery

1. Test homepage loads
2. Test contact form submits
3. Check email delivery
4. Verify analytics events

## Troubleshooting

### Contact Form Issues

**"The contact form is not configured"**
- Cause: `PUBLIC_CONTACT_API_URL` is missing
- Fix: Set the variable in `.env.local` or GitHub Actions vars

**"Please complete the verification challenge"**
- Cause: Turnstile token missing or empty
- Fix: Ensure `PUBLIC_TURNSTILE_SITE_KEY` is set and widget loads

**"CAPTCHA verification failed"**
- Cause: Invalid or expired Turnstile token
- Fix: Check Worker has correct `TURNSTILE_SECRET_KEY`

**"Failed to send message"**
- Cause: Resend API error
- Fix: Check Worker logs (`wrangler tail`), verify `RESEND_API_KEY`

### Build Issues

**Missing environment variable in CI**
- Cause: GitHub Actions variable not set
- Fix: Go to repo Settings → Secrets and variables → Actions → Variables

**Typecheck fails**
- Cause: TypeScript error in source
- Fix: Run `pnpm typecheck` locally and fix errors

### Analytics Issues

**GA4 not tracking**
- Cause: Ad blocker or missing measurement ID
- Fix: Verify `GA_MEASUREMENT_ID` in `src/consts.ts`

**Sentry not capturing errors**
- Cause: Sentry integration is included but not configured with a DSN
- Note: This is expected — Sentry is inert until configured. See "Sentry Error Tracking" section.

### Deployment Issues

**GitHub Pages deployment fails**
- Cause: Workflow error or permissions
- Fix: Check Actions logs, verify Pages is enabled in repo settings

**Custom domain not working**
- Cause: DNS not configured or SSL pending
- Fix: Verify DNS records in Cloudflare, wait for SSL propagation

## Related Documentation

- [Architecture](architecture.md) — Overall project structure
- [Testing](testing.md) — Validation commands and when to run them
- [Performance, SEO, Accessibility](performance-seo-accessibility.md) — Quality standards
