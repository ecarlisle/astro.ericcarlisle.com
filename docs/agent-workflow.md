# Development Workflow

> For the full project organization guide, see [docs/development/agent-workflow.md](development/agent-workflow.md).

## Quick Reference

### Standard Development Steps

1. Check `specs/` for relevant change specifications.
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

- [Project Organization](development/agent-workflow.md) — Detailed directory structure and development guide
- [Architecture](architecture.md) — System design and technical overview
- [Change Policy](change-policy.md) — How changes are evaluated
- [Reviewer Checklist](reviewer-checklist.md) — Code review criteria
- [Deployment](deployment.md) — Deployment and operations guide
