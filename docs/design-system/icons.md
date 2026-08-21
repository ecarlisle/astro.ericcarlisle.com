# Icon Workflow

This workflow governs UI icons in the KISS Design System. It is written for designers,
developers, reviewers, and coding agents working in any tool.

The goal is a small, coherent local icon set that supports the adjacent text without adding a
runtime icon system. Icons must remain easy to audit, accessible, and inexpensive to ship.

## Source and Approval

[Material Symbols](https://fonts.google.com/icons) is the catalog and source for UI icons. Material
Icons may be used when the approved symbol is available only in the classic set, but Material
Symbols is the default for new selections.

Before adding an icon:

1. Identify the UI concept and confirm that an icon improves scanning or recognition.
2. Select the exact icon name and variant in the Material catalog.
3. Confirm the style with the reviewer or design owner before vendoring it. Record the family,
   style, fill, weight, grade, and optical size when those choices affect the exported SVG.
4. Prefer one coherent family and treatment for a related set. Do not mix filled, rounded,
   outlined, and sharp variants casually.

Approval applies to the specific icon and variant, not to the full Material catalog.

## Local Implementation

Vendor only the approved SVG path data needed by the site. Do not add an icon package, icon font,
complete SVG archive, external image URL, or runtime loader.

For the current five-icon use case:

- Keep the selected paths in a small typed Astro component or local module.
- Import that Astro icon component statically at the top of each consumer; select typed local path
  data through props rather than constructing component import paths dynamically.
- Inline the selected SVG at build time.
- Use `currentColor` so the existing design tokens control presentation.
- Keep the icon decorative when an adjacent text label already conveys the meaning.
- Do not add HTTP requests, a runtime icon dependency, client-side JavaScript, or hydration.
- Do not copy unrelated Material assets into the repository.

A shared SVG symbol sprite may become more efficient if icon use grows substantially across many
components or repeated instances. Introduce one only after measuring that need; the five-icon set
does not justify a broader asset system.

## Geometry and Visual Consistency

Use one geometry convention across a related icon set:

- Use the component's shared viewBox, `0 -960 960 960`, and normalize source paths to that
  coordinate system.
- Size compact tag icons consistently, typically with CSS relative units such as `1em`.
- Preserve the approved source path rather than redrawing it ad hoc.
- Use `fill="currentColor"` for filled Material paths. If an approved source genuinely uses strokes,
  use one shared stroke width, line cap, and line join across that set.
- Do not mix filled-path and stroked-outline construction within one category set unless the visual
  difference is deliberate and reviewed.
- Check optical alignment beside real labels at desktop and mobile sizes; equal viewBoxes do not
  guarantee equal perceived size.

Accent color belongs on the compact icon or tiny mark, not on large surfaces. Category accents are
non-semantic; semantic success, warning, and error colors remain reserved for actual states.

## Accessibility

Text labels carry the meaning for informational tags and categories. A redundant adjacent icon must
use `aria-hidden="true"` and must not receive focus. Color and icon shape are supplementary cues,
not the only way a category is identified.

An icon-only interactive control is a different pattern: it requires an accessible name, a visible
focus treatment, and the repository's minimum touch target. Do not reuse the decorative-tag rule for
controls.

## Deterministic Category Mapping

Keep category selection deterministic so the same tag always receives the same accent and icon.
When the icon set is implemented:

1. Add a typed five-icon identifier set beside the existing category accent mapping.
2. Map known tag/category names explicitly, including `design systems` and `performance`.
3. Use a stable fallback for unknown tags; never select an icon randomly or by render order.
4. Update the mapping test whenever a known category changes.
5. Keep the visible label intact so mapping changes do not alter content meaning, URLs, RSS, or
   structured data.

The deterministic accent source currently lives in `src/lib/category-accents.ts`. Keep any future
tag-to-icon mapping adjacent to that source or in a narrowly named sibling module so the two mappings
remain easy to review without becoming coupled to client-side code.

## Source and License Attribution

Material Symbols and Material Icons are provided by Google under the
[Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE).

For every vendored path:

- Record the Material icon name, family/variant, and upstream catalog or repository URL in a concise
  source comment beside the local path definition.
- Identify Google as the upstream source and Apache-2.0 as the license.
- Preserve any copyright or notice information supplied with the selected upstream asset.
- If the local set grows beyond a few inline paths, consolidate attribution in a repository-level or
  icon-directory third-party notice rather than repeating long notices in implementation files.

The repository currently has no general third-party notice file. The first change that vendors a
Material SVG should add the concise source comment above and confirm whether a shared notice file is
warranted during review.

## Validation

Before completing an icon change:

- Review the real component in light and dark themes at desktop and mobile sizes.
- Confirm labels, wrapping, spacing, and density remain calm when several tags appear together.
- Verify decorative icons are hidden from assistive technology and interactive controls retain an
  accessible name and visible focus.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and the relevant accessibility tests.
- Confirm no icon dependency, client bundle, font, HTTP request, or unrelated asset archive was
  introduced.
- Update the design-system inventory or canonical example when the reusable pattern materially
  changes.
