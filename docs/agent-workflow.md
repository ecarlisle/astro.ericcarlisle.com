# Agent Workflow

> For the full project organization guide, see `docs/development/agent-workflow.md`.

When working in this repository:

1. Read `AGENTS.md`.
2. Check `specs/` for relevant change specifications.
3. Load relevant `.skills/` files based on the task.
4. Check the relevant files in `docs/`.
3. Inspect source files before editing.
4. Make the smallest safe change.
5. Preserve performance, accessibility, SEO, and minimal JavaScript.
6. Run relevant checks when possible.
7. Update docs when project behavior changes.

## Preferred Checks

Use:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm lighthouse:all
```

Run only the checks relevant to the change when time or environment limits apply.

## Generated Files

Do not edit generated output unless explicitly asked.

Avoid:

- `dist/`
- `node_modules/`
- `lh-reports/`
- `docs/context/`
