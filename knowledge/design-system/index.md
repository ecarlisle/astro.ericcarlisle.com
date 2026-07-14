---
type: knowledge-index
title: Design-System Knowledge
summary: Navigation and authority rules for the implemented and Figma design system.
tags: [design-system, css, figma, components]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# Design-System Knowledge

The design system exists across implemented CSS and components, plus a Figma reference used to communicate tokens, component relationships, modes, accessibility, and usage.

## Sources of truth

For shipped behavior, inspect the implementation first:

1. `src/styles/global.css`
2. `src/styles/components.css`
3. the relevant file under `src/components/`
4. the page or layout that composes the component

Figma should accurately represent the implemented system, but it does not override production code when the two differ.

## Guidance

- Reuse established tokens before introducing one-off values.
- Preserve consistent spacing inside component-example containers.
- Keep component documentation visually clear and avoid unnecessary nested-card presentation.
- Use the same text treatments, colors, spacing, and interaction states as the implemented site unless the artifact is explicitly exploring a proposed change.
- Verify icons as icons rather than placeholder letters or fallback glyphs.
- Treat light and dark themes as related modes of one system, not separate unconnected designs.

## Knowledge

- [Design tokens](tokens.md)
- [Accessibility](../quality/accessibility.md)

## Implementation references

- `src/styles/global.css`
- `src/styles/components.css`
- `src/components/`
- `src/pages/portfolio/design-system.astro`, when present in the current repository
