# Environment Variables

**Use when:** Adding, changing, or debugging environment variables, secrets, or local environment setup.

[`.env.example`](../.env.example) is the template. Copy it to `.env.local` for local development.

## Files

| File | Purpose | Committed |
|---|---|---|
| `.env.example` | Safe placeholders | Yes |
| `.env.local` | Local overrides | No |
| `.env.development` | Development values | No |
| `.env.production` | Production values | No |

Astro load order (later wins): `.env` → `.env.local` → `.env.[mode]` → `.env.[mode].local`.

## Frontend

| Variable | Scope | Required | If missing |
|---|---|---|---|
| `PUBLIC_CONTACT_API_URL` | Build + runtime | Yes | Contact form shows "not configured" |
| `PUBLIC_TURNSTILE_SITE_KEY` | Build + runtime | For the contact form | Widget hidden; dev warning |
| `WEBMENTION_IO_TOKEN` | Build | No | Mock data in dev; section omitted in production |
| `SITE` | Build | No | Defaults to `https://ericcarlisle.com` (set in CI) |

`PUBLIC_` variables are embedded in built HTML. Never put secrets in them.

For local development, use the Turnstile test site key `1x00000000000000000000AA` (see [Turnstile](deployment-contact-worker.md#turnstile)).

## GitHub Actions

Set these under **Settings → Secrets and variables → Actions**.

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Variable | Yes | Passed to the Astro build |
| `PUBLIC_CONTACT_API_URL` | Variable | Yes | Passed to the Astro build |
| `WEBMENTION_IO_TOKEN` | Secret | No | Live webmentions; passed only to the webmention check and build steps |

## Contact Worker secrets

Set these with `wrangler secret put <NAME> --env production`.

| Secret | Purpose |
|---|---|
| `TURNSTILE_SECRET_KEY` | Turnstile verification |
| `RESEND_API_KEY` | Resend API authentication |
| `RESEND_FROM_EMAIL` | Sender address; must be on a verified Resend domain |
| `RESEND_TO_EMAIL` | Recipient address |

`wrangler.toml` environments: `development` → `ericcarlisle-contact-dev`, `production` → `ericcarlisle-contact`.

## Rotate compromised keys

1. Rotate the key in Turnstile or Resend.
2. Run `wrangler secret put <NAME> --env production`.
3. Update the GitHub Actions variables if the public values changed.
4. Redeploy, then [verify the contact form](deployment-contact-worker.md#verify).
