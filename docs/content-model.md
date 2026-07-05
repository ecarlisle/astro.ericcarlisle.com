# Content Model

Blog posts live in:

`src/content/blog/**/*.{md,mdx}`

The authoritative schema is defined in:

`src/content.config.ts`

## Blog Frontmatter

Fields in the current schema:

- `title` - required string
- `description` - required string, limited to 165 characters
- `draft` - optional boolean
- `pubDate` - required date
- `updatedDate` - optional date
- `heroImage` - optional Astro image
- `coverAlt` - optional string
- `tags` - optional array of strings
- `socialTitle` - optional string, limited to 60 characters
- `socialDescription` - optional string, limited to 200 characters
- `socialImage` - optional Astro image
- `twitterHandle` - optional string
- `share` - optional sharing configuration

The `share` object supports:

- `enabled` - boolean that defaults to `true`
- `networks` - optional array containing `twitter`, `facebook`, `linkedin`, or `bluesky`
- `scheduledFor` - optional date

## Description Length

Post descriptions should be concise and useful. The schema currently limits `description` to 165
characters.

## Social Metadata

Use `socialTitle`, `socialDescription`, and `socialImage` when the social preview should differ from
the page title, description, or hero image.

## Placeholder Content

Many existing posts are placeholder or test posts. Do not treat every current post as final
editorial content.
