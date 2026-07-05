# Deployment

## Astro Static Build

The site builds to a static `./dist/` directory:

```sh
pnpm build       # astro build → ./dist/
pnpm preview     # astro preview → serve ./dist/ locally
```

The build output includes:

- Static HTML pages
- Pagefind search index
- RSS feed
- Sitemap
- Optimized images (WebP via Sharp / @playform/compress)

## Cloudflare Worker (Contact Form)

The contact form is handled by a separate Cloudflare Worker in `contact-worker/`.

Deployment is manual:

```sh
cd contact-worker && wrangler deploy --env production
```

The worker validates input, checks Turnstile CAPTCHA, rate-limits, and sends
email via Resend API. It uses environments defined in `wrangler.toml`:

- `development` — `ericcarlisle-contact-dev`
- `production` — `ericcarlisle-contact`

## Environment Variables and Secrets

### Frontend (Astro)

| Variable | File | Required | Purpose |
|---|---|---|---|
| `PUBLIC_CONTACT_API_URL` | `.env.development` / `.env.production` | Yes | Points to the deployed worker URL |

### Worker Secrets

These are set via `wrangler secret put`, not in committed files:

- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile verification
- `RESEND_API_KEY` — Resend email API key
- `RESEND_FROM_EMAIL` — Verified sender address

## What Not to Commit

- `.env.local` — Local overrides, may contain real keys
- `dist/` — Build output (generated)
- `node_modules/` — Dependencies (generated)
- `contact-worker/node_modules/` — Worker dependencies (generated)
- `lh-reports/` — Lighthouse report output (generated)

## CI/CD

This deployment documentation does not assume CI/CD. No GitHub Actions
workflows or automated deploy pipelines are currently configured.
Deployment steps described above are manual.
