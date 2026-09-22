# Context Health Core 0.1

**Use when:** Auditing, scoring, or reporting Context Health, or changing its methodology.

Context Health Core 0.1 is an experimental methodology. It describes how well a repository's
coding-agent context supports a declared task profile. It keeps four things separate:

- **static assessment** of repository readiness;
- **observed evaluation** from representative task runs;
- **evidence maturity** for each metric; and
- **profile coverage**, including profiles not yet evaluated.

Use the [Context Health refresh skill](../.agents/skills/context-health-refresh/SKILL.md) for the
repository procedure. This rubric owns the methodology, split across three files. Read all three
before an audit:

| File | Owns |
|---|---|
| This file | Report boundaries, static and observed statuses, evidence maturity |
| [Metrics](context-health-metrics.md) | Static check model, result anchors, metric definitions |
| [Evidence and audits](context-health-audit.md) | Evidence requirements, audit procedure, profile coverage, comparison rules, calibration examples |

It adapts narrow ideas from [TREC](https://trec.nist.gov/about.html),
[Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/),
[SWE-bench](https://www.swebench.com/),
[OpenTelemetry GenAI](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/),
[AGENTS.md](https://agents.md/), and [OpenSSF Scorecard](https://www.scorecard.dev/), none of which
endorses it. **Authority Clarity is project-defined.**

## Required report boundaries

Every report must name:

- the schema version and experimental Core methodology version;
- the audited repository revision;
- one or more profile identifiers and versions;
- which profiles are statically assessed, observed, or not evaluated;
- the declared task, expected outcome, requirements, and exclusions;
- the complete context inventory used by the static assessment;
- each metric's assessed and observed records; and
- limitations that prevent broader claims.

Do not calculate an aggregate Context Health score. Do not average profiles. Do not represent an
unevaluated profile with a zero, a placeholder score, or an inherited result.

Schema 3.0 splits each metric into `assessed` and `observed` records. The profile-v2 migration
carried schema 2.1 data forward unchanged. It was not a new audit, so initial observed records are
`not-measured`.

## Static assessment

Static assessment asks whether declared instructions, routes, source-of-truth relationships, and
selected context appear ready for a profile, using agent judgment and deterministic validation. A
score covers only that profile's locked checks. A 100% score does not prove task success,
completeness, or model behavior.

| Status | Meaning |
|---|---|
| `complete-for-current-static-checks` | Every locked check passes |
| `gaps-found` | One or more locked checks are Partial or Fail |
| `declared-estimate` | A deterministic estimate with no quality score |

Do not convert static scores or size estimates into universal "healthy," "needs attention," or "at
risk" labels.

## Observed evaluation

Observed evaluation requires representative task runs. Each observed record supports:

- status: `not-measured`, `measured`, or `insufficient-evidence`;
- score and numerator/denominator, when measured;
- task, run, agent, and configuration counts;
- repository revision and evaluation-suite version;
- variation or confidence, when the design permits; and
- interpretation and limitations.

For `not-measured`, the score, numerator, denominator, revision, suite version, variation, and
confidence are null. Task, run, and configuration counts are zero, or omitted by a future schema.
Never infer observed performance from static evidence.

## Evidence maturity model v1

Assign one level to every assessed metric and explain why it qualifies. Maturity is ordinal
provenance. It is not a percentage or a second health score.

1. `declared`: a documented claim with identified evidence and explicit limitations.
2. `structurally-verified`: deterministic checks confirm the relevant files, links, headings,
   scripts, precedence, measurements, or report structure.
3. `observed`: at least one representative task run supplies direct performance evidence.
4. `repeated`: multiple representative runs show the result across declared agents or
   configurations.
5. `resilient`: repeated results hold under versioned perturbation, stale guidance, noise, or
   authority-conflict challenges.

A metric's citations can be structurally verified while its semantic conclusion is only declared.
Choose the level the result itself supports, and state the distinction in the reason.
