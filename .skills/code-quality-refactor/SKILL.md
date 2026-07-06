# Code Quality Refactor Skill

Use this skill when analyzing or refactoring existing code for simplicity, readability, maintainability, and helpful documentation.

## Purpose

Improve code quality without changing user-facing behavior, visual appearance, routes, content, accessibility, or performance characteristics.

This skill is conservative. Prefer small, obvious improvements over broad rewrites.

## Core Principles

- Preserve existing functionality.
- Preserve existing appearance.
- Preserve existing accessibility behavior.
- Preserve existing public routes and component APIs.
- Make code as simple as it can reasonably be.
- Prefer clarity over cleverness.
- Prefer local improvements over architectural rewrites.
- Do not refactor unrelated files.
- Do not introduce new dependencies.
- Do not rename exported symbols, routes, props, CSS classes, or design tokens unless required and verified.

## What To Improve

Look for:

- Repeated logic that can be simplified locally.
- Overly complex conditionals.
- Dead code.
- Unused imports.
- Unclear variable names.
- Excessive nesting.
- Duplicated markup that can be safely reduced.
- Comments that are stale, noisy, or misleading.
- Missing comments where intent is not obvious.
- CSS that can use existing design tokens.
- Small readability improvements that reduce cognitive load.

## Comment Guidelines

Comments should be succinct and useful.

Add comments when:

- The code has non-obvious intent.
- The code protects accessibility, SEO, performance, or browser behavior.
- A workaround exists for a specific reason.
- A design decision would otherwise look accidental.

Do not add comments that merely repeat what the code says.

Avoid comments like:

```ts
// Set count to 0
const count = 0;
```

Prefer comments like:

```ts
// Keep this inline so the theme is applied before the page paints.
```

## Required Workflow

1. Inspect the relevant files before editing.
2. Identify the smallest safe improvement set.
3. Explain the intended refactor before making changes if the change is broad.
4. Edit only the files needed for the requested scope.
5. Preserve behavior and appearance.
6. Run available checks.
7. Report changed files, verification steps, and any tradeoffs.

## Refactor Safety Rules

Do not change:

- Rendered text unless explicitly requested.
- Visual design unless explicitly requested.
- URL paths or route names.
- Component props or public interfaces.
- Generated content behavior.
- Theme behavior.
- Search behavior.
- SEO metadata behavior.
- Accessibility names, landmarks, or heading order unless fixing a clear defect.
- Image behavior or output formats unless explicitly requested.

## Stop Conditions

Stop and report instead of guessing when:

- A change would alter behavior.
- A change would alter appearance.
- A component’s purpose is unclear.
- Tests or build checks fail.
- The requested refactor spans too many unrelated files.
- The code appears generated or vendor-managed.
- A dependency or config change seems necessary.

## Verification

Run the most relevant available checks.

Prefer:

```bash
pnpm lint
pnpm build
```

If the project has a focused analysis script such as `pnpm fallow`, use it as an advisory signal, not as an automatic rewrite instruction.

If `pnpm fallow` reports issues:

- Review the output.
- Fix only issues relevant to the requested scope.
- Do not blindly apply every recommendation.
- Ignore reports from generated files, build output, vendored code, or old review artifacts unless the task explicitly includes them.

## Reporting

After changes, report:

- Files changed.
- What was simplified.
- What comments were added or removed.
- Which checks were run.
- Any checks that failed.
- Any recommendations intentionally not applied.
