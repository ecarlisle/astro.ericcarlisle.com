# Analytics and Monitoring

**Use when:** Changing or debugging GA4, Sentry, or webmentions.

| Integration | State | Source |
|---|---|---|
| GA4 | Active on all pages, run in a Partytown web worker | `src/components/GoogleAnalytics.astro`; `GA_MEASUREMENT_ID` in `src/consts.ts` |
| Microsoft Clarity | Active on all pages, loaded on first user interaction or browser idle | `src/components/MicrosoftClarity.astro`; `CLARITY_PROJECT_ID` in `src/consts.ts` |
| Sentry | Installed, **inert** (no DSN) | `@sentry/astro` in `astro.config.mjs` |
| Webmentions | Live when `WEBMENTION_IO_TOKEN` is set | [Environment Variables](deployment-environment.md#frontend) |

## GA4

If events are missing, first rule out ad blockers, then check `GA_MEASUREMENT_ID`. Verify with GA DebugView and look for console errors.

## Microsoft Clarity

Clarity records sessions and heatmaps and sets cookies. It runs on the main thread, not in Partytown, because session recording needs synchronous DOM access. To keep it out of early load, the tag loads on the first pointer, key, scroll, or touch event, or on browser idle after `load`.

If recordings are missing, check ad blockers, then `CLARITY_PROJECT_ID`, then the Clarity dashboard.

## Sentry

Sentry captures nothing and initializes no SDK. Builds warn about a missing `authToken`. That warning is expected.

To enable Sentry:

1. Create a Sentry project and get its DSN.
2. Pass the DSN to `sentry({ dsn })` in `astro.config.mjs` (a protected file).
3. Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for source-map uploads.

## Webmentions

| Token | Development | Production |
|---|---|---|
| Set | Real webmentions at build time | Real webmentions at build time |
| Unset | Mock data | Section omitted |
