# Context Health Evidence and Audits

**Use when:** Recording Context Health evidence, running an audit, declaring profile coverage, or
comparing reports. Part of the [Context Health rubric](context-health-rubric.md).

## Evidence requirements

Keep observations (what the source says), interpretations (why it affects the check), and
recommendations (future changes) separate. Repository-backed findings name their file and link the
narrowest practical line or range. Never link an unsupported claim for appearance.

Store evidence as structured metadata: `path`, optional `startLine`/`endLine`, and optional
`section` (an exact, stable Markdown heading). The report root stores `repositoryRevision`, and the
page builds URLs from it:

| Target | URL |
|---|---|
| Whole file | `blob/{auditedRevision}/{path}` |
| Named section | `blob/{auditedRevision}/{path}#{heading-anchor}` |
| Line range | `blob/{auditedRevision}/{path}?plain=1#L{startLine}-L{endLine}` |
| Single line | `blob/{auditedRevision}/{path}?plain=1#L{line}` |

Prefer commit permalinks, and use a heading anchor when a stable section is enough. Without a valid
audited revision, the builder may fall back to `main`; never invent a revision. PR diff links are
not permanent evidence. Verify that each link resolves to the intended passage and supports its
finding.

## Audit procedure

1. Declare the task, expected outcome, requirements, exclusions, and profile.
2. Make a preliminary repository and context inventory.
3. Derive checks and weights from the requirements and inventory.
4. Lock checks and weights before classifying evidence or scoring.
5. Capture the audited revision and the complete effective-context file set.
6. Assess every loaded portion at the smallest practical unit.
7. Record structured citations, interpretations, limitations, and maturity reasons.
8. Record observed data only from a versioned representative suite; otherwise use `not-measured`.
9. Generate, validate, and regenerate to prove idempotence.
10. Inspect the static page, source links, accessibility, responsive layout, and bundle isolation.

Increment the relevant version when the rubric, checks, weights, profile, or maturity definitions
change materially.

## Profile coverage

Every report lists the evaluated profile and the materially different task families not yet
evaluated:

| Profile | Status |
|---|---|
| Significant Astro UI implementation v2 | Static assessed |
| Content and editorial work | Not evaluated |
| Deployment and CI diagnosis | Not evaluated |
| Contact Worker changes | Not evaluated |
| Pull-request review | Not evaluated |

Do not infer cross-profile coverage. Version a profile when its requirements, selection rule,
checks, or weights change materially. Before evaluating one, declare its purpose, tasks,
acceptance criteria, ground truth, checks, and evidence.

A future observed suite should version scenarios covering implementation, cross-cutting change,
diagnosis, deployment, documentation, review, authorization boundaries, and specialist tasks. Each
scenario must be representative, bounded, verifiable, non-leading about file paths, reversible,
and reviewed before it runs. This is intent only. It does not authorize a runner, simulator,
telemetry, or synthetic results.

## Comparison and regression rules

Compare reports directly only when these all match:

- methodology and evidence-maturity versions;
- profile identifier and version;
- checks, weights, and scoring anchors;
- the effective-context selection rule;
- the observed suite version, task set, revision policy, agents, tools, and configurations; and
- measurement units and judgment method.

If they match, use `regression-detected` for meaningful worsening against the baseline. Otherwise,
describe the difference without claiming a trend.

## Calibration examples

- Routing links the right UI docs, but a required playbook has unrelated media sections:
  Precision is Partial for that check.
- Every locked requirement has a route: static Recall can be 100% and
  `complete-for-current-static-checks` while observed Recall stays `not-measured`.
- Guidance passes every static check: static Sufficiency can be complete, but it is not observed
  until paired oracle and routed tasks run.
- The generator confirms file lengths and evidence links: Active Context Size can be
  `structurally-verified`, not `observed`.
