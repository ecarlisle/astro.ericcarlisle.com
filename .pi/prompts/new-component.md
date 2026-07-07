Create a new Astro component in src/components/.

Before writing:
1. Read existing components in src/components/ for naming and style patterns.
2. Read src/styles/global.css for available CSS custom properties/tokens.
3. Read src/styles/components.css for shared component helpers.

When writing:
- Filename: PascalCase (e.g. `MyComponent.astro`).
- Prefer static HTML/CSS; avoid client-side JavaScript unless the feature truly requires it.
- Use existing CSS custom properties for colors, spacing, typography, and layout.
- Keep the component simple and readable.
- If the component is reusable across pages, consider exporting it from src/components/index.ts if that pattern exists.

After writing:
- Run `pnpm typecheck` if the component uses TypeScript or Astro props.
- Run `pnpm lint` if the component includes `<style>` blocks.
- Run `pnpm build` if the component affects routes or integrations.
