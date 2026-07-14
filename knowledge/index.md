---
type: knowledge-index
title: AstroBlog Knowledge
summary: Entry point for durable, agent-readable knowledge about the AstroBlog project.
tags: [astroblog, project-context, okf]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# AstroBlog Knowledge

This directory is a small Open Knowledge Format-compatible pilot for durable project knowledge.
It supplements the repository. It does not replace source code, tests, `AGENTS.md`, or existing documentation.

## How to use this knowledge

Start here, then follow only the links relevant to the task. Avoid loading the entire directory when a narrower path is sufficient.

When a knowledge file conflicts with executable code, configuration, tests, or current production behavior, treat those sources as authoritative and flag the knowledge file for review.

## Project

- [Project principles](project/principles.md)
- [System architecture](project/architecture.md)

## Design system

- [Design-system knowledge](design-system/index.md)
- [Design tokens](design-system/tokens.md)

## Content

- [Editorial voice](content/editorial-voice.md)

## Quality

- [Accessibility](quality/accessibility.md)
- [Performance](quality/performance.md)

## Operations

- [Deployment](operations/deployment.md)

## Pilot boundaries

This pilot intentionally does not modify or duplicate:

- `AGENTS.md`
- files under `docs/`
- Astro content-collection schemas
- published MDX article frontmatter
- commands and rules already maintained elsewhere

The purpose is to test whether a small, linked knowledge bundle improves agent orientation and decision quality before expanding it.
