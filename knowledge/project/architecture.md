---
type: system-architecture
title: AstroBlog System Architecture
summary: Orientation to the project's major runtime, content, styling, and service boundaries.
tags: [astro, architecture, content, cloudflare]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# System Architecture

## Overview

AstroBlog is an Astro-based personal site and technical publication. It favors static output, content collections, semantic templates, shared components, centralized styles, and minimal client-side behavior.

## Major areas

### Pages and routing

Page routes live under `src/pages/`. Dynamic blog and tag routes derive their content from the blog collection.

### Published content

Blog entries live under `src/content/blog/` and are governed by `src/content.config.ts`. Published content should continue to follow the Astro collection schema rather than being converted into this knowledge format.

### Layouts and components

`src/layouts/BlogPost.astro` provides the primary article layout. Shared interface elements live in `src/components/`.

### Styling and design tokens

Global foundations and tokens live primarily in `src/styles/global.css`. Shared component-level styling lives primarily in `src/styles/components.css`. Inspect the current files before changing a token or assuming a value.

### Metadata and structured data

Head metadata and schema-related behavior are implemented through components such as `BaseHead.astro` and `SchemaOrg.astro`.

### Search, feeds, and discovery

The repository includes RSS generation, tag routes, and Pagefind-specific styling. Configuration and build output remain the authoritative sources for current behavior.

### Contact service

The contact form's service boundary lives under `contact-worker/`, separate from the Astro application. It uses Cloudflare Worker configuration and external service secrets that must never be committed.

### Build and validation

Project commands are defined by `package.json` and related configuration. Lighthouse configuration and scripts support performance validation. Do not copy command lists into this pilot while `AGENTS.md` and existing documentation remain unchanged.

## Architectural direction

Changes should preserve static delivery where practical, avoid unnecessary hydration, maintain content-schema integrity, and keep the contact service isolated from the public frontend.

## Authoritative references

- `astro.config.mjs`
- `package.json`
- `src/content.config.ts`
- `src/pages/`
- `src/layouts/`
- `src/components/`
- `src/styles/`
- `contact-worker/`

## Related knowledge

- [Project principles](principles.md)
- [Design-system knowledge](../design-system/index.md)
- [Deployment](../operations/deployment.md)
