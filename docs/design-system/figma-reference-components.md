# Figma Reference: Components

**Use when:** Generating Figma components, or updating this file after a component's appearance
changes. Part of the [Figma brief](figma-agent-brief.md) (page `05 Components`).

Sources, purposes, and accessibility notes live in [inventory.json](inventory.json). This file
holds only Figma names, tokens, and states. The implementation wins any conflict.

## Components

| Figma name | Visual spec | States and variants |
|---|---|---|
| `Header / Desktop`, `/ Mobile Open`, `/ Mobile Closed` | Site title: Plus Jakarta Sans 900, `clamp(1.25rem, 0.55vw + 1.1rem, 1.65rem)`, tight spacing. Nav min height 4.5rem / 4rem. | Social links hidden ≤1024px; hamburger ≤840px; hidden on scroll down; active link underlined in `--color-link` |
| `Footer` | Centered, `--text-secondary` | — |
| `Nav Link`, `Nav Link / Active` | `--font-copy`, `--text-primary`, 2px transparent bottom border | Hover: `--color-action` border. Active: `--color-link` border, weight 700 |
| `Card / Default`, `/ With Image`, `/ Featured` | `--space-component` padding, `--bg-surface`, 1px `--border-main`, `--radius-lg`. Title `--type-size-card-title` at 1.2 line height; meta small and muted. Children stack with a `--space-inline-strong` gap. | Hover: `--shadow-lg`, `--color-action` border, lift 4px. Image: 2:1, top radius, bleeds to the padding edge. Featured: featured title size. |
| `Post Grid` | `ul.grid.grid--cards` | — |
| `Button / Primary`, `/ Outline` | Inline flex, min height `--size-touch-target-min`, padding `--space-inline` / `--space-component`, `--radius-md`, `--color-action` background, `--color-on-action` text, body size | Hover: `--color-action-hover`, `--shadow-md`, lift 1px. Outline: transparent background with `--color-action` border and text |
| `Tag`, `Chip` | Pill (`--radius-full`), `0.2em 0.6em` padding, `--bg-surface-elevated`, `--text-secondary`, mono small | Tag hover: `--color-action-hover` background, `--bg-main` text. Chip is static. |
| `Callout` | `--space-component` padding, 4px left border in `--color-link`, `--radius-md`, `--bg-surface`, `--text-secondary` | — |
| `Back Link` | Small, `--text-muted` | — |
| `Reading Progress Bar` | Fixed top, 3px tall, `--color-link`, width 0–100% | — |
| `Skip Link` | Visible only on keyboard focus | — |
| `Social Links` | 44×44px targets, `--radius-md`, `--text-secondary` | Hover: `--color-link` |
| `Theme Toggle / Dark`, `/ Light` | 44×44px, transparent, `--radius-md`; 20px sun and moon icons | Sun shows in dark, moon in light |
| `Share Strip` | Vertical flex, `--space-inline` gap. "Share" label is uppercase, small, and muted. 44px icons in `--text-secondary`. | Hover: `--color-link-hover` |
| `Tag Filter Bar` | Centered wrapping flex, `--space-sm` gap. Pills with `0.3em 0.7em` padding, small, muted. | Hover: `--bg-surface`, `--color-link` |
| `Pagination Nav` | Two-column grid, `--space-component` gap, top border `--border-main`. Small muted label; title in headers font at 700. | Hover: `--bg-surface`, `--color-link` |
| `Table of Contents` | Sticky below the header. Uppercase small muted heading. Links have a transparent left border and `--space-inline` padding. | Hover and active: `--color-action` text and border |
| `Webmentions / Reactions`, `/ Reply` | `--space-section` top margin and border. 32px circular avatars. Reply cards: `--space-component` padding, `--bg-surface`, `--border-muted`, `--radius-md`. | — |
| `Stats Grid`, `Stat Card` | Four columns within the prose rail. Stat card: `--bg-surface`, `--border-muted`, `--radius-md`, centered. Value in h3 size, mono, `--color-action`; label small, `--text-secondary`. | Two columns ≤720px |
| `Contact Form`, `Contact Success Card` | Prose rail, column gap `--space-component`. Inputs: `--space-inline` / `--space-sm` padding, `--bg-surface`, 1px `--border-control`, `--radius-sm`. | Focus: `--color-action` border plus a 1px ring. Success card: 4px left border in `--color-success` |
| `Search / Input`, `/ Result Card` | Pagefind UI (`src/pages/search.astro`, `src/styles/pagefind.css`). Input: min 44px, `--radius-md`, `--border-control`. Results styled as cards. | — |
| `404 Page` | Mono "404" at `clamp(4rem, 12vw, 8rem)` in `--color-action` (`src/pages/404.astro`) | — |
