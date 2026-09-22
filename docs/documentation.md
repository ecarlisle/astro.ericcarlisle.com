# Writing Documentation

**Use when:** Writing or editing `AGENTS.md`, `README.md`, anything under `docs/`, or agent tool
configuration.

This repo follows the model from `agent-context-and-documentation`. The same text serves humans
and agents.

## Style

- Write one version for everyone. Never keep separate agent and human copies of the same content.
- Lead with the fact or instruction. Add rationale after it, and only when it changes a decision.
- Prefer short declarative sentences and tables to prose.
- Cut anything that does not change what the reader does next.
- Give every fact one owning doc and link to it elsewhere. The owners are mapped in
  [Architecture](architecture.md#documentation-and-sources-of-truth).
- Open every file under `docs/` with `**Use when:** <trigger>` right after the title. Keep it
  consistent with the file's routing row in `AGENTS.md`.
- Do not copy values that live in code (versions, thresholds, token values). The exception is a
  paste-in payload such as the Figma references, which must say which source wins.

## Length

- Target under 300 words per doc; 600 is the ceiling. Before crossing it, split by concern and add
  a routing row.
- `AGENTS.md` holds only principles, protected files, and routing tables. Topic detail belongs
  in `docs/`.
- Exempt: paste-in payloads that must be one file,
  [figma-agent-brief.md](design-system/figma-agent-brief.md) being the only one. It still follows
  every other rule.

## Agent tools

- **Instructions:** `AGENTS.md` is the only source. A tool that needs its own file gets a thin
  pointer, listed in [README](../README.md#agent-compatibility-shims).
- **Skills:** each skill lives once, in `.agents/skills/`. A tool's own skills directory is a
  symlink to it, never a copy. This applies even when an installer tries to vendor a copy.

## When a fact changes

Update its owning doc in the same change. Renaming a heading breaks its anchor, so grep for inbound
links. Then run `pnpm validate:agent-docs`, and `pnpm context:health` if a measured file changed
(see [Testing](testing.md#when-to-run-each-check)).
