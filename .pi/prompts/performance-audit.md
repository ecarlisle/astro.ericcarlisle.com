Run a full performance, accessibility, SEO, and best-practices audit.

Steps:
1. Run `pnpm build` to generate a fresh production build.
2. Run `pnpm lighthouse:all` to audit every `.html` in dist/.

Report:
- Performance score (threshold: ≥0.95)
- Accessibility score (threshold: ≥0.95)
- SEO score (threshold: ≥1.0)
- Best-practices score (threshold: ≥0.95)
- Any regressions compared to previous runs
- Recommendations for improvements

Do not edit source code during this audit unless the user explicitly asks for fixes.
