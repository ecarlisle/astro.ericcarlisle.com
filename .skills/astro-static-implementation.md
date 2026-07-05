# Astro Static Implementation Skill

Use this skill when editing Astro pages, layouts, and components.

## Priorities

- Prefer static Astro output.
- Avoid client-side JavaScript unless the feature truly requires it.
- Use semantic HTML first.
- Keep components simple and readable.
- Preserve existing layouts, tokens, and naming conventions.
- Do not introduce React/Vue/Svelte islands unless specifically requested.
- Do not add new dependencies without a clear reason.

## Workflow

1. Inspect the existing component/page structure before editing.
2. Identify the smallest files that need changes.
3. Preserve existing patterns unless there is a clear defect.
4. Prefer Astro components and HTML/CSS over client-side code.
5. Run the project’s available checks after changes.

## Verification

- Run the build.
- Confirm no unnecessary client JavaScript was introduced.
- Confirm changed pages still render correctly.
