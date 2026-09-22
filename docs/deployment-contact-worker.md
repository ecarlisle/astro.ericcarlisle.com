# Contact Worker

**Use when:** Changing, deploying, debugging, or rolling back the contact form Worker in `contact-worker/`.

The Worker deploys separately from the static site, except when its URL or API contract changes (see [Static Site Deployment](deployment-static-site.md)). Its secrets are listed in [Environment Variables](deployment-environment.md#contact-worker-secrets). The reasons for keeping it separate are recorded in [ADR 002](decisions/002-separate-cloudflare-worker-for-contact-form.md).

## Request flow

`POST` JSON → validate input → reject a filled honeypot → reject submissions under 3 seconds → rate limit → verify the Turnstile token → send via Resend → return JSON success or error.

| Control | Behavior |
|---|---|
| Rate limit | 5 requests per 60-second sliding window per IP; HTTP `429`; in-memory, resets on restart |
| CORS | `Access-Control-Allow-Origin: *`, `POST` + `OPTIONS`, no credentials |

Open CORS is intentional. Abuse resistance comes from Turnstile, rate limiting, and input checks, and the Worker returns only a status.

## Commands

Run these from `contact-worker/`:

| Task | Command |
|---|---|
| Local dev (`localhost:8787`) | `pnpm dev` |
| Typecheck | `pnpm typecheck` |
| Deploy | `pnpm deploy:dev` / `pnpm deploy:prod` |
| Set a secret | `wrangler secret put <NAME> --env production` |
| Tail logs | `wrangler tail` |

## Turnstile

| Key | Public | Location |
|---|---|---|
| Site key | Yes | `PUBLIC_TURNSTILE_SITE_KEY` (frontend) |
| Secret key | No | `TURNSTILE_SECRET_KEY` (Worker secret only) |

For local testing, use Cloudflare's always-pass pair together. Never use it in production.

```text
Site key:   1x00000000000000000000AA
Secret key: 1x0000000000000000000000000000000AA
```

Create production keys under **Cloudflare Dashboard → Turnstile**. The frontend sends the `cf-turnstile-response` token with the form. The Worker verifies it at `https://challenges.cloudflare.com/turnstile/v0/siteverify`, sending `secret`, `response`, and `remoteip`.

## Resend

`RESEND_FROM_EMAIL` must be on a domain verified in Resend (SPF and DKIM records). Emails use the subject `[Contact] {subject}`, set Reply-To to the sender, and HTML-escape the body. Any Resend failure returns HTTP `500` "Failed to send message" and is logged.

## Verify

- `/contact` loads and the Turnstile widget appears.
- A submission succeeds and the email arrives.
- An empty submission shows validation errors.

## Troubleshooting

| Message | Cause | Fix |
|---|---|---|
| "The contact form is not configured" | `PUBLIC_CONTACT_API_URL` missing | Set the variable |
| "Please complete the verification challenge" | Token missing | Check `PUBLIC_TURNSTILE_SITE_KEY` and that the widget loads |
| "CAPTCHA verification failed" | Expired token, wrong secret, or test keys in production | Retry; check `TURNSTILE_SECRET_KEY` |
| "Failed to send message" | Resend error | Run `wrangler tail`; check `RESEND_API_KEY` |

## Roll back

There is no automated rollback. Deploy from a clean worktree at a known-good commit:

```sh
git worktree add ../astroblog-worker-rollback <known-good-commit>
cd ../astroblog-worker-rollback/contact-worker
pnpm install --frozen-lockfile
pnpm exec wrangler deploy --env production
```

Git does not restore secrets, bindings, or routes. Check them with `wrangler secret list --env production`, verify the Worker, then remove the worktree.
