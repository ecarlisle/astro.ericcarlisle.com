---
type: operational-knowledge
title: Deployment
summary: Safe orientation to the site's deployment and contact-service boundaries.
tags: [deployment, github-pages, cloudflare, operations]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# Deployment

## Boundaries

The Astro site and the contact worker are separate deployable concerns. Changes to one should not assume that the other shares its runtime, environment, or release behavior.

## Site deployment

Inspect the current repository workflow, package scripts, Astro configuration, and hosting configuration before changing deployment behavior. Package-manager versions should have one unambiguous source of truth to prevent CI mismatches.

## Contact worker

The worker lives under `contact-worker/` with its own package and Cloudflare configuration. Secrets and service credentials belong in the deployment environment and must never be committed or copied into knowledge files.

## Safe operational practice

- Verify current configuration rather than relying on remembered commands.
- Distinguish local success from deployed success.
- Review build output and route behavior before release.
- Validate the contact flow end to end after worker, Turnstile, origin, or email-service changes.
- Record durable architectural decisions here, but leave live commands and secret names to authoritative configuration and protected operational documentation.

## Authoritative references

- current CI workflow files
- `package.json`
- `astro.config.mjs`
- `pnpm-workspace.yaml`
- `contact-worker/package.json`
- `contact-worker/wrangler.toml`
- deployment-provider settings

## Related knowledge

- [System architecture](../project/architecture.md)
- [Performance](../quality/performance.md)
