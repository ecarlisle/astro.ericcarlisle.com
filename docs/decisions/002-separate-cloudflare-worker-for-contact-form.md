# Separate Cloudflare Worker for contact-form processing

- Status: Accepted
- Date: 2026-07-12 (documenting existing decision)

## Context

The site needs a contact form that sends email. Since the site is statically generated, there is no server runtime to handle form submissions. The form requires spam protection (Turnstile CAPTCHA), rate limiting, and email delivery (Resend).

## Decision

Implement the contact form as a separate Cloudflare Worker (`contact-worker/`) rather than:

- Adding server-side rendering to the Astro site.
- Using a third-party form service (Formspree, Netlify Forms, etc.).
- Embedding form handling in the static build process.

The Worker:
- Accepts POST requests with JSON payloads.
- Validates input (required fields, honeypot, timing check).
- Rate limits by IP (5 requests/minute).
- Verifies Cloudflare Turnstile CAPTCHA tokens.
- Sends email via the Resend API.
- Runs independently with its own deployment cycle and secrets.

## Reasons

- Keeps the static site simple and fast; no server runtime needed.
- Cloudflare Workers have generous free-tier limits suitable for a personal site.
- Turnstile provides built-in CAPTCHA without third-party dependencies.
- Resend provides reliable email delivery with a simple API.
- Secrets (API keys) are isolated from the frontend codebase.

## Tradeoffs

- Two deployment surfaces instead of one; the Worker must be deployed and monitored separately.
- Worker secrets are not version-controlled; they must be managed via Wrangler.
- The Worker has no automated rollback mechanism.

## Consequences

- Contact form functionality is independent of static site deployments.
- Worker changes can be deployed without rebuilding the site.
- Form endpoint URL must be configured in the frontend via `PUBLIC_CONTACT_API_URL`.
- Local development requires running the Worker separately (`wrangler dev`).

## Related files and documentation

- `contact-worker/src/index.ts` — Worker implementation
- `contact-worker/wrangler.toml` — Worker configuration
- `src/pages/contact.astro` — Frontend form implementation
- `docs/deployment.md` — Deployment procedures for both surfaces
