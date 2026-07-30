---
name: analyze-writing-voice
title: Analyze Writing Voice
description: Builds and updates an evidence-backed writing voice profile from authentic samples, prompts, revisions, and explicit feedback while controlling provenance, confidence, register, and profile drift. Use when creating, reviewing, validating, or extending the shared voice analysis.
category: content
applies_to:
  - voice analysis
  - writing samples
  - prompts
  - revisions
  - editorial feedback
triggers:
  - analyze voice
  - update voice profile
  - review voice evidence
  - writing style analysis
  - speaking style analysis
priority: high
version: 2
---

# Analyze Writing Voice

Turn authentic evidence into a portable description of how the writer communicates. The canonical
profile is this skill's output and the `write-in-a-voice` skill's input.

Read:

- [the current voice profile](../../voice/profile.md);
- [the evidence ledger](../../voice/evidence.md); and
- [the evidence model](references/evidence-model.md).

Use [the interview guide](references/interview-guide.md) only when material gaps require elicited
evidence. Use [the profile schema](references/profile-schema.md) when creating or restructuring the
profile.

## Supported operations

- **Collect evidence** — record a qualifying observation without changing the profile.
- **Create a profile** — synthesize an initial profile from sufficient evidence.
- **Update a profile** — propose and apply evidence-supported changes.
- **Review evidence** — resolve duplicates, contradictions, scope, and confidence.
- **Validate a profile** — test whether the profile predicts the writer's preferences on material
  not used to create the relevant rule.

## Separate the evidence layers

Distinguish:

- **Voice** — stable posture, reasoning, and relationship with the reader;
- **Style** — observable diction, syntax, rhythm, structure, and rhetoric;
- **Register** — adaptation to genre, audience, purpose, and medium; and
- **Mechanics** — house conventions such as capitalization, citation form, or Oxford commas.

Do not turn a mechanical preference into a personality trait. Do not flatten different registers
into an averaged voice.

## Evaluate evidence

Prefer evidence in this order:

1. explicit preference stated by the writer;
2. writer revision accompanied by an explanation;
3. substantial writer revision without an explanation;
4. finished writing identified or published as representative;
5. repeated patterns across ordinary writer-authored prompts; and
6. an isolated prompt characteristic or agent inference.

Prompts are important evidence for the conversational or speaking-style register. Evaluate their
reasoning, framing, qualification, vocabulary, self-correction, humor, and relationship with the
reader. Do not learn spelling, punctuation, capitalization, fragments, or brevity from hurried
commands, transcription errors, or dictation artifacts.

Do not treat:

- copied quotations or research;
- code, logs, errors, generated reports, or structured data;
- agent-written prose that the writer merely accepted;
- the current profile; or
- another agent's unsupported summary

as primary evidence of the writer's voice.

## Record before promoting

Add one concise entry to [the evidence ledger](../../voice/evidence.md) for each distinct,
qualifying observation. Include source, authorship, context, register, evidence type, confidence,
and status. Count unique evidence, not the number of agents that noticed it.

Do not update the canonical profile from:

- one low-confidence observation;
- repeated reports of the same event;
- a pattern explainable only by task constraints; or
- a contradiction that has not been examined by register.

Promote explicit preferences immediately when they are unambiguous. Require repeated independent
evidence or writer confirmation for inferred stable traits.

## Update the profile

When a profile change is authorized:

1. State the existing rule.
2. Identify the new evidence and any contradiction.
3. Decide whether the change is stable, register-specific, mechanical, or unresolved.
4. Propose the smallest profile change.
5. Preserve the previous meaning where evidence has not changed.
6. Update the profile version and change history.
7. Append a `promoted` row to the evidence status history. Treat the latest dated status row for
   an evidence ID as authoritative.

Do not silently rewrite the profile during an unrelated task.

## Elicit missing evidence

Do not begin with a comprehensive questionnaire. Ask one focused question or exercise at a time,
then adapt the next question to what remains uncertain.

Prefer:

- short behavioral writing prompts;
- contrastive choices with a request to explain the choice;
- revision of bland or over-polished prose; and
- critique of a plausible but imperfect imitation.

Stop when additional questions are unlikely to change the profile materially. Record unresolved
questions rather than interviewing for artificial completeness.

## Validate the analysis

Use held-out passages or new writing tasks. Test more than one register only when the profile makes
cross-register claims.

Check whether the profile:

- predicts the writer's choices rather than explaining them afterward;
- preserves meaning and degree of certainty;
- keeps genre differences recognizable;
- avoids importing subject matter from unrelated samples; and
- improves recognition without exaggerating traits into mannerisms.

When a test fails, lower confidence or narrow the rule before adding compensating rules.

## Output behavior

For analysis-only work, return:

1. confirmed observations;
2. candidate observations;
3. contradictions or unresolved questions;
4. proposed profile changes; and
5. confidence and provenance limitations.

For an authorized repository update, edit the evidence ledger first and the canonical profile
second. Keep both concise.
