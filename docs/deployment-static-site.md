# Static Site Deployment

**Use when:** Changing CI, GitHub Pages deployment, Cloudflare zone settings, or the page-quality footer, or recovering from a bad deploy.

The site has two independent deployment surfaces. Neither requires redeploying the other.

| Surface | Path | Guide |
|---|---|---|
| Static site | GitHub Actions → Astro build → GitHub Pages, behind Cloudflare DNS | This doc |
| Contact form | Cloudflare Worker → Turnstile → Resend | [Contact Worker](deployment-contact-worker.md) |

## Workflow

`.github/workflows/astro.yml` is the source of truth for steps and action versions.

| Trigger | Result |
|---|---|
| Pull request to `main` | Build and validate; no deploy |
| Push to `main` | Build and deploy |
| `workflow_dispatch` | Build and deploy |

Step order:

1. Install, validate the Context Health report, typecheck, and check required public variables.
2. `pnpm build`, then build Storybook, patch it `noindex`, and copy it to `dist/design-system/lab/`.
3. Page-quality build test, `pnpm test:e2e`, `pnpm lighthouse:all`, and Lighthouse score validation.
4. Generate Site Quality data and rebuild with the scores embedded.
5. Copy Storybook again, regenerate the [Site Inventory](site-inventory.md), and run `pnpm validate:seo`.
6. Verify the Worker URL appears in built HTML, upload, and deploy (push and manual runs only).

Required settings: Pages source is **GitHub Actions**, with custom domain `ericcarlisle.com`. The Actions variables are listed in [Environment Variables](deployment-environment.md#github-actions).

## Redirects

GitHub Pages cannot send HTTP `301`/`308` redirects. Route aliases use Astro's static `Astro.redirect(...)`: a `meta-refresh` page that is `noindex`, has a canonical pointing to the destination, and includes a direct link. The [indexing policy](performance-seo-accessibility.md#indexing-and-sitemap-policy) lists the current aliases.

## Rocket Loader must stay off

Rocket Loader is a Cloudflare dashboard setting on the `ericcarlisle.com` zone, not code in this repo. It rewrites Astro's `<script type="module">` tags, which breaks module-preload reuse.

- Disable: **Speed → Settings → Content Optimization → Rocket Loader → Off**. One toggle covers apex and `www`. API: `PATCH /zones/{zone_id}/settings/rocket_loader` with `{"value": "off"}`.
- Purge the Cloudflare cache, then verify: `pnpm verify:no-rocket-loader [url]` (defaults to the homepage). It is opt-in and not part of CI.
- The check fails only on real markers in `<script>` elements: `rocket-loader.min.js`, `data-cf-settings`, or `<hex>-module` types. Exit codes: `0` clean, `1` regression, `2` bad invocation, `3` network failure.
- `ERR_BLOCKED_BY_CLIENT` on `/cdn-cgi/zaraz/s.js` comes from privacy blockers, not the site.

## Page-quality footer

Each page footer shows Lighthouse lab scores (mobile simulation, median run) for the deployed candidate build. CI audits the first build, extracts the scores, and rebuilds with them. Small differences between the audited build and the rebuild are expected. Reports are kept as a 14-day workflow artifact.

Builds without audit data omit the footer line. To reproduce locally, run `pnpm lighthouse:report`. Reports go to `lh-reports/`; scores go to `src/generated/lighthouse-scores.json` (not committed).

## Verify a deploy

- Homepage, a blog article, and the redirect `/blog/good-agent-context-is-carved-not-copied/`
- `/rss.xml`, `/sitemap-index.xml`, and `/search/`
- JSON-LD present; no console errors
- Contact form: see [Contact Worker](deployment-contact-worker.md#verify)
- Lighthouse: `pnpm lighthouse:all`; thresholds live in `lighthouserc.js`

## Roll back

Preferred: `git revert <commit>`, then push to `main`. The workflow redeploys automatically.

Faster: **Actions → Deploy Astro site to Pages →** a known-good run **→ Re-run all jobs**. This is less auditable than a revert.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Missing variable in CI | Set it under **Settings → Secrets and variables → Actions → Variables** |
| Typecheck fails | Run `pnpm typecheck` locally |
| Pages deploy fails | Check Actions logs; confirm Pages is enabled |
| Custom domain fails | Check Cloudflare DNS records; wait for SSL |
