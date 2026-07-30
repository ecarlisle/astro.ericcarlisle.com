---
name: engineering-preferences
title: Engineering Preferences
description: Applies Eric Carlisle's portable engineering defaults when implementing or reviewing code, especially for Git history, TypeScript type safety, assertions, error boundaries, and behavior-focused tests. Repository instructions remain authoritative.
category: engineering
applies_to:
  - implementation
  - code review
  - Git
  - TypeScript
  - testing
triggers:
  - implement
  - review code
  - resolve Git divergence
  - write TypeScript
  - add tests
priority: high
version: 1
---

# Engineering Preferences

Apply these personal defaults only where repository instructions and the current task are silent.
Do not use this skill to override project architecture, conventions, validation, or documented
decisions.

Use this authority order:

1. Explicit direction for the current task.
2. Repository instructions and established project conventions.
3. The preferences in this skill.

If a repository convention materially conflicts with a preference below, stop, describe the
conflict and its practical consequence, and ask before proceeding.

## Git history

- Never rebase.
- Do not run `git rebase`, `git pull --rebase`, or an equivalent history-rewriting workflow.
- When branches diverge, explain the available non-rebase options and ask before merging,
  cherry-picking, or otherwise reconciling the histories.

## TypeScript

- Prefer `type` for object shapes, public contracts, unions, intersections, aliases, and component
  props.
- Use `interface` only when a technical requirement makes it the better fit, such as declaration
  merging or compatibility with third-party declarations. Explain a non-obvious exception.
- Treat external or uncertain values as `unknown`, then validate or narrow them before use.
- Use `any` only at an unavoidable boundary. Keep it local and document why it is necessary.
- Prefer runtime checks and control-flow narrowing over type assertions and non-null assertions.
- Assert only when the invariant is already established but TypeScript cannot express it. Explain
  the invariant when it is not obvious from nearby code.

## Errors

Handle an error at the nearest layer that can recover, add useful context, or present the result.
Otherwise, let it propagate. Do not catch an error merely to log and rethrow it without adding
meaningful information.

## Tests

Add focused tests for changed behavior and credible regression risks. Prefer tests of observable
contracts over tests coupled to implementation details.

## Final check

Before completing the task, confirm that:

- no rebase operation was used or recommended as the default;
- new TypeScript follows the type-safety preferences above;
- error handling occurs at a useful boundary; and
- tests protect behavior rather than internal structure.
