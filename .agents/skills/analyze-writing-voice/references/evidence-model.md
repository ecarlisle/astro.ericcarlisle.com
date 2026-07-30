# Voice Evidence Model

Use this model to prevent drift across agents and sessions.

## Evidence record

Record:

- a narrow, testable observation;
- evidence type;
- authorship;
- source or provenance limitation;
- task context;
- register;
- date when known;
- whether the evidence supports, contradicts, or qualifies a profile rule;
- confidence; and
- status: `candidate`, `promoted`, `rejected`, or `superseded`.

## Weight

### High

- Explicit writer preference
- Explained writer revision
- Repeated independent behavior across representative samples

### Medium

- Substantial unexplained writer revision
- Published or writer-identified representative sample
- Repeated prompt pattern within a known register

### Low

- One ordinary prompt
- Agent inference
- Uncertain authorship
- Practical acceptance of an agent draft

Low-weight evidence may create a candidate. It cannot establish a stable rule alone.

## Promotion

- Promote an unambiguous explicit preference without manufacturing corroboration.
- Require independent evidence for inferred stable traits.
- Prefer evidence distributed across tasks and time.
- Narrow a rule to a register when genre explains a contradiction.
- Preserve unresolved contradictions instead of averaging them.
- Re-evaluate primary evidence rather than chains of summaries.

## Contamination controls

Do not learn voice from agent-generated prose, copied material, code, logs, reports, the current
profile, or topic vocabulary that appears only because of the subject.

An accepted draft may mean "usable," not "authentically mine."

For prompts, analyze conversational reasoning and posture. Exclude likely typing and dictation
artifacts from mechanical conclusions.
