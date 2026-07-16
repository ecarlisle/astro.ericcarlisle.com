# specs/

This directory contains concrete feature and change specifications for the AstroBlog project.

## What belongs here

A spec describes a single planned change. It is not reusable guidance and it is not long-term documentation. Good specs include:

- A clear title and status.
- Context and motivation.
- A specific goal and explicit non-goals.
- Requirements and constraints.
- Acceptance criteria.
- Validation steps.
- A list of files likely to be affected.
- Notes and open questions.

Use a spec when:

- The change is large enough to need scoping before implementation.
- Multiple approaches are possible and a decision should be recorded.
- The work should be reviewable as a unit.
- You want to separate planning from execution.

## How specs differ from `.agents/skills/`

| `.agents/skills/` | `specs/` |
|------------|----------|
| Reusable task instructions | One-time change plans |
| Frontmatter for matching and discovery | Sections for planning and review |
| Examples: accessibility review, performance budget | Examples: add portfolio link, migrate tag pages |

## Suggested format

Use `specs/_template.md` as the starting point. Copy it to a new file named after the change, for example `specs/portfolio-design-system-link.md`.

## How agents should use specs

1. Before implementing a change, check whether a spec already exists in `specs/`.
2. If a spec exists, read it first and follow its requirements, constraints, and acceptance criteria.
3. If no spec exists and the change is non-trivial, create a spec before writing code.
4. After implementation, update the spec status to `done` or `superseded`.
5. Do not delete specs unless they are clearly obsolete; they preserve decision history.
