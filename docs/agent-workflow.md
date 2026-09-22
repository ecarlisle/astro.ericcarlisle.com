# Development Workflow

**Use when:** Starting an implementation or diagnosis task and you need the standard steps.

## Standard Development Steps

1. If the task references a feature, plan, or prior decision, check `specs/` filenames and read only
   the matching spec. `specs/_template.md` is the template for new specs.
2. Read the docs routed for the task in [AGENTS.md](../AGENTS.md).
3. Inspect the source files before editing.
4. Make the smallest safe change that satisfies the request.
5. Preserve performance, accessibility, SEO, and minimal JavaScript.
6. Run the checks listed in [Testing](testing.md#when-to-run-each-check).
7. Update the doc that owns any fact your change alters.

Project structure is in [Architecture](architecture.md). Scope rules are in
[Change Policy](change-policy.md).
