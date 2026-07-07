# Portfolio Link to Design System Companion

## Status

ready

## Context

The site has a curated `Design System Companion` page at `/portfolio/design-system/` that documents the implemented typography, color tokens, spacing scale, layout rails, components, accessibility decisions, and implementation tradeoffs. The portfolio page is the natural place to surface this page as evidence of frontend architecture, design-system thinking, documentation quality, accessibility awareness, and implementation tradeoff awareness.

## Goal

Add a subtle "Supporting Artifacts" section near the bottom of the portfolio page that links to `/portfolio/design-system/` and frames the page as a portfolio artifact.

## Non-goals

- Do not add the design-system page to the main navigation.
- Do not add the design-system page to the footer.
- Do not remove `noindex, follow` from the design-system page yet.
- Do not redesign the design-system page itself.
- Do not change the portfolio case-study content.

## Requirements

1. Add a section titled "Supporting Artifacts" to `src/pages/portfolio.astro`.
2. Place the section near the bottom of the page, after the main case-study content.
3. Include introductory copy that frames the portfolio as a design-system exercise.
4. Include a card or link block titled "Design System Companion" with a short description and a CTA.
5. Link to `/portfolio/design-system/`.
6. Match the existing portfolio page style and token usage.
7. Keep the section subtle and professional.

## Constraints

- Use existing CSS custom properties and components where possible.
- Keep page-local styles minimal and token-based.
- Do not alter global styles unless clearly necessary.
- Preserve the design-system page's `noindex, follow` metadata.
- Preserve the design-system page's `data-pagefind-ignore` behavior.

## Acceptance Criteria

- [ ] The portfolio page renders a "Supporting Artifacts" section.
- [ ] The section links to `/portfolio/design-system/`.
- [ ] The link/copy frames the page as evidence of architecture, design-system thinking, documentation, accessibility, and tradeoff awareness.
- [ ] The design-system page is not added to the main navigation.
- [ ] The design-system page is not added to the footer.
- [ ] The section uses existing portfolio styling conventions.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm lint` passes or only shows pre-existing `.pi/` formatting errors.

## Validation

- `pnpm typecheck`
- `pnpm build`
- `pnpm lint`

## Files likely affected

- `src/pages/portfolio.astro`

## Notes / open questions

- None.
