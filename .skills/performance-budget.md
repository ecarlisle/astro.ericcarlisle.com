# Performance Budget Skill

Use this skill when adding dependencies, scripts, images, embeds, search, analytics, or interactive UI.

## Priorities

- Minimal JavaScript.
- Static rendering by default.
- Load feature-specific scripts only where needed.
- Avoid global bundles for page-specific features.
- Avoid heavyweight third-party embeds.
- Prefer native browser features and simple CSS.
- Preserve Lighthouse-friendly output.

## Rules

- Do not add a dependency without explaining why existing tools are insufficient.
- Do not load search, comments, analytics, or embeds globally unless required.
- Defer or isolate optional scripts.
- Prefer optimized image formats already used by the project.
- Keep CSS token-based and avoid large utility sprawl.

## Verification

- Run the production build.
- Check generated output for unexpected client assets.
- For major UI changes, run or recommend Lighthouse.
