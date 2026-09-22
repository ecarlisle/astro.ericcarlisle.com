# Context Health Metrics

**Use when:** Scoring or defining Context Health checks and metrics. Part of the
[Context Health rubric](context-health-rubric.md).

## Static check model

- Check results: `Pass = 1`, `Partial = 0.5`, `Fail = 0`.
- Weights are positive and total 1.
- Contribution = `check weight × result score`. Metric score = sum of contributions.
- Checks and weights are profile-specific. Lock them before classifying evidence or assigning
  results.

| Result | Anchor |
|---|---|
| Pass | Evidence supports the complete, profile-specific check |
| Partial | Evidence supports only part of the check, or loaded material adds a documented precision or ambiguity cost |
| Fail | The required capability is absent, contradicted, unreachable, or unsupported |

Do not weaken a requirement after seeing evidence. Do not omit required context to improve
Precision. Do not add unrelated checks to make an audit look comprehensive.

## Context Precision

Asks whether all loaded material is relevant, judged at the smallest practical file, section,
heading, rule, or claim. Assess every loaded portion. Useful sections do not excuse unrelated
material elsewhere in the same file, and irrelevant loaded sections reduce Precision. File-level
routing relevance and within-file precision are related but distinct.

Future observed result: `relevant loaded units / all loaded units`. Define the unit before running
the suite, record the numerator, denominator, and judgment method, and never switch units silently.

## Context Recall

Asks whether the profile routes to every required context item in the locked inventory.

Future observed result:
`sum(weights for required units actually loaded) / sum(weights for all required units)`.

Lock required units, weights, and ground truth before running tasks. Derive ground truth from
acceptance criteria, canonical docs, source, tests, and human-reviewed task analysis, never from
what the agent happened to retrieve. Report missing units and their discovery paths. Broad
repository loading does not substitute for effective routing.

## Sufficiency

Asks whether the selected context appears actionable for the profile's requirements. The static
result is a readiness judgment, not task-performance evidence.

A future observed result compares paired conditions:

- **oracle:** the complete, predeclared context;
- **routed:** normal repository routing; and
- **baseline:** optional no-routing or ordinary-context comparison.

Score: `routed-condition passes / oracle-passable tasks`. Exclude and report tasks that the oracle
condition cannot pass. Keep the model, tools, environment, fixtures, and success criteria constant
across conditions.

## Authority Clarity

Project-defined. Static checks inspect declared authority, precedence, source-of-truth boundaries,
protected-file rules, and conflict guidance.

Future observed result: `correct authority decisions / all authority decisions`, measured with
authority-challenge tasks. Report instruction conflicts separately from ordinary failures. Also
report unresolved conflicts, ambiguous areas, the expected controlling source, which source won and
why, and whether the expected precedence rule applied.

## Active Context Size

The generator reads each declared file as UTF-8 and reports its JavaScript string length in UTF-16
code units (not bytes or code points). The static token estimate is
`ceil(total UTF-16 code units / 4)`. This is an approximation, not real tokenization. Core 0.1 has
no universal good, healthy, or risky thresholds.

When available, future observed reporting captures:

- actual model-input and retrieved-context tokens;
- median and p95 tokens across runs;
- tokens per successful task;
- irrelevant-context volume; and
- the routed-to-oracle context ratio.

Interpret these within the task, retrieval, model, and configuration profile.
