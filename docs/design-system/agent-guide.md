# Design System Inventory

**Use when:** Styling, tokens, themes, or reusable visual patterns are in scope and you need to query or update `inventory.json`.

[inventory.json](inventory.json) is the authoritative catalog of reusable KISS Design System patterns. Query only the entries that match the task; do not load the whole file. The design system overview is in [README.md](README.md).

## How agents should use inventory.json

1. **Look up the pattern before building UI.** Match on `name` and `kind`, then read `source`.
2. **Respect its scope.** `purpose`, `whenToUse`, and `whenNotToUse` bound each pattern. For example, Tag / Chip are metadata labels, not navigation.
3. **Read the implementation.** `source` is the implementing file, and `styleSources` lists every contributing CSS file. Read them before modifying a pattern.
4. **Keep accessibility intact.** Preserve `accessibilityNotes` when you modify a pattern, and carry them over when you reuse it.
5. **Compose instead of duplicating.** `relatedPatterns` lists patterns that commonly combine with this one.
6. **Check status.**

| Status | Meaning |
|---|---|
| `stable` | Production-ready; breaking changes need migration |
| `deprecated` | Do not use in new contexts |
| `experimental` | May change |

7. **Add missing examples.** `canonicalExample: null` means there is no demonstration. When you significantly change such a pattern, consider adding one to `/portfolio/design-system/`. The anchors (for example `#card`) match explicit `id`s on the demo headings.

## Not in the inventory

These are intentionally excluded because they are not design patterns:

- agent-infrastructure plugins (Graphify, OpenCode, Pi);
- Astro-generated types and content-collection helpers;
- author, analytics, and deployment constants;
- UI-less utility functions; and
- third-party overlays restyled with tokens (the Pagefind UI and the Turnstile widget).
