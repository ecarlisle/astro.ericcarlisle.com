---
name: context-health-refresh
description: Refreshes and validates the EricCarlisle.com Context Health report using the repository rubric, structured source evidence, stable GitHub links, and reproducible validation. Use when auditing context health, updating context scores, revising context findings, or regenerating the Context Health status page.
---

# Context Health Refresh

Use [the Context Health rubric](../../../docs/context-health-rubric.md) as the methodology authority. This skill defines the refresh procedure; it does not replace the rubric’s scoring rules, evidence requirements, result anchors, calibration examples, or versioning policy. Follow [AGENTS.md](../../../AGENTS.md) for repository workflow and permissions. Use [copy-edit](../copy-edit/SKILL.md) when drafting or substantially revising explanatory prose.

## Establish the audit

1. Read the rubric completely.
2. Declare whether the audit is task-specific or repository-wide.
3. Record the task, expected outcome, requirements, included context sources, explicit exclusions, and audit profile.
4. Perform the rubric’s preliminary context inventory. Load only applicable routes by default and record why additional context materially expands the scope.
5. Derive checks and weights from the declared task and inventory. Lock them before classifying evidence or assigning results.
6. Record the audited repository revision from Git. Never invent a commit SHA. Use the rubric’s documented fallback only when a valid audited revision is unavailable.

If scope, authority, evidence, or comparison compatibility cannot be established, stop or mark the audit provisional as the rubric requires.

## Collect surgical evidence

1. Assess the smallest practical file, section, heading, rule, or claim.
2. Evaluate every portion actually loaded into context. A useful section does not excuse unrelated material elsewhere in the same loaded document.
3. Identify positive contributors and Partial or Fail contributors without manufacturing evidence to produce a preferred score.
4. Separate observation from interpretation and recommendation.
5. Preserve uncertainty, confidence, exclusions, and provisional findings required by the rubric.

Do not omit required context to improve Precision. Do not include unrelated context to make the audit appear comprehensive.

## Record structured source references

Use the existing report schema and centralized URL builder. Store repository evidence as structured metadata:

- `path` for every repository-backed citation;
- optional `startLine` and `endLine` for an exact passage;
- optional `section` containing an exact, stable Markdown heading when a rendered section link is sufficient;
- `repositoryRevision` once at the report root.

Do not duplicate complete GitHub URLs in findings. The page derives them centrally:

- Whole file: `blob/{auditedRevision}/{path}`
- Stable Markdown heading: `blob/{auditedRevision}/{path}#{heading-anchor}`
- Exact Markdown range: `blob/{auditedRevision}/{path}?plain=1#L{startLine}-L{endLine}`
- Single Markdown line: `blob/{auditedRevision}/{path}?plain=1#L{line}`

Use PR diff links only to discuss a PR change, never as permanent report evidence. Prefer the audited revision; allow `main` only through the documented fallback. Verify every source link opens the intended file, heading, or passage and supports its finding.

## Generate and inspect the report

1. Capture the current report scores and Active Context Size before regeneration.
2. Run `pnpm context:health`.
3. Run `pnpm context:health:validate`.
4. Run the generator again and confirm the second run produces no additional diff.
5. Review every report-data change. Explain each score change from its evidence; do not manually preserve a previous calculated score.
6. Confirm the title, overview, priorities, positive contributors, negative contributors, and methodology remain internally consistent.
7. When the rubric, checks, weights, or task profile changes materially, increment the relevant methodology version and do not compare with older reports unless they are regenerated under the same methodology.

Use `copy-edit` for meaningful explanatory prose changes. Copy editing must not alter evidence, certainty, result classifications, weights, or calculated scores.

## Validate the page

Run the current repository commands:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm exec playwright test tests/lab-context.spec.ts`

Run `pnpm test:e2e` when the scope affects shared site behavior or the repository workflow requires the full suite. Use the focused Context Health suite to verify accessibility, evidence paths and line ranges, static rendering, absence of Context Health client JavaScript, CSS and bundle isolation, Sentry production isolation, and narrow-viewport overflow.

Review `git diff --check`, `git diff --stat`, and `git diff`. Confirm generated files did not change unexpectedly. Inspect `git status --short`; preserve unrelated work and never discard changes merely to produce a clean status.

## Report completion

Report:

- audit scope and revision;
- files changed;
- scores and Active Context Size before and after;
- evidence changes and the cause of every score change;
- generator, validator, page, accessibility, and isolation results;
- commit hash and PR URL when applicable;
- final `git status --short`.

## Permissions

Do not assume permission to commit, push, open a pull request, resolve review threads, or merge. Perform those actions only when the user’s request and repository workflow authorize them. If a commit is authorized, confirm the working tree is clean afterward.
