---
type: design-token-system
title: Design Tokens
summary: Intent and authority rules for the site's color, typography, spacing, and layout tokens.
tags: [design-tokens, css, typography, spacing, color]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# Design Tokens

## Purpose

Tokens provide a shared vocabulary for visual decisions. They should reduce arbitrary values, make theme behavior predictable, and keep implementation and design references aligned.

## Token groups

The implemented system includes tokens for concerns such as:

- color and theme roles
- typography and fluid type sizes
- spacing and rhythm
- inline, component, section, and layout spacing aliases
- borders, radii, shadows, and focus treatments where defined
- content and layout widths

## Rules

- Inspect `src/styles/global.css` before naming or changing a token.
- Prefer semantic aliases over repeating raw values in components.
- Avoid documenting numeric values here because they can drift from implementation.
- Update affected light and dark theme roles together.
- Verify contrast when changing foreground, background, border, focus, or interactive-state colors.
- Check representative pages and the design-system reference after token changes.

## Spacing intent

Spacing should communicate relationship and hierarchy. Small aliases serve inline relationships; component aliases support internal padding; section and layout aliases separate larger structural regions.

## Typography intent

Typography should maintain readable article measure, clear hierarchy, responsive scaling, and a consistent distinction among display, body, and monospaced content.

## Authoritative references

- `src/styles/global.css`
- `src/styles/components.css`
- the current Figma design-system file for visual reference

## Related knowledge

- [Design-system knowledge](index.md)
- [Accessibility](../quality/accessibility.md)
