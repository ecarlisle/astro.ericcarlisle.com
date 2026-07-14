---
type: quality-standard
title: Accessibility
summary: Accessibility principles and verification expectations for the AstroBlog project.
tags: [accessibility, wcag, semantic-html, quality]
status: pilot
timestamp: 2026-07-14T00:00:00-04:00
---

# Accessibility

Accessibility is a system property spanning structure, styling, content, interaction, and testing.

## Expectations

- Use semantic HTML before adding ARIA.
- Maintain a logical heading structure and meaningful landmarks.
- Ensure interactive elements have accessible names and appropriate native behavior.
- Preserve keyboard access and visible focus treatment.
- Keep text and meaningful interface states at appropriate contrast.
- Associate form controls with clear labels, instructions, and errors.
- Provide meaningful alternative text for informative images and empty alternatives for decorative images.
- Respect motion and theme preferences where applicable.
- Avoid relying on color alone to communicate state.
- Test responsive navigation and controls at narrow widths and zoomed layouts.

## Validation

Automated checks are useful but incomplete. Pair them with keyboard review, focus-order inspection, responsive testing, semantic inspection, and representative screen-reader checks when behavior changes.

## Change discipline

When modifying a shared component or token, inspect all states and representative uses. A change that passes in isolation can still create a regression elsewhere.

## Authoritative references

- current component and page implementation
- current CSS focus and theme rules
- existing project validation configuration
- the current design-system accessibility reference

## Related knowledge

- [Project principles](../project/principles.md)
- [Design tokens](../design-system/tokens.md)
