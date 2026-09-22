# Figma Reference: Typography

**Use when:** Generating Figma text styles, or updating this file after typography tokens change.
Part of the [Figma brief](figma-agent-brief.md) (page `02 Typography`).

Values are copied from `src/styles/global.css`, which wins any conflict. Reference px values
assume a 16px base.

## Families and weights

| Token | Value | Figma font |
|---|---|---|
| `--font-copy` | `"Source Sans 3 Variable", system-ui, sans-serif` | Source Sans 3 |
| `--font-headers` | `"Plus Jakarta Sans Variable", system-ui, sans-serif` | Plus Jakarta Sans |
| `--font-mono` | `"Fira Code Variable", ui-monospace, monospace` | Fira Code |

Weights: `--font-weight-normal` 400 (body), `-medium` 600 (tag names, result labels), `-bold` 700
(headings, buttons, active nav, stats), `-black` 900 (site title).

Letter spacing: `--letter-spacing-tight` −0.03em (site title), `-label` 0.05em (uppercase labels),
`-wide` 0.08em (404 label).

| Token | Clamp | Mobile / desktop | Line height |
|---|---|---|---|
| `--type-size-small` | `clamp(0.8125rem, calc(0.2vw + 0.77rem), 0.9375rem)` | 13 / 15 | body |
| `--type-size-body` (= `-base`) | `clamp(1rem, calc(0.3vw + 0.94rem), 1.125rem)` | 16 / 18 | 1.65 |
| `--type-size-large` | `clamp(1.125rem, calc(0.35vw + 1.05rem), 1.375rem)` | 18 / 22 | — |
| `--type-size-h5` | `clamp(1rem, calc(0.28vw + 0.94rem), 1.1875rem)` | 16 / 19 | 1.6 |
| `--type-size-h4` | `clamp(1.125rem, calc(0.57vw + 1.07rem), 1.5rem)` | 18 / 24 | 1.55 |
| `--type-size-h3` | `clamp(1.375rem, calc(1.14vw + 1.15rem), 2rem)` | 22 / 32 | 1.45 |
| `--type-size-h2` | `clamp(1.625rem, calc(2.13vw + 1.2rem), 2.8rem)` | 26 / 45 | 1.35 |
| `--type-size-h1` | `clamp(2rem, calc(3.64vw + 1.27rem), 4rem)` | 32 / 64 | 1.3 |
| `--type-size-card-title` | `clamp(1.375rem, calc(0.7vw + 1.2rem), 2rem)` | 22 / 32 | 1.2 |
| `--type-size-featured-card-title` | `clamp(1.75rem, calc(1.25vw + 1.45rem), 2.75rem)` | 28 / 44 | 1.2 |
| `--type-size-blockquote` | `1.1em` | relative | body |

Headings use Plus Jakarta Sans 700, `text-primary`, margin 0; `h1`–`h3` use `text-wrap: balance`.

**Text styles** (as `Desktop / …` and `Mobile / …`): Body, Body Small, Body Large, H1–H5, Card
Title, Featured Card Title, Mono / Meta, Mono / Small, Tag / Chip, Button, and Eyebrow (uppercase,
label spacing, small size).

**Prose:** `.prose p` and `li` max `68ch`. Inline `code` is mono 0.95em on `--bg-surface` with
`--radius-sm`. `pre` has `--space-component` padding, `--bg-surface`, and `--border-main`.
Uppercase labels are small, uppercase, label-spaced, and `--text-muted`.

**Heading permalink states** (for H2 and H3; no new tokens):

- **Default:** muted chain icon (about 0.6 opacity) in `--color-link`.
- **Hover:** full opacity in `--color-link-hover` on a `--bg-surface` chip.
- **Focus:** the hover state plus a dashed `--color-focus` outline with a 3px offset.
- **Targeted:** an accent highlight; a static inset bar under reduced motion.
- **Wrapped:** the icon stays bound to the final word.
- **Themes:** render in both dark and light.
