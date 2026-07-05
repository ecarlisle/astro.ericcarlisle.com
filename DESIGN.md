# Design Direction

AstroBlog should feel thoughtful, technical, calm, personal, and editorial.

The design should prioritize:
- readability
- speed
- accessibility
- semantic structure
- restraint
- strong typography
- clear hierarchy
- useful whitespace
- durable design tokens

Avoid:
- decorative complexity
- heavy animation
- generic SaaS-card styling
- excessive gradients
- unnecessary JavaScript
- visual changes that require new dependencies
- broad redesigns when a small refinement would work

Use existing design tokens from `src/styles/global.css` as the source of truth.
Do not invent new colors, type scales, spacing systems, or layout primitives unless explicitly asked.
When tokens change, update this document so future design work stays aligned.

## Current Design Direction

The site should read as a personal technical blog rather than a product landing page.
The visual tone should be:
- crisp, not sterile
- expressive, not loud
- editorial, not marketing-heavy
- technical, not cold
- personal, not casual to the point of looseness

Prefer strong typography, intentional spacing, and contrast over ornament.

## Layout

Content should usually align to an intentional reading rail.
Wide layouts are acceptable for grids, cards, and index pages, but section dividers, headings, and text should not appear accidentally misaligned.

Prefer simple responsive layouts:
- single-column for prose
- two-column only when it improves scanning
- card grids only when content benefits from comparison

## Typography

Typography should carry the design.
Use hierarchy, spacing, and contrast before adding ornament.

Headings should be direct and readable.
Body copy should feel editorial, not marketing-heavy.

Long-form article typography should prioritize reading flow over dramatic spacing.
Technical content, code blocks, tables, and lists should feel integrated into the article rather than visually detached.

## Color System

The current direction is to move away from an amber-first palette toward a strong blue-led system.
Preferred palette direction: **Blue Relay**.
The palette should feel modern, technical, readable, and slightly energetic without becoming generic SaaS chrome.

Recommended semantic roles:
- `--brand-primary`: primary blue for normal links, active navigation, buttons, and reading progress
- `--brand-accent`: teal/green accent for hover states, focus, selected tags, and small interactive highlights
- `--brand-highlight`: warm highlight used sparingly for special callouts, warnings, or unique metadata
- `--bg-main`, `--bg-surface`, `--bg-surface-elevated`: page and component surfaces
- `--text-primary`, `--text-secondary`, `--text-muted`: text hierarchy
- `--border-main`, `--border-muted`, `--border-control`: structure and controls

Do not add many more hues. Prefer semantic roles and tonal steps over more color variety.
Color changes must remain WCAG 2 AA compliant for normal text in both dark and light mode. Check at least:
- body text on main background
- secondary text on main background
- muted text on main background
- link text on main background
- link text on surface cards
- button text on button background
- tag text on tag background
- focus indicators against adjacent backgrounds

Suggested Blue Relay tokens:

```css
:root {
  --bg-main: #0B1020;
  --bg-surface: #111A2E;
  --bg-surface-elevated: #18243A;
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --brand-primary: #5EA8FF;
  --brand-accent: #38D9A9;
  --brand-highlight: #FFB86B;
  --color-link: var(--brand-primary);
  --color-link-hover: var(--brand-accent);
  --color-action: var(--brand-primary);
  --color-action-hover: var(--brand-accent);
  --color-focus: var(--brand-accent);
  --border-main: #26344D;
  --border-muted: #1A2638;
  --border-control: #52627A;
}
[data-theme="light"] {
  --bg-main: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #E8EEF7;
  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-muted: #475569;
  --brand-primary: #005FCC;
  --brand-accent: #007A5A;
  --brand-highlight: #A14B00;
  --color-link: var(--brand-primary);
  --color-link-hover: var(--brand-accent);
  --color-action: var(--brand-primary);
  --color-action-hover: var(--brand-accent);
  --color-focus: var(--brand-accent);
  --border-main: #CBD5E1;
  --border-muted: #E2E8F0;
  --border-control: #64748B;
}
```

These values are guidance for the next refinement pass. If implementation testing reveals a contrast issue, adjust the token while preserving the blue-led direction.

## Spacing and Rhythm

Whitespace should be useful, not ornamental.
The site can be generous, but blog reading should not feel overly stretched. Prefer tightening article-specific spacing before changing global spacing tokens.

Current refinement direction:
- Keep the rhythm-token system.
- Reduce article heading spacing before globally shrinking the spacing scale.
- Avoid using large section spacing before every prose heading.
- Avoid stacked padding where `main` already provides page padding.
- Preserve generous spacing for index pages, cards, and portfolio surfaces unless screenshots show obvious looseness.

Recommended article-spacing experiment:

```css
.prose h2 {
  margin-top: var(--space-xl);
}
.prose h3 {
  margin-top: var(--space-lg);
}
```

For article prose padding, prefer block-tight spacing and avoid double padding on mobile:

```css
.prose {
  padding-block: 0;
  padding-inline: var(--space-component);
}
@media (max-width: 720px) {
  .prose {
    padding-inline: 0;
  }
}
```

Body text may remain fluid, but if articles feel too airy, test capping body copy at 1.125rem before reducing line-height. Do not shrink body size and line-height in the same pass unless screenshots clearly justify it.

## Cards and Index Pages

Cards should help readers scan content, not dominate the page.
A featured first-card treatment is acceptable when the page intentionally wants an editorial lead story. Do not apply a full-width first card universally to every card grid unless the context benefits from that hierarchy.
Card spacing should remain comfortable, but avoid making index pages feel like isolated billboards. Home can be more editorial; the main blog index should remain easy to browse.

## Portfolio Pages

Portfolio content should foreground:
- problem context
- constraints
- architectural decisions
- product judgment
- outcomes
- collaboration

Avoid making NDA/source-code caveats the dominant message.

Case studies should feel credible, specific, and scannable without looking like sales collateral.

## Design Review Workflow

Keep design updates synchronized with this file.
When running a design refinement pass:
1. Review `DESIGN.md` before changing visual styles.
2. Update `DESIGN.md` when color, typography, spacing, layout, or component hierarchy direction changes.
3. Keep generated review artifacts under `design-review` or `design-review-after` as evidence, not as the source of truth.
4. Capture before/after screenshots for desktop, tablet, and mobile when practical.
5. Capture both dark and light mode when color tokens change.
6. Summarize changed files, visual intent, accessibility checks, screenshots produced, and decisions deferred.

Design artifacts are helpful evidence. `DESIGN.md` and `src/styles/global.css` should remain the living design contract.

## Agent Rules

When making visual changes:
1. Preserve existing tokens and conventions.
2. Make the smallest useful improvement.
3. Do not redesign unrelated areas.
4. Check desktop and mobile implications.
5. Check dark and light mode implications for color changes.
6. Keep WCAG 2 AA contrast requirements intact.
7. Update DESIGN.md if the design direction changes.
8. Explain the visual intent in the final response.

## External Design Guidance

External design guidance is advisory.

AstroBlog's existing visual direction, CSS tokens, accessibility goals, performance constraints, semantic HTML, and explicit user instructions take precedence.

Do not apply external design "bans" mechanically when an existing pattern is intentional, semantic, restrained, or already part of the site's visual language.

In particular:
- The existing font stack is intentional and should not be replaced unless explicitly requested.
- Left borders are allowed for semantic patterns such as blockquotes, callouts, and active navigation states.
- Existing tokens in `src/styles/global.css` remain the source of truth for color, spacing, radius, typography, and layout.
- New animation libraries or visual dependencies should not be added for design polish.
