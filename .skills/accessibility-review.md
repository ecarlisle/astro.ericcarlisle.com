# Accessibility Review Skill

Use this skill when adding or changing UI.

## Requirements

- Use semantic elements before ARIA.
- Links navigate. Buttons perform actions.
- Every icon-only control must have an accessible name.
- Keyboard focus must be visible.
- Interactive elements must be reachable and usable by keyboard.
- Preserve heading order.
- Use one clear h1 per page.
- Avoid hiding meaningful content from assistive tech.
- Respect reduced-motion preferences for animation.

## Checks

- Confirm icon links have aria-label or visually hidden text.
- Confirm theme toggles, search links, nav links, and social links have accessible names.
- Confirm color contrast remains usable in light and dark modes.
- Confirm repeated layout chrome can be excluded from search indexing when appropriate.
