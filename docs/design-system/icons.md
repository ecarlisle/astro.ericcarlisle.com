# Icon Workflow

**Use when:** Selecting, adding, changing, or reviewing UI icons.

The goal is a small, coherent, local icon set with no runtime icon system. Icons must stay easy to
audit, accessible, and cheap to ship.

## Source and approval

[Material Symbols](https://fonts.google.com/icons) is the default source. Use classic Material
Icons only when the approved symbol exists only there.

1. Confirm the icon improves scanning or recognition.
2. Select the exact icon name and variant.
3. Get reviewer or design-owner approval before vendoring. Record the family, style, fill, weight,
   grade, and optical size when they affect the SVG.
4. Use one family and treatment per related set. Do not mix filled, rounded, outlined, and sharp
   variants casually.

Approval covers that icon and variant, not the whole catalog.

## Implementation

- Vendor only the approved SVG path data. Never add an icon package, icon font, SVG archive,
  external URL, or runtime loader.
- Keep paths in a small typed Astro component or local module. Import it statically and choose
  paths through typed props, never through dynamic import paths.
- Inline SVGs at build time with `fill="currentColor"` so tokens control color.
- Add no HTTP requests, client JavaScript, or hydration.
- Add an SVG sprite only after measuring that icon use has grown substantially.

## Geometry

- Normalize paths to the shared viewBox `0 -960 960 960`, and use the approved path rather than
  redrawing it.
- Size compact tag icons consistently, typically `1em`.
- If an approved source uses strokes, share one stroke width, cap, and join across the set. Do not
  mix filled and stroked construction within a set unless it is deliberate and reviewed.
- Check optical alignment beside real labels at desktop and mobile sizes.

Accent color goes on the small icon or mark, not on large surfaces. Category accents are
non-semantic; success, warning, and error colors are reserved for real states.

## Accessibility

- An icon next to a text label is decorative: `aria-hidden="true"`, not focusable. The label
  carries the meaning; color and shape are only supplementary.
- Icon-only controls are a different pattern. They need an accessible name, visible focus, and the
  minimum touch target.

## Category mapping

The same tag always gets the same accent and icon.

1. Keep a typed identifier set beside the accent mapping in `src/lib/category-accents.ts`, or in a
   narrowly named sibling module.
2. Map known tags explicitly, including `design systems` and `performance`.
3. Use a stable fallback for unknown tags. Never choose by randomness or render order.
4. Update the mapping test when a known category changes.
5. Keep visible labels intact so URLs, RSS, and structured data do not change.

## Attribution

Material Symbols and Material Icons are Google's, under the
[Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE). Beside
each vendored path, add a short source comment with the icon name, variant, upstream URL, "Google",
and "Apache-2.0", and keep any upstream notice. There is no third-party notice file yet. If the set
grows beyond a few paths, consolidate attribution into one.

## Validation

- Review the component in light and dark themes at desktop and mobile sizes, including several tags
  together.
- Confirm decorative icons are hidden and controls keep their name and focus.
- Run the checks in [Testing](../testing.md#when-to-run-each-check) plus the accessibility tests.
- Confirm no dependency, bundle, font, request, or unrelated asset was added.
- Update the inventory or canonical example if the pattern changed materially.
