# Content Status

**Use when:** Removing, replacing, or judging placeholder/test content, or deciding what content is
real.

This file is the single source for placeholder-content policy.

## Real or Near-Real Content

```txt
src/pages/about.astro
src/pages/contact.astro
src/pages/portfolio.astro
docs/author_profile.md
```

## Placeholder/Test Content

Most current blog posts are placeholder or test content. Their presence does not mean the writing
is final or ready to publish. They exercise:

- blog listings, pagination, and tag pages;
- search indexing, RSS, and sitemap generation; and
- post layout, hero images, typography, code blocks, and metadata rendering.

Keep placeholder posts unless removal was requested. Before removing one, confirm which of those
behaviors still have coverage.

## Replacement Plan

1. Preserve frontmatter schema compatibility.
2. Keep enough posts to test pagination until it is no longer needed.
3. Keep tag variety until tag pages are validated.
4. After major content changes, confirm RSS, sitemap, Pagefind, and Lighthouse behavior.
