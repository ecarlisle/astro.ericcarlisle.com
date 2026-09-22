# Analytics and Monitoring

**Use when:** Changing or debugging GA4, Sentry, or webmentions.

| Integration | State | Source |
|---|---|---|
| GA4 | Active on all pages, run in a Partytown web worker | `src/components/GoogleAnalytics.astro`; `GA_MEASUREMENT_ID` in `src/consts.ts` |
| Sentry | Installed, **inert** (no DSN) | `@sentry/astro` in `astro.config.mjs` |
| Webmentions | Live when `WEBMENTION_IO_TOKEN` is set | [Environment Variables](deployment-environment.md#frontend) |

## GA4

If events are missing, first rule out ad blockers, then check `GA_MEASUREMENT_ID`. Verify with GA
DebugView and look for console errors.

## Sentry

Sentry captures nothing and initializes no SDK. Builds warn about a missing `authToken`. That
warning is expected.

To enable Sentry:

1. Create a Sentry project and get its DSN.
2. Pass the DSN to `sentry({ dsn })` in `astro.config.mjs` (a protected file).
3. Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for source-map uploads.

## Webmentions

| Token | Development | Production |
|---|---|---|
| Set | Real webmentions at build time | Real webmentions at build time |
| Unset | Mock data | Section omitted |
