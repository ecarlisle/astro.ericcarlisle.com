# Development Workflow

> For the full project organization guide, see `docs/development/agent-workflow.md`.

## Standard Development Steps

1. Check `specs/` for relevant change specifications.
2. Read the relevant files in `docs/`.
3. Inspect source files before editing.
4. Make the smallest safe change that satisfies the request.
5. Preserve performance, accessibility, SEO, and minimal JavaScript.
6. Run relevant checks when possible.
7. Update docs when project behavior changes.

## Validation

Use the checks relevant to the change:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm lighthouse:all
```

Run only the checks relevant to the change when time or environment limits apply. See [testing.md](testing.md) for detailed guidance on when to run each check.

## Generated Files

The build process produces output in several directories. These are regenerated on each build and should not be edited directly:

- `dist/`
- `node_modules/`
- `lh-reports/`
- `docs/context/`
