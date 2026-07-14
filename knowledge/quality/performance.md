---
type: quality-standard
title: Performance
summary: Performance priorities and verification guidance for the AstroBlog project.
tags: [performance, core-web-vitals, lighthouse, astro]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# Performance

Performance is part of the reading experience and should be protected throughout design and implementation.

## Priorities

- Keep client-side JavaScript limited and purposeful.
- Preserve Astro's static and server-first advantages.
- Optimize responsive images and avoid oversized assets.
- Limit render-blocking work and unnecessary dependency chains.
- Protect layout stability by reserving space for media and dynamic elements.
- Load fonts and third-party scripts deliberately.
- Avoid adding dependencies when the platform or a small local implementation is sufficient.
- Evaluate changes on mobile-sized viewports and constrained conditions, not only a fast desktop machine.

## Measurement

Use repository scripts and configuration as the authority for current validation. Lighthouse provides useful lab evidence, while real-user behavior and production telemetry, when available, reveal conditions that lab tests may miss.

Do not encode fixed score thresholds in this pilot unless the project formally adopts and maintains them elsewhere.

## Regression review

For changes affecting layout, images, fonts, navigation, scripts, or third-party services, compare relevant metrics and inspect the visual result. A numerical improvement does not justify degraded readability or accessibility.

## Authoritative references

- `lighthouserc.js`
- `scripts/lighthouse-all.mjs`
- `scripts/static-server.mjs`
- `astro.config.mjs`
- `package.json`

## Related knowledge

- [Project principles](../project/principles.md)
- [System architecture](../project/architecture.md)
