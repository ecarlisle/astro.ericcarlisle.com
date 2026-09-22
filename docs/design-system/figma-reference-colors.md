# Figma Reference: Colors

**Use when:** Generating Figma color variables, or updating this file after color or z-index
tokens change. Part of the [Figma brief](figma-agent-brief.md) (page `04 Colors`).

Values are copied from `src/styles/global.css`, which wins any conflict.

## Palettes

| Token | Dark (default) | Light | Usage |
|---|---|---|---|
| `--bg-main` | `#0b1020` | `#f8fafc` | Page background |
| `--bg-surface` | `#111a2e` | `#ffffff` | Cards, header, code |
| `--bg-surface-elevated` | `#18243a` | `#e8eef7` | Elevated and hover surfaces |
| `--text-primary` | `#f8fafc` | `#0f172a` | Headings, primary text |
| `--text-secondary` | `#cbd5e1` | `#334155` | Body text |
| `--text-muted` | `#94a3b8` | `#475569` | Meta, captions, labels |
| `--brand-primary` | `#5ea8ff` | `#005fcc` | Links, actions, focus |
| `--brand-accent` | `#38d9a9` | `#007a5a` | Link hover, success |
| `--brand-highlight` | `#ffb86b` | `#a14b00` | Highlights |
| `--color-danger` | `#ff8a8a` | `#b42318` | Errors, destructive states |
| `--color-warning` | `#f5d35c` | `#7a5b00` | Warnings |
| `--border-main` | `#26344d` | `#cbd5e1` | Card borders, dividers |
| `--border-muted` | `#1a2638` | `#e2e8f0` | Header border |
| `--border-control` | `#61728b` | `#64748b` | Form inputs (3:1 or better on all surfaces) |

## Semantic roles

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--color-link` | `--brand-primary` | same | Links |
| `--color-link-hover` | `--brand-accent` | same | Hovered links |
| `--color-action` | `--brand-primary` | same | Buttons, CTAs |
| `--color-action-hover` | `#3d8ee0` | `#004799` | Button hover |
| `--color-action-active` | `#3787d8` | `#003a7d` | Button pressed |
| `--color-on-action` | `--bg-surface` | same | Content on action color |
| `--color-focus` | `--color-link` | same | Focus outlines |
| `--color-success` | `--brand-accent` | same | Success |

Text and card surfaces have no semantic alias. Use the `--text-*`, `--bg-surface*`, and
`--border-main` tokens directly.

## Z-index

| Token | Value | Usage |
|---|---|---|
| `--z-decoration` | −1 | Decorative backdrops in an isolated stacking context |
| `--z-raised` | 1 | Content above a local backdrop or overlay (card link, tags, facades) |
| `--z-control` | 2 | Controls above a raised overlay |
| `--z-header` | 100 | Fixed header |
| `--z-header-accent` | 101 | Reading-progress bar |
| `--z-skip-link` | 9999 | Focused skip link |

## Figma variables

Create a `Colors` collection with `Dark` and `Light` modes:

`bg/main` · `bg/surface` · `bg/surface-elevated` · `text/primary` · `text/secondary` ·
`text/muted` · `brand/primary` · `brand/accent` · `brand/highlight` · `border/main` ·
`border/muted` · `border/control` · `action/default` · `action/hover` · `action/active` ·
`link/default` · `link/hover` · `focus` · `success` · `danger` · `warning`
