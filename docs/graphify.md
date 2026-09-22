# Graphify

**Use when:** `/graphify`, or broad codebase, architecture, or file-relationship questions.

- When the user types `/graphify`, use the installed Graphify skill or its instructions before
  doing anything else.
- When `graphify-out/graph.json` exists, follow the Graphify skill for codebase questions and graph
  refreshes. The skill owns command selection.
- `graphify-out/` is gitignored, machine-local output and may be stale. Verify answers against
  current source files.
