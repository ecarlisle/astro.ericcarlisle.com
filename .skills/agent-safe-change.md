# Agent Safe Change Skill

Use this skill for every implementation task.

## Boundaries

- Make the smallest change that satisfies the request.
- Do not rewrite unrelated files.
- Do not rename routes, components, tokens, or scripts unless required.
- Do not remove existing behavior unless explicitly requested.
- Do not add dependencies without clear justification.
- Do not invent missing requirements.
- Ask for clarification only when implementation would otherwise be unsafe or ambiguous.

## Workflow

1. Inspect relevant files before editing.
2. Summarize the intended change.
3. Edit only files required for the task.
4. Run available checks.
5. Report changed files, verification steps, and any tradeoffs.

## Stop Conditions

Stop and report instead of guessing when:

- A requested file or component does not exist.
- The build system behaves differently than expected.
- A dependency conflicts with the project.
- The task would require deleting or replacing unrelated work.
