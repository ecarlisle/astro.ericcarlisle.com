Create a new blog post in src/content/blog/.

Before writing:
1. Read src/content.config.ts to confirm the frontmatter schema.
2. Read one or two existing posts in src/content/blog/ for tone and MDX patterns.
3. Read docs/content-status.md and docs/editorial-guidelines.md for content conventions.

When writing:
- Use MDX with YAML frontmatter.
- title: concise, sentence case.
- description: maximum 165 characters.
- pubDate: use z.coerce.date() compatible value (fuzzy locale parsing is supported).
- tags: use existing tags when possible; check existing posts for tag conventions.
- draft: set true if the post should not be published yet.
- heroImage / coverImage: follow existing conventions if imagery is needed.

After writing:
- Run `pnpm typecheck` to validate the frontmatter schema.
- If the post adds new tags or changes routing, consider `pnpm build`.
