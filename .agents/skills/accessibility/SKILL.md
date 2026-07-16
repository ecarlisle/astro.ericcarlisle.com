---
name: accessibility
title: Accessibility Review
description: Use this skill when adding, changing, or reviewing UI for keyboard, screen reader, semantic, motion, and contrast accessibility.
category: design
applies_to:
  - HTML
  - CSS
  - ARIA
  - UI components
  - forms
  - navigation
triggers:
  - accessibility
  - keyboard
  - screen reader
  - ARIA
  - focus
  - contrast
  - motion
  - semantic HTML
priority: high
version: 1
---
Accessibility Review Skill

Use this skill whenever adding, changing, or reviewing UI, especially interactive components, navigation, forms, dialogs, theme controls, search, and social links.

This skill applies WCAG-aligned accessibility checks, semantic HTML guidance, ARIA best practices, keyboard usability expectations, and reduced-motion considerations. It is intended for practical UI review, not as a complete formal WCAG audit.

Goal

Identify accessibility barriers and fix them with the smallest effective change. Prefer semantic HTML and native browser behavior before adding ARIA or custom interaction logic.

Core Requirements

* Use semantic HTML before ARIA.
* Links navigate. Buttons perform actions.
* Use one clear h1 per page.
* Preserve logical heading order.
* Every interactive control must have an accessible name.
* Every icon-only control must have an accessible name, either through visible text, visually hidden text, or an appropriate aria-label.
* Interactive elements must be reachable and usable by keyboard.
* Keyboard focus must be visible and not hidden or removed.
* Do not use positive tabindex values.
* Do not hide meaningful content from assistive technologies.
* Ensure form fields have persistent labels.
* Do not use placeholder text as the only label.
* Associate form errors and helper text with the relevant field.
* Respect reduced-motion preferences for animation.
* Do not add ARIA when native HTML already provides the correct semantics.

Review Checks

Check for the following common issues:

* Icon links, icon buttons, theme toggles, search controls, navigation links, and social links have accessible names.
* Buttons, links, inputs, selects, textareas, and custom controls are keyboard usable.
* Focus order follows the visual and logical page flow.
* Focus states are visible in light and dark modes.
* Color contrast remains usable in light and dark modes.
* Images that convey meaning have useful alt text.
* Decorative images are hidden from assistive technologies.
* Repeated layout chrome can be excluded from search indexing when appropriate.
* Dynamic content changes are announced only when necessary.
* Custom widgets expose the correct role, name, state, value, and keyboard behavior.
* Dialogs, menus, popovers, accordions, tabs, and disclosure controls manage focus correctly.
* Motion, animation, autoplay, and transitions respect prefers-reduced-motion.

Fix Guidance

When fixing an accessibility issue:

1. Quote or describe the problematic UI or code.
2. Explain the accessibility problem briefly.
3. Apply the smallest targeted fix.
4. Prefer native elements over custom behavior.
5. Avoid broad refactors unless the current structure prevents an accessible fix.
6. Verify the fix with keyboard behavior, visible focus, names, roles, and states.

Verification

After making changes, verify:

* Tab and Shift+Tab move through controls in a logical order.
* Enter and Space activate controls where expected.
* Escape closes dialogs, menus, and popovers where expected.
* Focus is visible at all times.
* Focus is restored after closing dialogs or temporary UI.
* Inputs expose labels, descriptions, and errors correctly.
* Automated accessibility checks pass where available.
* Manual review confirms the behavior, not just the markup.

ARIA Rules

Use ARIA only when native HTML cannot express the required meaning or state.

Good ARIA uses include:

* aria-label or aria-labelledby for controls without visible text.
* aria-expanded for disclosure controls.
* aria-controls when a control manages another element.
* aria-current for the current navigation item.
* aria-describedby for helper text or error text.
* aria-invalid for invalid form fields.
* aria-live for important dynamic updates that are not otherwise announced.

Avoid:

* Adding roles that duplicate native semantics.
* Using ARIA to make non-interactive elements act interactive.
* Hiding focus outlines without replacing them.
* Using div or span where button, a, label, input, nav, main, header, footer, or section would be more appropriate.
* Overusing live regions.
* Adding accessibility attributes only to satisfy a scanner without improving user experience.

Output Format

When reporting findings, use this format:

### Issue: [short name]
**Where:** [component, file, or UI area]
**Problem:** [brief explanation]
**Fix:** [specific recommendation or code change]
**Verify:** [keyboard, screen reader, contrast, or behavior check]
