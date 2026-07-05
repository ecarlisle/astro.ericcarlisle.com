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

## Accessibility Rules

Preserve:

- Skip link
- Focus-visible states
- Reduced-motion handling
- Keyboard-accessible navigation
- Meaningful alt text
- Minimum touch target sizes
