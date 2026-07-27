# Development Workflow

> For the full project structure and organization, see [architecture.md](architecture.md).

## Quick Reference

### Standard Development Steps

1. If the task references a feature, plan, or prior decision, inspect `specs/` filenames and read only the matching specification.
2. Read the relevant files in `docs/`.
3. Inspect source files before editing.
4. Make the smallest safe change that satisfies the request.
5. Preserve performance, accessibility, SEO, and minimal JavaScript.
6. Run relevant checks when possible.
7. Update docs when project behavior changes.

### Validation Commands

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | TypeScript and Astro diagnostics |
| `pnpm lint` | Biome lint and format checks |
| `pnpm build` | Production build, including Pagefind indexing |
| `pnpm preview` | Preview the production build locally |
| `pnpm lighthouse:all` | Full Lighthouse audit across all pages |
| `pnpm structured-data:report` | Build + validate JSON-LD output |
| `pnpm fallow:dead-code` | Dead code analysis |

See [testing.md](testing.md) for when to run each check.

## Related Documentation

- [Architecture](architecture.md) — System design and technical overview
- [Change Policy](change-policy.md) — How changes are evaluated
- [Reviewer Checklist](reviewer-checklist.md) — Code review criteria
- [Deployment](deployment.md) — Deployment and operations guide
