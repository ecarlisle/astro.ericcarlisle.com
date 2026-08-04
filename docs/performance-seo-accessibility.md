# Performance, SEO, and Accessibility

This site prioritizes:

- Fast static pages
- Minimal JavaScript
- Semantic HTML
- Clear heading hierarchy
- Accessible navigation
- Responsive images
- Useful metadata
- Valid RSS and sitemap output
- Search indexing through Pagefind

## Performance Rules

Before adding client-side JavaScript, check whether the behavior can be handled with Astro, HTML, or
CSS.

Avoid unnecessary hydration.

Avoid heavy third-party embeds.

Use Astro image handling for source images when possible.

## SEO Rules

Every indexable page should have:

- A clear title
- A useful description
- Canonical metadata
- Appropriate Open Graph metadata
- Sensible heading hierarchy
- Internal links where useful

Preserve structured data, RSS output, sitemap generation, and stable route URLs when changing page
or content architecture.

## Validation

| Area | Command |
|------|--------|
| Performance, accessibility, SEO | `pnpm lighthouse:all` |
| Structured data | `pnpm structured-data:report` |
| TypeScript and Astro | `pnpm typecheck` |

## Accessibility Rules

Preserve:

- Skip link
- Focus-visible states
- Reduced-motion handling
- Keyboard-accessible navigation
- Meaningful alt text
- Minimum touch target sizes
- Heading permalinks: content-section headings with a stable deep link carry an explicit lowercase kebab-case `id` and a sibling, non-nested chain-link anchor (`aria-hidden` icon + `aria-label`), a visible `:focus-visible` ring, 44px touch target, `scroll-margin-top` so fragments clear the fixed header, a `:target` highlight that becomes a static inset accent bar under reduced motion, and icon binding to the final title word so it never orphans — all with no runtime JavaScript.
