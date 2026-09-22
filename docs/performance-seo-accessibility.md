# Performance, SEO, and Accessibility

**Use when:** Changing client JavaScript, assets, metadata, indexing, or accessible UI behavior, or
reviewing a change for those risks.

This file owns the site's performance, SEO, indexing, and accessibility rules. Validation commands
are in [Testing](testing.md#when-to-run-each-check).

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

## Indexing and sitemap policy

Indexing decisions live in one shared module, `scripts/seo-policy.mjs`, consumed by both the
`@astrojs/sitemap` filter in `astro.config.mjs` and the deterministic `pnpm validate:seo` gate so
the compiled sitemap and the check that audits it can never drift apart.

| Route | Indexing | Sitemap | Rationale |
|--------|----------|---------|-----------|
| `/portfolio/design-system/` | `index, follow` | included | Reference page for the site's KISS Design System |
| `/search/` | `noindex, follow` | excluded | Search UI has no unique content |
| `/design-system/lab/` | `noindex, follow` (patched into built Storybook) | excluded | Development lab, not an SEO surface |
| `/tags/<tag>/` single-entry | `noindex, follow` | excluded by policy | Archive repeats one card; derived from content |
| `/tags/<tag>/` multi-entry | `index, follow` | included | Meaningful `tags/` collection |
| `/posts/*` legacy aliases | `noindex` (Astro static redirect) | excluded | Redirect aliases are not content |
| `/blog/good-agent-context-is-carved-not-copied/` | `noindex` (Astro static redirect) | excluded | Retitled article's old slug redirects to the new URL |
| `/lab/*` diagnostics | `noindex, nofollow` | excluded | Internal diagnostics, not public content |
| `/404.html` | `noindex` | — | Error page |

Tag routing is deterministic: a tag becomes indexable the moment it contains more than one post, and
returns to `noindex` if it drops back to one, because the tag page and the policy both read the same
`src/content/blog/` frontmatter.

Redirect aliases are static `Astro.redirect(...)` pages because GitHub Pages cannot send HTTP
redirects (see [Redirects](deployment-static-site.md#redirects)). To add one, follow
[Rename or move an article](content-authoring.md#rename-or-move-an-article).

## Accessibility Rules

Preserve:

- Skip link
- Focus-visible states
- Reduced-motion handling
- Keyboard-accessible navigation
- Meaningful alt text
- Minimum touch target sizes
- Heading permalinks: content-section headings with a stable deep link carry an explicit lowercase kebab-case `id` and a sibling, non-nested chain-link anchor (`aria-hidden` icon + `aria-label`), a visible `:focus-visible` ring, 44px touch target, `scroll-margin-top` so fragments clear the fixed header, a `:target` highlight that becomes a static inset accent bar under reduced motion, and icon binding to the final title word so it never orphans — all with no runtime JavaScript.
