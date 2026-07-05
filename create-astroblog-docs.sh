#!/usr/bin/env bash
set -euo pipefail

DOCS_DIR="docs"

mkdir -p "$DOCS_DIR"

create_file_if_missing() {
  local file_path="$1"
  local content="$2"

  if [[ -f "$file_path" ]]; then
    echo "Skipped existing file: $file_path"
    return
  fi

  printf "%s\n" "$content" > "$file_path"
  echo "Created: $file_path"
}

create_file_if_missing "$DOCS_DIR/architecture.md" '# Architecture

AstroBlog is an Astro 7 static site for technical blogging, portfolio content, and professional web presence.

The architecture should stay static-first, content-driven, accessible, SEO-friendly, and performance-conscious.

## Core Principles

- Prefer Astro, semantic HTML, and CSS over client-side JavaScript.
- Keep client-side JavaScript minimal and intentional.
- Preserve fast static delivery and strong Core Web Vitals.
- Favor simple, readable components over clever abstractions.
- Use existing project patterns before introducing new ones.
- Keep content schema changes deliberate and documented.

## Primary Source Areas

```txt
src/content.config.ts
src/pages/
src/content/blog/
src/layouts/
src/components/
src/styles/
src/lib/
astro.config.mjs
package.json
contact-worker/
```

## Content Collections

The authoritative content schema lives in:

```txt
src/content.config.ts
```

Check this file before adding, removing, renaming, or documenting frontmatter fields.

When changing the schema:

- Update affected content.
- Update related docs.
- Confirm the build and typecheck pass.
- Consider effects on RSS, sitemap, search, metadata, and article templates.

## Pages and Layouts

Pages should remain thin whenever possible.

Prefer this flow:

```txt
content/schema -> page query/load -> layout -> focused components -> global styles/tokens
```

Layouts should own shared page structure, metadata patterns, and repeated framing.

Components should own reusable display behavior, but should not become large application controllers.

## Styling Architecture

Global styling and design tokens should live in:

```txt
src/styles/
```

Use existing tokens before creating new ones.

Prefer global styles for:

- Typography
- Layout primitives
- Design tokens
- Site-wide spacing
- Shared focus states
- Reusable prose styles

Prefer component-scoped styles only when a style is truly local to a component.

Do not introduce Tailwind or another styling framework unless explicitly requested.

## JavaScript and Hydration

AstroBlog should remain static-first.

Before adding client-side JavaScript, confirm that the behavior cannot be handled with:

- HTML
- CSS
- Astro build-time behavior
- Server/static generation
- Progressive enhancement

When client-side JavaScript is needed:

- Keep it small.
- Avoid unnecessary hydration.
- Preserve accessibility.
- Validate performance impact.
- Document why it exists.

## Integrations

The project currently uses or may use:

- Astro content collections
- MDX
- RSS
- Sitemap generation
- Pagefind search
- Partytown
- Local variable fonts
- Cloudflare Worker contact form

When changing integrations, update this document and relevant testing/deployment notes.

## Contact Worker

The contact form worker lives in:

```txt
contact-worker/
```

Treat it as a related but separate runtime surface.

When editing it:

- Check worker-specific package files.
- Validate expected request/response behavior.
- Avoid leaking secrets.
- Keep spam prevention and validation behavior documented.

## Agent Guidance

For non-trivial implementation work, follow the orchestration workflow in:

```txt
AGENTS.md
```

Use this architecture document to decide whether a proposed change fits the site direction.

Prefer the smallest safe change that preserves the site architecture.
'

create_file_if_missing "$DOCS_DIR/testing.md" '# Testing

This document describes the validation expectations for AstroBlog.

Use `pnpm` only. Do not use `npm` or `yarn`.

## Commands

```sh
pnpm dev              # dev server
pnpm build            # production build
pnpm preview          # preview build output
pnpm typecheck        # astro check
pnpm lint             # biome check .
pnpm format           # biome format . --write
pnpm lighthouse:all   # run Lighthouse across routes
```

## Default Validation

For most code changes, run:

```sh
pnpm typecheck
pnpm lint
pnpm build
```

If time or context is limited, run the smallest relevant subset and report what was not run.

Do not claim a task is complete if relevant checks failed.

## When to Run Each Check

### `pnpm typecheck`

Run when changing:

- Astro components
- Layouts
- Pages
- Content schema
- TypeScript utilities
- MDX/content behavior
- Integration config

### `pnpm lint`

Run when changing:

- Source files
- Config files
- Scripts
- Worker code
- Formatting-sensitive files

### `pnpm build`

Run when changing:

- Routes
- Layouts
- Components
- Content schema
- Metadata
- RSS/sitemap behavior
- Search-related behavior
- Astro config
- Any user-facing page output

### `pnpm lighthouse:all`

Run when changing:

- Layout
- Fonts
- Images
- Global CSS
- Metadata
- Performance-sensitive behavior
- Client-side JavaScript
- Third-party scripts
- Search or analytics behavior

## Manual Review Checklist

For user-facing changes, check:

- Page still renders correctly.
- Heading hierarchy is sensible.
- Links work.
- Keyboard navigation works.
- Focus-visible states are preserved.
- Images have meaningful alt text when appropriate.
- Layout works at narrow and wide viewport sizes.
- No unexpected client-side JavaScript was added.
- Metadata still looks correct.

## Content Validation

When editing blog content or frontmatter:

- Check `src/content.config.ts`.
- Confirm required fields are present.
- Confirm dates are valid.
- Confirm tags/categories still support listing pages.
- Confirm placeholder content is not removed unless explicitly requested.

## Search Validation

When changing search-related behavior:

- Confirm Pagefind still builds.
- Confirm searchable content remains intentional.
- Confirm placeholder content still supports testing until real content replaces it.

## Reviewer Expectations

The Reviewer should confirm:

- Which checks were run.
- Whether failures occurred.
- Whether skipped checks were reasonable.
- Whether a larger validation command is needed before merging.

If no checks were run, the final response must explain why.
'

create_file_if_missing "$DOCS_DIR/performance.md" '# Performance

AstroBlog should preserve fast static delivery and strong Core Web Vitals.

Performance is a project priority, not a cleanup step after the fact.

## Principles

- Prefer static HTML and CSS.
- Avoid unnecessary client-side JavaScript.
- Avoid unnecessary hydration.
- Avoid heavy third-party scripts.
- Use local variable fonts intentionally.
- Keep images optimized and appropriately sized.
- Preserve Lighthouse-friendly defaults.

## JavaScript Budget

Before adding client-side JavaScript, ask:

- Is this interaction necessary?
- Can HTML, CSS, Astro, or build-time behavior handle it?
- Can it be progressively enhanced?
- Does it preserve keyboard and screen-reader behavior?
- Does it add meaningful user value?

Do not add JavaScript for purely decorative behavior unless explicitly approved.

## Dependencies

Do not add dependencies without explicit approval.

Before recommending a dependency, explain:

- Why the project needs it.
- Why existing platform features are insufficient.
- Expected bundle impact.
- Maintenance and security considerations.
- Whether a smaller alternative exists.

## Fonts

The site uses local variable fonts.

When changing fonts or font loading:

- Preserve local loading where possible.
- Avoid render-blocking surprises.
- Validate layout shift.
- Confirm fallback stacks are sensible.
- Confirm typography still supports readability.

## Images

When changing images:

- Prefer optimized formats.
- Use appropriate dimensions.
- Avoid shipping larger assets than needed.
- Preserve meaningful alt text where appropriate.
- Avoid layout shift by preserving dimensions or stable layout containers.

## Third-Party Scripts

Third-party scripts should be treated as performance liabilities until proven otherwise.

Before adding one, document:

- Purpose.
- Loading strategy.
- User impact.
- Privacy/security considerations.
- Alternative static or server-side options.

## Lighthouse

Use:

```sh
pnpm lighthouse:all
```

for changes that may affect performance, accessibility, SEO, best practices, layout, fonts, images, scripts, or metadata.

## Reviewer Checklist

The Reviewer should look for:

- New client-side JavaScript.
- New dependencies.
- Hydration where static HTML would work.
- Large or unoptimized images.
- Font loading regressions.
- Layout shift risks.
- Third-party script creep.
- Lighthouse regressions or skipped Lighthouse checks.
'

create_file_if_missing "$DOCS_DIR/accessibility.md" '# Accessibility

AstroBlog should preserve and improve accessibility as part of normal development.

Accessibility is not a separate polish pass. It is part of architecture, content, design, and review.

## Principles

- Use semantic HTML first.
- Preserve a clear heading hierarchy.
- Ensure keyboard access.
- Preserve visible focus states.
- Respect reduced-motion preferences.
- Use meaningful alt text when images convey content.
- Keep links and buttons understandable out of context.
- Preserve readable typography and sufficient contrast.

## Semantic HTML

Prefer native HTML elements before custom interaction patterns.

Use appropriate landmarks and structure:

- `header`
- `nav`
- `main`
- `article`
- `section`
- `aside`
- `footer`

Do not use generic `div` structures where semantic elements would be clearer.

## Headings

Maintain a logical heading order.

Avoid skipping heading levels for visual styling. Use CSS for visual size, not heading rank.

## Links and Buttons

Use links for navigation.

Use buttons for actions.

Link text should describe the destination or action clearly.

Avoid vague link text such as:

```txt
click here
read more
learn more
```

unless nearby context makes the destination clear to assistive technology.

## Focus States

Do not remove focus outlines unless replacing them with an accessible `:focus-visible` style.

Focus states should be visible and consistent with the design system.

## Motion

Respect reduced-motion preferences.

Avoid required motion for comprehension.

Decorative animation should not interfere with reading, navigation, or interaction.

## Images and Alt Text

Use meaningful alt text for informative images.

Use empty alt text for decorative images:

```html
<img src="..." alt="" />
```

Do not stuff alt text with SEO keywords.

## Forms

For the contact form and any future forms:

- Use real labels.
- Associate labels with inputs.
- Provide understandable validation messages.
- Preserve keyboard navigation.
- Avoid relying on color alone to communicate errors.

## Touch Targets

Interactive controls should be comfortably tappable.

Avoid tiny link clusters or icon-only controls without accessible names.

## Reviewer Checklist

The Reviewer should check:

- Semantic landmarks.
- Heading order.
- Keyboard navigation.
- Focus-visible behavior.
- Reduced-motion support.
- Link and button semantics.
- Alt text quality.
- Form labels and validation.
- Color contrast risks.
- Touch target size.
'

create_file_if_missing "$DOCS_DIR/editorial-guidelines.md" '# Editorial Guidelines

AstroBlog content should sound like Eric Carlisle: grounded, thoughtful, technically credible, and human.

The site supports technical blogging, portfolio content, and professional web presence. Content should help software developers, engineering leaders, recruiters, hiring managers, and collaborators understand the work clearly.

## Voice

Write with:

- Clarity.
- Specificity.
- Technical credibility.
- Human perspective.
- Calm confidence.
- Useful reflection.

Avoid:

- Generic marketing copy.
- Empty hype.
- Doom framing.
- Inflated claims.
- Buzzword fog.
- Overly cute phrasing in professional case studies.

## Audience

Primary audiences include:

- Software developers.
- Engineering leaders.
- Recruiters and hiring managers.
- UX-minded product and technical collaborators.
- People evaluating Eric for senior frontend, full-stack, UX architecture, or principal-level roles.

## Blog Content

Technical posts should:

- Teach or clarify something useful.
- Include concrete context.
- Avoid pretending certainty where there is nuance.
- Prefer examples over abstractions.
- Explain tradeoffs.
- Preserve the author’s point of view.

Reflective posts should:

- Stay grounded in real experience.
- Avoid melodrama.
- Connect personal observation to useful insight.
- Respect the reader’s intelligence.

## Portfolio Content

Portfolio content should emphasize:

- Problem context.
- Role and responsibility.
- Constraints.
- Technical and UX decisions.
- Collaboration.
- Outcomes.
- Lessons learned.

Avoid sharing confidential implementation details, private client data, or non-public code.

Case studies can be specific without exposing private information.

## Placeholder Content

Some existing posts may be placeholder or test content used to validate:

- Layout.
- Pagination.
- Tags.
- Search.
- Metadata.
- Typography.
- Article templates.

Do not delete placeholder posts unless explicitly requested.

When replacing placeholders with real content, preserve enough test coverage for layout and taxonomy behavior.

## Titles and Metadata

Titles should be clear and specific.

Descriptions should summarize the page honestly and helpfully.

Avoid clickbait.

For blog posts, metadata should support:

- SEO.
- Open Graph previews.
- RSS.
- Internal linking.
- Search results.

## Editing Guidance for Agents

Do not rewrite Eric’s voice into generic corporate prose.

When improving copy:

- Preserve meaning.
- Reduce clutter.
- Improve rhythm.
- Keep technical claims accurate.
- Avoid adding unsupported accomplishments.
- Flag factual uncertainty instead of inventing details.

When drafting new content, use placeholders for unknown facts rather than guessing.
'

printf "\nDone. Review created files with:\n\n  ls -la %s\n\n" "$DOCS_DIR"
