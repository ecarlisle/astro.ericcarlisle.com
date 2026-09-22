# Figma Reference: Page Templates

**Use when:** Generating Figma page templates, or updating this file after a page layout changes.
Part of the [Figma brief](figma-agent-brief.md) (page `06 Page Templates`).

Build each template from the [components](figma-reference-components.md). The implementation in
`src/pages/` wins any conflict.

| Template | Layout |
|---|---|
| Homepage | Hero: two-column grid (`1fr auto`) with a `--space-section` gap. Avatar is 280 / 200 / 140px (desktop / tablet / mobile). "Latest writing" uses `grid--cards grid--featured-first`. |
| Blog index | Collection header, Tag Filter Bar, Post Grid, and optional Pagination Nav |
| Article | Header and 2:1 hero at max 1020px. Content and sidebar columns, with the Share Strip above a sticky TOC. Pagination and webmentions below. Reading progress bar. |
| Portfolio | Case-study cards in a `1.6fr 0.8fr` grid, repo list with a GitHub icon, and tag clusters |
| Contact | Centered `68ch` prose, stacked form, and success-card state |
| Search | Search input with card results |
| 404 | Centered vertical flex, min height `60vh` |
