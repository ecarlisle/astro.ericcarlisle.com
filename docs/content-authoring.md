# Content Authoring

A practical guide to creating, previewing, publishing, and maintaining blog content on ericcarlisle.com.

For the complete frontmatter schema, see [content-model.md](content-model.md) and the authoritative source in [`src/content.config.ts`](../src/content.config.ts). For voice and editorial standards, see [editorial-guidelines.md](editorial-guidelines.md).

## Content Types

The site currently supports one content type: **blog articles**.

Blog articles live in:

```
src/content/blog/
```

Files can be `.md` (Markdown) or `.mdx` (MDX). MDX is used when articles need embedded Astro components. The filename (without extension) becomes the URL slug:

```
src/content/blog/my-article-title.mdx  →  /blog/my-article-title/
```

## Creating an Article

Create a new `.md` or `.mdx` file in `src/content/blog/`. The filename determines the slug.

### Required Frontmatter

```yaml
---
title: 'Your Article Title'
description: 'A concise summary of the article, 165 characters or fewer.'
pubDate: '2025-01-15T00:00:00-05:00'
---
```

### Optional Frontmatter

```yaml
---
draft: true                           # Exclude from production builds
updatedDate: '2025-03-01T00:00:00-05:00'  # Show when article was meaningfully updated
tags: ['javascript', 'css']           # Used for tag pages and filtering
heroImage: '@images/my-hero.webp'     # Displayed at top of article
coverAlt: 'Description of the image'  # Required when heroImage is set
socialTitle: 'Short title for social' # Overrides page title in OG/Twitter (max 60 chars)
socialDescription: 'Social preview description'  # Overrides description (max 200 chars)
socialImage: '@images/my-social.jpg'  # Overrides hero image for social cards
twitterHandle: '@ericcarlisle'        # Adds twitter:creator meta tag
share:
  enabled: true                       # Defaults to true
  networks: ['twitter', 'linkedin']   # Restrict sharing to specific networks
  scheduledFor: '2025-02-01'          # Future publication date for share scheduling
---
```

### Title and Description

- **title**: The article heading. Displayed in the page `<title>` as `Article Title | Eric Carlisle`.
- **description**: A concise summary shown in search results, social cards, and RSS. Limited to 165 characters. Write for search snippets, not as a subtitle.

### Dates

- **pubDate**: Required. The original publication date. Used for sort order, RSS `<pubDate>`, and structured data.
- **updatedDate**: Optional. Set this when you make a meaningful update to an already-published article. It appears on the article page and in structured data `dateModified`. Do not set it for typo fixes or minor wording changes.

### Tags

Tags are an optional array of strings. They drive:

- Tag pages at `/tags/[tag]/`
- Tag filter UI on the blog index
- Structured data `article:tag` and `keywords`

Use lowercase, hyphenated tags that describe the article's technical domain (e.g., `css`, `accessibility`, `astro`). Check existing tags on the [tags index](/tags/) before creating new ones.

### Images

Article images live in `src/assets/images/`. Reference them with the `@images` alias:

```yaml
heroImage: '@images/my-article-hero.webp'
```

The `heroImage` field uses Astro's image pipeline. Astro processes, optimizes, and generates responsive formats at build time.

**coverAlt** is required when `heroImage` is set. Write descriptive alt text that conveys what the image shows, not just its file purpose.

**socialImage** is optional. When set, it overrides the hero image for Open Graph and Twitter card previews. Use this when the hero image dimensions or content don't work well as a social card.

### MDX Usage

MDX files can import and use Astro components directly in article body content:

```mdx
import MyComponent from '@components/MyComponent.astro';

Some text before the component.

<MyComponent prop="value" />

More text after.
```

This is useful for embedding interactive widgets, custom callouts, or structured content patterns. Keep component usage minimal and purposeful.

## Draft Workflow

The project supports a `draft: true` frontmatter field. Draft articles are excluded from:

- Generated article routes (no page is built)
- Homepage "Latest writing" listings
- Blog index and paginated listings
- Tag pages
- RSS feed
- Sitemap
- Pagefind search index
- Structured-data collection lists

### Drafts in Development

Drafts are excluded in **both development and production**. The filtering happens in the shared `getSortedPosts()` utility function in `src/lib/blog-utils.ts`, which is used by every content consumer. There is currently no mechanism to preview draft articles locally.

If you need to preview a draft article, temporarily remove `draft: true`, preview, then restore it before committing.

### Marking an Article as a Draft

Add `draft: true` to the frontmatter:

```yaml
---
draft: true
title: 'My Work-in-Progress'
---
```

The source file remains in the repository. The article simply won't appear in any published output.

## Preview and Validation

### Local Development

```sh
pnpm dev
```

The dev server runs at `http://localhost:4321`. Navigate to your article at `/blog/[slug]/` to preview it.

### Validation Sequence

After writing or editing an article, run these checks in order:

1. **Type and schema validation:**

   ```sh
   pnpm typecheck
   ```

   Catches frontmatter that doesn't match the content schema.

2. **Lint:**

   ```sh
   pnpm lint
   ```

   Catches code style issues in any modified files.

3. **Production build:**

   ```sh
   pnpm build
   ```

   Verifies the article generates correctly, RSS includes it, sitemap lists it, and Pagefind indexes it.

4. **Structured data** (when adding or changing metadata):

   ```sh
   pnpm structured-data:report
   ```

   Validates JSON-LD output for the article page.

## Publishing and Unpublishing

### Publishing a Draft

Remove `draft: true` from the frontmatter (or set `draft: false`). Commit and deploy. The article will appear in all publication surfaces on the next build.

### Unpublishing a Published Article

Add `draft: true` to the frontmatter. On the next build:

- The article page returns **404**
- The article is removed from listings, RSS, sitemap, and search

This is the expected behavior for temporarily unpublished content. No redirect is needed unless you have a specific replacement destination.

### Redirects

Redirects are appropriate when:

- A published article moves to a new URL permanently
- Content is merged into another article

Redirects are not appropriate when:

- An article is temporarily unpublished
- An article is still in draft status

The project does not currently have a redirect mechanism. If redirects become needed, they should be added to the Cloudflare Worker or a `_redirects` file.

## Updating an Article

### When to Use `updatedDate`

Set `updatedDate` when you make a **meaningful** change to an already-published article:

- Correcting a technical error
- Adding significant new information
- Changing recommendations or approaches

Do **not** set `updatedDate` for:

- Typo fixes
- Punctuation corrections
- Minor wording improvements
- Formatting adjustments

### Preserving Stable URLs

The article slug is derived from the filename. Renaming the file changes the URL and breaks:

- Existing links (internal and external)
- RSS feed references
- Search engine indexes
- Bookmarks

Avoid renaming published articles. If a rename is necessary, plan for broken links.

### Checking Internal Links

After updating an article, verify that:

- Links to other articles on the site still work
- Links to tag pages are valid
- Any referenced images or assets still exist

### Verifying Metadata

If you change an article's title, description, or tags:

- Run `pnpm build` to regenerate RSS, sitemap, and search index
- Check the article's `<title>`, `meta description`, and Open Graph tags in the built output
- Verify the article appears correctly in tag listings

## Images and Accessibility

### Source Location

All article images live in `src/assets/images/`. Astro processes these at build time.

### Image Dimensions

Use appropriately sized hero images. The blog layout renders hero images at responsive sizes. Images should be:

- At least 1200px wide for social card rendering
- Reasonably sized for web delivery (compressed, modern formats like WebP)
- Not excessively tall — the hero area has a natural height limit

### Alt Text

The `coverAlt` field provides alt text for the hero image. Write alt text that:

- Describes what the image actually shows
- Is useful for screen reader users
- Is concise but specific

```yaml
# Good
coverAlt: 'Side-by-side comparison of a 3D-printed card box and its lid'

# Avoid
coverAlt: 'Hero image'
coverAlt: 'Photo'
```

### Images in Article Body

Use standard Markdown image syntax or Astro's `Image` component for images within the article body. Provide alt text for all images.

## Publishing Checklist

Before publishing a new article, confirm:

- [ ] File is in `src/content/blog/` with a descriptive filename
- [ ] `title`, `description`, and `pubDate` are set
- [ ] `description` is under 165 characters
- [ ] `coverAlt` is set if `heroImage` is used
- [ ] `tags` are set and use existing conventions
- [ ] `draft` is not set (or removed before publishing)
- [ ] Article renders correctly at `/blog/[slug]/`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] Article appears in blog index, RSS, and sitemap
- [ ] Article is indexed by Pagefind (check `/search/`)
- [ ] Social preview cards look correct (check with a social preview tool)
- [ ] Internal links work
- [ ] Images load and alt text is meaningful
