# Content Model

**Use when:** Reading or changing blog frontmatter fields or the content schema.

Blog posts live in `src/content/blog/**/*.{md,mdx}`. The authoritative schema is [`src/content.config.ts`](../src/content.config.ts). The authoring workflow is in [Content Authoring](content-authoring.md).

## Blog Frontmatter

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | |
| `description` | string | Yes | Max 165 characters |
| `pubDate` | date | Yes | Sort order, RSS, structured data |
| `updatedDate` | date | No | Meaningful updates only |
| `draft` | boolean | No | Excludes the post from all output |
| `tags` | string[] | No | |
| `heroImage` | Astro image | No | |
| `coverAlt` | string | No | Expected whenever `heroImage` is set |
| `socialTitle` | string | No | Max 60 characters |
| `socialDescription` | string | No | Max 200 characters |
| `socialImage` | Astro image | No | |
| `twitterHandle` | string | No | Adds `twitter:creator` |
| `share` | object | No | See below |

Use `socialTitle`, `socialDescription`, and `socialImage` only when the social preview should differ from the page title, description, or hero image.

`share` supports:

- `enabled`: boolean, defaults to `true`
- `networks`: any of `twitter`, `facebook`, `linkedin`, or `bluesky`
- `scheduledFor`: date

Many existing posts are placeholders; see [Content Status](content-status.md).
