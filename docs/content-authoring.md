# Content Authoring

**Use when:** Creating, drafting, publishing, unpublishing, updating, or renaming a blog article.

Frontmatter fields are defined in [Content Model](content-model.md). Voice guidance is in [Editorial Guidelines](editorial-guidelines.md). Validation commands are in [Testing](testing.md#when-to-run-each-check).

## Create an article

Add a `.md` or `.mdx` file to `src/content/blog/`. The filename becomes the slug: `my-article.mdx` → `/blog/my-article/`. Use MDX only when the body imports Astro components, and keep component use minimal.

```yaml
---
title: 'Your Article Title'
description: 'Search-snippet summary, 165 characters or fewer.'
pubDate: '2025-01-15T00:00:00-05:00'
tags: ['css', 'accessibility']
heroImage: '@images/my-hero.webp'
coverAlt: 'What the image actually shows'
---
```

- **Title** renders as `Article Title | Eric Carlisle`.
- **Description** feeds search results, social cards, and RSS. Write it as a snippet, not a subtitle.
- **Tags** drive `/tags/[tag]/`, the blog tag filter, and structured data. Use lowercase, hyphenated tags that name a technical domain. Reuse existing tags from `/tags/` before adding new ones.
- **Images** live in `src/assets/images/` and are referenced with `@images/`. Hero images should be at least 1200px wide, compressed (WebP), and not overly tall.
- **`coverAlt`** is required with `heroImage`. Describe what the image shows (for example, "Side-by-side comparison of a 3D-printed card box and its lid"), not "Hero image." Body images also need alt text.

## Drafts

`draft: true` removes an article from every output: its route, listings, tags, RSS, the sitemap, Pagefind, and structured-data lists. The filter is `getSortedPosts()` in `src/lib/blog-utils.ts` and applies in development too. To preview a draft, remove the flag temporarily and restore it before committing.

## Publish and unpublish

- **Publish:** remove `draft: true` (or set it to `false`), then deploy.
- **Unpublish:** add `draft: true`. The URL returns 404 and the article leaves every listing. Do not add a redirect unless there is a replacement destination.

## Update an article

Set `updatedDate` only for meaningful changes, such as a corrected technical error, significant new information, or a changed recommendation. Do not set it for typos, punctuation, wording tweaks, or formatting. It shows on the page and in structured data `dateModified`.

After changing the title, description, or tags, run `pnpm build` and check the built `<title>`, meta description, Open Graph tags, and tag listings.

## Rename or move an article

A slug change breaks internal and external links, RSS references, search indexes, and bookmarks. Avoid it. When it is unavoidable:

1. Rename the file.
2. Add `src/pages/blog/<old-slug>.astro` containing `return Astro.redirect('/blog/<new-slug>/', 301);` in its frontmatter. Use `src/pages/blog/good-agent-context-is-carved-not-copied.astro` as the model.
3. `scripts/seo-policy.mjs` detects the alias automatically: it becomes `noindex` and is excluded from the sitemap. Add a row to the [indexing policy](performance-seo-accessibility.md#indexing-and-sitemap-policy).
4. Update internal links to the new slug.

Use redirects only for permanent moves or merged content. Never use them for drafts or temporary unpublishing.

## Publishing checklist

- [ ] `title`, `description` (≤165 characters), and `pubDate` are set
- [ ] `tags` reuse existing conventions
- [ ] `coverAlt` is meaningful if `heroImage` is set
- [ ] `draft` is removed
- [ ] The page renders at `/blog/[slug]/`
- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] The article appears in the blog index, RSS, sitemap, and `/search/`
- [ ] Social preview, internal links, and images work
