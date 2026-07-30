# Voice Evidence Ledger

This append-only ledger stores candidate evidence for the canonical
[voice profile](profile.md). Record primary observations here before changing the profile.

## Recording rules

- Add one entry for each distinct observation.
- Record provenance, authorship, context, register, evidence type, confidence, and status.
- Count unique evidence rather than the number of agents that report it.
- Do not copy entire prompts, conversations, or articles into this file.
- Do not treat the profile or agent-generated prose as evidence for itself.
- Use `candidate`, `promoted`, `rejected`, or `superseded` status.
- Promote evidence through the `analyze-writing-voice` skill.

## Evidence

| ID | Date | Source | Type | Register | Observation | Confidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | 2026-07-30 | Author direction for this workflow | Explicit preference | Conversational and prompt | Ordinary prompts should contribute to analysis of speaking style, while task shorthand and likely transcription artifacts should not become finished-writing mechanics. | High | Promoted |
| EV-002 | 2026-07-30 | [Editorial guidelines](../../docs/editorial-guidelines.md) | Established project guidance | Reflective technical article | The intended voice is grounded, clear, human-first, thoughtful, practical, curious, and experienced without inflation. | High | Promoted |
| EV-003 | 2026-07-30 | [Better Agent Results Start With Better Context](../../src/content/blog/better-agent-results-start-with-better-context.mdx) | Published representative sample | Reflective technical article | Concrete experience and visible reasoning support broader technical conclusions without replacing the initial observation. | Medium | Promoted |
| EV-004 | 2026-07-30 | Historical `.agents/skills/copy-edit/references/voice-guide.md` | Established project guidance | Cross-register | Authority through specificity, calibrated certainty, connected paragraphs, plain language, and restrained humor are recurring established traits. | High | Promoted |
| EV-005 | 2026-07-30 | Author feedback during prior drafting sessions; conversation source not stored in repository | Explicit feedback | Professional social and article | Repeated isolated sentences can feel market-driven when they are developing one connected thought. | High | Promoted |

## Unresolved candidates

Add new candidate entries to the evidence table. Do not create a second running list of conclusions.
