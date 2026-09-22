# Figma Reference: Spacing and Layout

**Use when:** Generating Figma spacing variables or layout, or updating this file after spacing or
layout tokens change. Part of the [Figma brief](figma-agent-brief.md) (page `03 Spacing & Layout`).

Values are copied from `src/styles/global.css`, which wins any conflict. Reference px values
assume a 16px base.

## Spacing

`--rhythm`: `clamp(1.65rem, calc(0.75vw + 1.5rem), 2.0625rem)` (26.4 / 33px).

| Token | Rhythm × | Mobile / desktop px | Alias |
|---|---|---|---|
| `--space-xs` | 0.5 | 13.2 / 16.5 | `--space-inline` |
| `--space-sm` | 0.75 | 19.8 / 24.75 | `--space-inline-strong` |
| `--space-md` | 1 | 26.4 / 33 | `--space-component` |
| `--space-lg` | 1.5 | 39.6 / 49.5 | `--space-component-lg` |
| `--space-xl` | 2 | 52.8 / 66 | Section gaps |
| `--space-section` | 2.5 | 66 / 82.5 | Major separators |
| `--space-layout` | 3 | 79.2 / 99 | Page top and bottom |

Name the Figma number variables after the tokens, using desktop values. A mobile mode is optional.

## Layout

Rails: `--layout-rail-prose` `68ch` (~680px), `--layout-rail-page` `72rem` (1152px),
`--layout-rail-wide` `80rem` (1280px, rarely used).

- **Main:** max width is the page rail, centered, padded `--space-layout` / `--space-component`.
  At ≤720px, padding is `--space-component`.
- **Header:** fixed, `--bg-surface`, `1px` bottom border in `--border-muted`, min height 4.5rem
  (4rem on mobile). It hides on scroll down and reveals on scroll up. Mobile uses a hamburger menu
  with a two-column dropdown.
- **Footer:** centered, `--text-secondary`. Social links sit below with a `--space-inline` gap
  and a `--space-component` top margin.
- **Site frame:** `.site-frame` wraps the header and footer with `--space-component` padding.
- **Grid:** `.grid--cards` is `repeat(auto-fit, minmax(280px, 1fr))` with a `--space-component`
  gap. `.grid--featured-first` makes the first card full width. At ≤720px, both collapse to a
  single column.

| Breakpoint | Width | Effect |
|---|---|---|
| Mobile | 720px | Reduced padding; single-column cards |
| Homepage stack | 800px | Hero becomes single column |
| Header collapse | 840px | Hamburger menu |
| Social hide | 1024px | Header social links hidden |
