# Context Health Scoring Rubric

## 1. Purpose and non-goals

This rubric governs how coding agents evaluate repository context and record Context Health findings. Its purpose is to make separate audits of the same declared scope more repeatable, reviewable, and comparable. It improves inter-rater consistency by fixing the order of decisions, the meaning of result labels, and the evidence expected for each finding.

The rubric does not measure actual LLM behavior or output quality. It also does not make semantic judgment objective. Context relevance, sufficiency, and authority still require an agent to interpret the declared task. The report makes that judgment visible instead of presenting it as deterministic.

### Assessment boundaries

Context Health separates five concepts:

- **Deterministic measurement** is derived by repository tooling from declared inputs. The current implementation calculates contributions, metric scores, score statuses, effective-context JavaScript string lengths, approximate token counts, size status, and the size interpretation.
- **Agent-assessed judgment** classifies a defined check as Pass, Partial, or Fail and records its positive or negative impact.
- **Evidence** states what is observable and cites where it can be verified.
- **Interpretation** explains why the observation matters to the declared task and metric.
- **Recommendation** proposes a useful response to a Partial or Fail finding. In the current report schema, recommendations belong in the prioritized recommendations or accompanying audit notes, not as an unsupported field on an individual check.

## 2. Select one audit scope

Choose the audit type before defining checks or assigning results.

### Task-specific audit

A task-specific audit evaluates only the context needed for one declared task or task category. Examples include:

- a significant Astro UI change;
- a content-only change;
- a deployment change;
- a contact-worker change;
- a design-system change.

The effective context should contain the authority, routed documentation, skills, and source references that an agent would use for that task. Unrelated repository concerns may be recorded, but they do not affect the task-specific score.

### Repository-wide audit

A repository-wide audit evaluates routing and context health across multiple task categories. It must use separate task profiles or subreports, each with its own requirements, effective-context set, checks, weights, and exclusions.

> A single score must not mix task-specific context quality with unrelated repository-wide documentation concerns.

There is no universal effective-context set for the repository. Combining every possible task route into one set would measure document volume more than the context an agent receives for a real task.

## 3. Declare the scope

Declare the following before the preliminary context inventory:

- **Audit type:** task-specific or repository-wide.
- **Task or task category:** the concrete work being evaluated.
- **Expected outcome:** what a successful agent change or review would produce.
- **Known requirements:** behavior, constraints, validation, and stop conditions already identified.
- **Effective-context entry point:** normally `AGENTS.md`, followed by the routes that apply to the task.
- **Routed files and skills:** the files intentionally loaded for the task.
- **Explicit exclusions:** irrelevant routes, files, and checks.
- **Audit revision:** the Git revision whose repository context is being assessed.

Establish the task and scope before inventory work. Use a preliminary inventory to discover the applicable context and derive the final checks and weights. Lock those checks and weights before classifying evidence or assigning results.

## 4. Use the smallest useful unit of evaluation

Prefer evidence about a requirement, section, claim, instruction, or routing relationship. Identify the smallest practical section, heading, rule, or claim. File-level routing relevance and within-file content precision are related but distinct assessments.

Assess every portion actually loaded into the agent’s context. A useful section does not excuse unrelated material elsewhere in the same loaded file; irrelevant loaded sections reduce Context Precision. For example, the performance skill contains directly relevant bundle-isolation guidance for a page-specific JavaScript task and unrelated media guidance for a text-only change. The audit should record both rather than treating the file as uniformly relevant.

## 5. Apply the core scoring rule

> A finding may affect a task-specific score only when it affects the declared task’s requirements or effective context.

Apply the rule consistently:

- Contact-worker discoverability must not lower a UI-only task score.
- Performance guidance should not reduce Context Precision when bundle isolation or page performance is part of the declared task.
- A document reached through an intentional routing chain is not missing merely because it requires one additional hop.
- An unrelated repository weakness may be recorded separately but excluded from the task score.

## 6. Assign result anchors

The current schema supports three results:

| Result | Numeric value | Anchor |
|---|---:|---|
| **Pass** | 1 | Fully satisfies the defined check with clear evidence. |
| **Partial** | 0.5 | Useful but meaningfully incomplete, indirect, duplicated, mildly ambiguous, or difficult to apply. |
| **Fail** | 0 | Missing, materially irrelevant, contradictory, unactionable, or without identifiable authority. |

The current validator requires Pass checks to be positive contributors and Partial or Fail checks to be negative contributors. Do not use the impact field to reverse or soften the result anchor.

The schema has no `not-applicable` result. Remove an irrelevant check before scoring and document it under scope exclusions. Do not write unsupported result values into `src/data/context-health.json`.

For each agent-assessed metric:

```text
contribution = check weight × result value
metric score = sum of contributions
```

Valid report weights total 1, so no additional normalization is needed. The current status bands are:

- Healthy: 85% or higher
- Needs attention: 70% through 84.9%
- At risk: below 70%

## 7. Set weights before results

After declaring the task and completing a preliminary context inventory, derive stable check IDs and weights from the task requirements and inventory. Lock them before classifying evidence or assigning Pass, Partial, or Fail. This prevents the desired score from shaping the scoring model after evidence is known.

- Weights must total 1 within each scored metric.
- Weight reflects a check’s importance to the declared task.
- Similar audits should reuse the same versioned check profile.
- Explain every changed check or weight.
- Do not adjust weights merely to produce a preferred score.
- Compare scores only when scope and weighting profiles are compatible.

If the rubric, checks, or weights change materially after they are locked, stop the comparison and increment the relevant rubric or task-profile version. Do not compare the result directly with older reports unless those reports are regenerated under the same methodology.

This repository does not yet define canonical machine-readable task profiles, version fields, or universal weights. Treat profile standardization as future work. Until profiles exist, record the methodology version and the reason for each change in the audit notes rather than adding unsupported fields to the report.

## 8. Assess each metric

### Context Precision

Context Precision asks whether the context actually loaded for the declared task is relevant.

Evaluate both whether each file was appropriately routed and whether each loaded portion of that file is relevant. Positive evidence may include task-specific routing, relevant constraints, necessary validation guidance, and concise authoritative references. Negative evidence may include unrelated loaded sections, redundant instructions, stale sections, and mandatory guidance whose breadth is not justified by the task.

Do not penalize performance, accessibility, or testing guidance merely because it is lengthy. If the declared task includes page performance, bundle isolation, semantic behavior, or verification, that guidance is relevant. Length becomes a Precision concern when loaded content is unrelated to the task, including unrelated material inside an otherwise useful file.

### Context Recall

Context Recall asks whether required information is reachable through the declared context path.

Distinguish among:

- guidance that is missing;
- guidance that is reachable but indirectly routed;
- guidance intentionally excluded because it does not apply.

One intentional routing hop may reduce convenience or discoverability, but it should not automatically be treated as missing context. Record the route and judge whether the extra hop materially impedes the declared task.

### Sufficiency

Sufficiency asks whether the available guidance is actionable enough to complete and verify the task. A mention alone is not sufficient.

Look for:

- required behavior;
- constraints;
- implementation boundaries;
- validation commands;
- stop conditions;
- failure or escalation guidance where relevant.

The question is not whether a subject appears somewhere in the context. The evidence should show that an agent can act on it.

### Authority Clarity

Authority Clarity asks whether an agent can identify the canonical source and resolve disagreement.

Look for named sources of truth, documentation boundaries, supersession rules, conflicting instructions, and duplicate summaries that could drift. Audience-specific summaries are not conflicts by themselves. They affect Authority Clarity only when the canonical source or required behavior becomes genuinely ambiguous.

### Active Context Size

Active Context Size is deterministic:

- Measure only the declared `effectiveContext.files`.
- Report the JavaScript string length (UTF-16 code units) produced after UTF-8 decoding. This is not a byte count or Unicode-code-point count.
- Estimate tokens as `ceil(total JavaScript string length / 4)`.
- Identify that estimate as an approximation, not a tokenizer result.
- Do not substitute repository-wide file volume for active context.
- Do not present the size status bands as model context-window limits.

The current review bands are Healthy at 24,000 estimated tokens or fewer, Needs attention from 24,001 through 48,000, and At risk above 48,000. They describe this report’s review bands, not a model capability.

## 9. Record evidence, interpretation, and recommendations

Every scored finding must include:

- a stable finding or check ID;
- an observable evidence statement;
- an interpretation;
- a result;
- a weight;
- a positive or negative classification;
- a recommendation for Partial or Fail findings where useful.

Repository-backed findings must identify their source file. A genuinely file-level finding may link the whole file; section- or claim-level findings must link the narrowest practical line or line range. Target the audited commit revision when it is available so later repository changes do not invalidate the evidence; use the repository’s main branch only when no valid audited revision is available.

The auditor must verify that every source link resolves and that the linked content supports the associated finding. Do not add a repository link to an unsupported narrative claim merely for appearance. The current validator checks repository paths, line ranges, section references, and generated GitHub URLs against the audited revision.

Keep the reasoning fields separate:

```text
Observed:
Assessment:
Recommendation:
```

`Observed` states what can be verified without including the conclusion it is supposed to prove. `Assessment` connects that observation to the declared task and metric. `Recommendation` describes a proportionate response. Because the current check schema has no recommendation property, place recommendations in `priorities` or in accompanying audit notes.

## 10. Record exclusions and non-scoring observations

Useful repository issues outside the declared scope may be recorded as:

- out-of-scope observations;
- repository-wide follow-up opportunities;
- recommendations for another task profile.

They must not affect the current task-specific score. State both why the observation is useful and why it is excluded. This preserves the finding without quietly broadening the audit.

## 11. Calibrate judgments with repository examples

These examples illustrate the anchors; they do not establish universal checks or weights.

### Direct authoritative route

- **Scope:** Significant Astro UI change.
- **Evidence:** `AGENTS.md` directly routes styling, tokens, and accessibility work under `## Before making significant changes`, and names the UI skills under `## Skills`.
- **Expected result:** Pass.
- **Affects the score:** Yes, for Context Recall or Authority Clarity.
- **Rationale:** The primary agent authority exposes the relevant sources without an undeclared discovery step.

### One intentional routing hop

- **Scope:** A feature change governed by a repository specification.
- **Evidence:** `AGENTS.md` routes agent-workflow changes to `docs/agent-workflow.md`; `### Standard Development Steps` then tells the agent to check `specs/`.
- **Expected result:** Partial may be appropriate for discoverability, but not Fail.
- **Affects the score:** Yes, only if specification discovery is a requirement of the declared task profile.
- **Rationale:** The information is reachable through an intentional route. The additional hop may add friction, but the guidance is not missing.

### Unrelated contact-worker issue

- **Scope:** Astro UI-only change.
- **Evidence:** `AGENTS.md` routes contact-worker work separately, and `docs/deployment.md` contains `## Contact Worker Deployment`.
- **Expected result:** Excluded.
- **Affects the score:** No.
- **Rationale:** Contact-worker discoverability does not affect the UI task’s requirements or effective context. It may be recorded as a repository-wide follow-up.

### Relevant performance guidance

- **Scope:** Verify that a page-specific feature does not leak JavaScript or CSS into ordinary production pages.
- **Evidence:** `.agents/skills/performance-budget/SKILL.md` includes `## JavaScript Checks` and `## Verification`; `tests/lab-context.spec.ts` checks feature-script and stylesheet isolation.
- **Expected result:** Pass when that guidance is intentionally routed and actionable.
- **Affects the score:** Yes, for Context Precision and Sufficiency.
- **Rationale:** Bundle isolation and production-output verification are explicit requirements of the task. The guidance is relevant even if the full skill is long.

### Repeated command summaries

- **Scope:** Repository-wide authority audit.
- **Evidence:** `AGENTS.md` has `## Commands`, `README.md` has `## Primary Commands`, and `docs/testing.md` has `## Available Checks`; `AGENTS.md` identifies `package.json` as the source of truth for exact scripts.
- **Expected result:** Partial may be appropriate for synchronization risk.
- **Affects the score:** Yes, when the profile checks duplication or maintenance risk.
- **Rationale:** The summaries can drift, but authority remains resolvable through `package.json`. Duplication alone does not establish a conflicting authority.

### Genuine conflicting authority

- **Scope:** Any task whose validation command is disputed.
- **Evidence:** Hypothetically, `AGENTS.md` requires command A while an equally authoritative repository instruction requires incompatible command B for the same change, with no supersession rule.
- **Expected result:** Fail until authority is resolved.
- **Affects the score:** Yes, for Authority Clarity and possibly Sufficiency.
- **Rationale:** An agent cannot determine which instruction governs. This example is hypothetical; the current repository command summaries may drift, but `AGENTS.md` names `package.json` as the source of truth for exact scripts.

## 12. Follow the audit procedure

1. Declare the task, audit type, scope, expected outcome, known requirements, and explicit exclusions.
2. Read `AGENTS.md` and the documentation it routes for the task, then build a preliminary effective-context inventory.
3. Derive check IDs and weights from the task requirements and preliminary inventory.
4. Lock the checks and weights before classifying evidence or assigning scores.
5. Assess every loaded portion, recording observable evidence at the smallest practical section, heading, rule, or claim.
6. Assign Pass, Partial, or Fail results.
7. If the rubric, checks, or weights change materially, increment the relevant methodology version and establish a new comparison baseline.
8. Finalize the effective-context inventory and exclusions.
9. Add source links for repository-backed evidence and verify that each link resolves and supports its finding.
10. Run `pnpm context:health`.
11. Run `pnpm context:health:validate`.
12. Review generated changes and confirm that only intended deterministic fields changed.
13. Run the site checks relevant to the affected files.
14. Compare the result only with compatible prior reports.
15. Report disagreements, uncertainty, and provisional findings.

`pnpm context:health` recalculates agent-assessed contributions, metric scores, score statuses, and Active Context Size from the declared report inputs. It does not decide semantic results or rewrite evidence judgments for the agent.

## 13. Stop or mark the audit provisional

Stop the audit or label its findings provisional when:

- the task is not defined;
- the effective context cannot be established;
- canonical authority cannot be determined;
- evidence conflicts materially;
- a required citation cannot be verified;
- the rubric or check profile changed during comparison;
- task-specific and repository-wide findings cannot be separated.

Do not fill these gaps with assumed scope, invented evidence, or adjusted weights. Record the blocking uncertainty and what would resolve it.

## 14. Version and compare reports

Record both the report `schemaVersion` and the audited `repositoryRevision`. The schema version describes the report structure; the repository revision identifies the baseline being assessed.

Document scoring-method changes, including changes to the rubric, task profile, check definitions, result anchors, or weights. Increment the relevant methodology version when any of these changes materially. Compare scores only when all of the following are compatible:

- audit type and declared task scope;
- task profile;
- effective-context selection rule;
- checks and weights;
- scoring rubric and report schema.

A changed rubric or profile requires a new baseline unless earlier reports are regenerated under the same methodology. Do not label a score difference as improvement or regression when the underlying measurement changed.

## 15. Use the audit summary format

```text
Audit scope:
Audited revision:
Effective context:
Excluded context:
Metric scores:
Key positive contributors:
Key negative contributors:
Out-of-scope observations:
Prioritized recommendations:
Provisional findings:
Validation results:
```

Keep the summary concise enough to review against the detailed report. It should expose scope and exclusions before presenting scores.

## Future profile work

Machine-readable task profiles and automated inter-rater comparisons would make repeated audits easier to calibrate. They could standardize check IDs, weights, and compatibility metadata. They are future improvements, not part of the current report schema or this rubric.
