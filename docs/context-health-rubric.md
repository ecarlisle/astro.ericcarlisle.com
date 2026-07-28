# Context Health Core 0.1

Context Health Core 0.1 is an experimental methodology for describing how well a repository’s
coding-agent context supports a declared task profile. It separates:

- **static assessment** of repository readiness;
- **observed evaluation** from representative task runs;
- **evidence maturity** for each metric; and
- **profile coverage**, including profiles not yet evaluated.

There is no known complete open standard that combines these four concerns. Core 0.1 adapts
narrower ideas from established evaluation and repository-guidance projects; none of those sources
defines or endorses this methodology.

Use the [Context Health refresh skill](../.agents/skills/context-health-refresh/SKILL.md) for the
repository procedure. This document owns metric definitions, evidence requirements, statuses,
versioning, and comparison rules.

## External foundations

Core 0.1 draws carefully bounded inspiration from:

- [TREC](https://trec.nist.gov/about.html), for versioned test collections, topics, and relevance
  judgments;
- [Ragas Context Precision](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/)
  and [Context Recall](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/),
  for distinguishing retrieved relevance from required coverage;
- [SWE-bench](https://www.swebench.com/), for repository-bound tasks evaluated by execution against
  outcome tests;
- [OpenTelemetry Generative AI attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/),
  for future runtime measurement vocabulary. Relevant conventions remain under development, and
  some registry attributes have moved to a separate GenAI semantic-conventions repository;
- [AGENTS.md](https://agents.md/), for repository instruction discovery and nearest-file
  precedence; and
- [OpenSSF Scorecard](https://www.scorecard.dev/), for evidence-backed checks and actionable
  remediation.

Precision and recall are adapted concepts, not Ragas-compatible implementations. Task execution is
inspired by benchmark practice, not a SWE-bench result. **Authority Clarity is project-defined.**

## Required report boundaries

Every report must name:

- the schema version and experimental Core methodology version;
- the audited repository revision;
- one or more profile identifiers and versions;
- which profiles are statically assessed, observed, or not evaluated;
- the declared task, expected outcome, requirements, and exclusions;
- the complete context inventory used by the static assessment;
- each metric’s assessed and observed records; and
- limitations that prevent broader claims.

Do not calculate an aggregate Context Health score. Do not average profiles. Do not represent an
unevaluated profile with a zero, placeholder score, or inherited result.

### Schema 3.0 migration

Schema 3.0 moves each metric’s prior static result into an `assessed` record and adds a separate
`observed` record. The current profile-v2 migration preserves the audited revision, citations,
checks, weights, contributions, scores, and declared full-file measurement from schema 2.1. It is a
data-model migration, not a new behavioral audit. Initial observed records are `not-measured`.

## Static assessment and observed evaluation

### Static assessment

Static assessment asks whether declared repository instructions, routes, source-of-truth
relationships, and selected context appear ready for a profile. It can use agent judgment and
deterministic structural validation.

Static scores describe only the finite checks and weights locked for the named profile. A 100%
score means those checks passed; it does not prove task success, universal completeness, or model
behavior.

Use these static statuses:

- `complete-for-current-static-checks` — every locked check passes;
- `gaps-found` — one or more locked checks are Partial or Fail; and
- `declared-estimate` — a deterministic estimate is reported without a quality score.

Do not convert static scores or size estimates into universal “healthy,” “needs attention,” or “at
risk” labels.

### Observed evaluation

Observed evaluation requires representative task runs. Each observed record must support:

- status: `not-measured`, `measured`, or `insufficient-evidence`;
- score and numerator/denominator, when measured;
- task, run, agent, and configuration counts;
- repository revision and evaluation-suite version;
- variation or confidence information when the design permits it; and
- interpretation and limitations.

`not-measured` requires a null score, numerator, denominator, revision, suite version, variation,
and confidence, with task, run, and configuration counts set consistently to zero or omitted by a
future schema. Never infer observed performance from static evidence.

## Evidence maturity model v1

Assign one level to every assessed metric and explain why it qualifies. Maturity is ordinal
provenance, not a percentage and not another health score.

1. `declared` — a documented claim has identified evidence and explicit limitations.
2. `structurally-verified` — deterministic checks confirm relevant files, links, headings, scripts,
   precedence, measurements, or report structure.
3. `observed` — at least one representative task run supplies direct performance evidence.
4. `repeated` — multiple representative runs show the result across declared agents or
   configurations.
5. `resilient` — repeated results remain acceptable under versioned perturbation, stale guidance,
   noise, or authority-conflict challenges.

A metric may have structurally verified citations while its semantic conclusion remains declared.
Choose the level supported by the result itself, and state this distinction in the reason.

## Static check model

For scored static metrics:

- Check results are `Pass = 1`, `Partial = 0.5`, and `Fail = 0`.
- Weights must be positive and total 1.
- Contribution = `check weight × result score`.
- Metric score = sum of contributions.

Checks and weights are profile-specific. Lock them before classifying evidence or assigning
results.

### Result anchors

- **Pass:** evidence supports the complete, profile-specific check.
- **Partial:** evidence supports only part of the check, or loaded material introduces a documented
  precision or ambiguity cost.
- **Fail:** the required capability is absent, contradicted, unreachable, or unsupported.

Do not weaken a requirement after seeing evidence. Do not omit required context to improve
Precision. Do not add unrelated checks merely to make an audit look comprehensive.

## Metric definitions

### Context Precision

Static Context Precision asks whether all loaded material is relevant at the smallest practical
file, section, heading, rule, or claim.

- Assess every loaded portion of a document.
- Useful sections do not excuse unrelated material elsewhere in the same loaded file.
- Irrelevant loaded sections reduce Precision.
- File-level routing relevance and within-file content precision are related but distinct.
- Evidence must identify the smallest practical section, heading, rule, or claim.

The current static score uses locked weighted checks. A future observed result must use:

`relevant loaded units / all loaded units`

Define the unit before running the suite. Record the numerator, denominator, and judgment method.
Do not silently switch between files, chunks, sections, or claims.

### Context Recall

Static Context Recall asks whether the declared profile routes to every required context item in the
locked inventory.

A future observed result must use:

`sum(weights for required units actually loaded) / sum(weights for all required units)`

Lock required units, weights, and ground truth before executing tasks. Derive ground truth from
acceptance criteria, canonical documentation, source, tests, and human-reviewed task analysis.
Report missing units and their discovery paths. Ground truth must not be reconstructed from what
the agent happened to retrieve, and broad repository loading must not substitute for effective
routing.

### Sufficiency

Static Sufficiency asks whether selected context appears actionable for the profile’s requirements.
This is a readiness judgment, not task-performance evidence.

A future observed Sufficiency result requires paired conditions:

- **oracle:** the task receives the complete, predeclared context;
- **routed:** the task receives context through normal repository routing; and
- **baseline:** an optional no-routing or ordinary-context comparison.

Score:

`routed-condition passes / oracle-passable tasks`

Exclude tasks that the oracle condition cannot pass from the denominator, and report those
exclusions. Keep model, tools, environment, task fixtures, and success criteria constant across
conditions.

### Authority Clarity

Authority Clarity is project-defined. Static checks inspect declared authority, precedence,
source-of-truth boundaries, protected-file rules, and conflict guidance.

Future observed evaluation adds authority-challenge tasks:

`correct authority decisions / all authority decisions`

Report instruction conflicts separately from ordinary failures. Also report unresolved conflict
count, ambiguous authority areas, the expected controlling source, and evidence supporting that
decision. Record which source won, why, and whether the expected precedence rule was applied.

### Active Context Size

The static generator reads each declared file as UTF-8 and reports the resulting JavaScript string
length in UTF-16 code units. This is not a byte count or Unicode-code-point count.

The static token estimate is:

`ceil(total UTF-16 code units / 4)`

This remains an approximation, not actual tokenization. Core 0.1 defines no universal useful,
healthy, or risky token thresholds.

Future observed size reporting should capture, when available:

- actual model-input and retrieved-context tokens;
- median and p95 tokens across runs;
- tokens per successful task;
- irrelevant-context volume; and
- routed-to-oracle context ratio.

Interpret those measurements within the task, retrieval, model, and configuration profile.

## Evidence requirements

Separate observation, interpretation, and recommendation. An observation states what the audited
source contains. Interpretation explains why it affects the check. A recommendation describes a
future change.

Repository-backed findings must identify their source file. Section- or claim-level findings must
link the narrowest practical line or line range. Unsupported narrative claims must not receive a
repository link merely for appearance.

Store repository evidence as structured metadata:

- `path`;
- optional `startLine` and `endLine`; and
- optional `section` containing an exact, stable Markdown heading.

The report root stores `repositoryRevision`. The page derives URLs centrally:

- whole file: `blob/{auditedRevision}/{path}`;
- named Markdown section: `blob/{auditedRevision}/{path}#{heading-anchor}`;
- exact Markdown range:
  `blob/{auditedRevision}/{path}?plain=1#L{startLine}-L{endLine}`; and
- exact Markdown line: `blob/{auditedRevision}/{path}?plain=1#L{line}`.

Use heading anchors when a named section is sufficient and stable. Use `?plain=1` before the
fragment for exact Markdown passages. Prefer commit-specific permalinks. If no valid audited
revision exists, the URL builder may fall back to `main`; never invent a revision. PR diff links
are for discussing a particular change, not permanent audit evidence.

The auditor must verify that every source link resolves to the intended file, rendered heading, or
source passage and supports its associated finding.

## Audit procedure

1. Declare the task, expected outcome, requirements, exclusions, and profile.
2. Perform a preliminary repository and context inventory.
3. Derive checks and weights from the task requirements and inventory.
4. Lock checks and weights before classifying evidence or assigning scores.
5. Capture the audited revision and complete effective-context file set.
6. Assess every loaded portion at the smallest practical unit.
7. Record structured citations, interpretations, limitations, and maturity reasons.
8. Record observed data only from a versioned representative suite; otherwise use
   `not-measured`.
9. Generate, validate, and regenerate to prove idempotence.
10. Inspect the static page, source links, accessibility, responsive layout, and bundle isolation.

If the rubric, checks, weights, profile, or evidence-maturity definitions change materially,
increment the relevant version. Do not compare the result directly with older reports unless they
are regenerated under the same methodology and profile.

## Profile coverage

Every report must list the evaluated profile and materially different task families that remain
unevaluated. The current minimum inventory is:

- Significant Astro UI implementation profile v2 — static assessed;
- content and editorial work — not evaluated;
- deployment and CI diagnosis — not evaluated;
- Contact Worker changes — not evaluated; and
- pull-request review — not evaluated.

Do not infer cross-profile coverage. Add a new profile version when its task requirements, context
selection rule, checks, or weights change materially.

Evaluate another profile only after declaring its purpose, representative tasks, acceptance
criteria, required-context ground truth, versioned checks, and evidence.

## Future scenario taxonomy

A future observed suite should version representative scenarios across:

1. localized implementation;
2. cross-cutting change;
3. defect diagnosis;
4. configuration or deployment;
5. documentation change;
6. pull-request review;
7. scope or authorization boundary; and
8. repository-specific specialist task.

A scenario must be representative, context-dependent, bounded, verifiable, non-leading about file
paths, safe and reversible, versioned, and reviewed before execution.

This taxonomy is documentation, not authorization to build a runner, simulator, telemetry system,
or synthetic result set.

## Comparison and regression rules

Direct comparison requires the same:

- methodology and evidence-maturity versions;
- profile identifier and version;
- checks, weights, and scoring anchors;
- effective-context selection rule;
- observed suite version, task set, repository revision policy, agents, tools, and configurations;
  and
- measurement units and judgment method.

When comparability holds, use `regression-detected` to flag a meaningful worsening against the
declared baseline. Otherwise describe the difference without a trend claim.

## Calibration examples

- A routing table links the correct UI documents, but a required loaded performance playbook has
  several unrelated media sections: Precision is Partial for the affected check.
- Every locked requirement has an identified route: static Recall may be 100% and
  `complete-for-current-static-checks`, but observed Recall remains `not-measured`.
- Guidance looks actionable and passes all static checks: static Sufficiency can be complete, but
  it cannot become observed until paired oracle and routed tasks run.
- The generator confirms exact file lengths and valid evidence links: Active Context Size and
  relevant structural claims may be `structurally-verified`, not `observed`.
