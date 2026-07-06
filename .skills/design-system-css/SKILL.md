# Design System CSS Skill

Use this skill when editing styles, spacing, typography, layout, or component appearance.

## Priorities

- Use existing CSS custom properties and design tokens.
- Prefer semantic class names.
- Avoid one-off hard-coded values unless the project already uses that pattern.
- Keep layout rules simple.
- Preserve responsive behavior.
- Avoid adding broad global styles unless necessary.
- Do not rewrite unrelated styles.

## Workflow

1. Inspect existing tokens and component styles.
2. Reuse spacing, typography, color, and layout variables where possible.
3. Make the smallest targeted style change.
4. Check light and dark modes.
5. Check mobile and desktop behavior.

## Verification

- Confirm styles do not break adjacent components.
- Confirm focus, hover, and active states remain visible.
- Confirm spacing changes are intentional and token-based.
