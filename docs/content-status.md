# Content Status

The AstroBlog codebase is close to feature-complete, but much of the current blog content is
placeholder or test content. It exists to validate:

- Blog listing pages
- Pagination
- Tag pages
- Search indexing
- Post layout
- Hero images
- Typography
- Code block styling
- Metadata rendering
- RSS and sitemap generation

Do not treat every current post as final editorial content, and do not delete placeholder posts
without considering the behaviors they support.

## Real or Near-Real Content

```txt
src/pages/about.astro
src/pages/contact.astro
src/pages/portfolio.astro
docs/author_profile.md
src/content/blog/working-with-id-without-losing-ourselves.mdx
```

Verify whether `working-with-id-without-losing-ourselves.mdx` should be renamed to
`working-with-ai-without-losing-ourselves.mdx`.

## Placeholder/Test Content

Most current technical blog posts appear to support style, taxonomy, pagination, and functionality
testing. They may contain useful examples, but their presence does not indicate that their editorial
content is final or ready to publish.

## Replacement Plan

1. Preserve frontmatter schema compatibility.
2. Preserve enough posts to test pagination until pagination is no longer needed.
3. Preserve tag variety until tag pages are validated.
4. Confirm RSS, sitemap, Pagefind, and Lighthouse behavior after major content changes.
