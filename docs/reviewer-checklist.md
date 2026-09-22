# Reviewer Checklist

**Use when:** Reviewing a diff, pull request, or documentation change.

Review in one pass. Each section links to the doc that owns its rules instead of restating them.

## Required Output Format

```txt
Verdict: approve | approve with notes | request changes

Findings:
1. ...

Required fixes:
- ...

Optional improvements:
- ...

Checks observed:
- ...
```

## 1. Request Fit

Request changes if the diff solves a different problem, includes unrelated refactors or files, broadens scope without approval, or ignores a smaller safe change.

## 2. Validation

The checks required by [Testing](testing.md#when-to-run-each-check) were run, or their omission is explained. Request changes if checks failed and were ignored, or if completion is claimed despite failures.

## 3. Accessibility

Rules: [Accessibility Rules](performance-seo-accessibility.md#accessibility-rules). Request changes if interactive elements are not keyboard accessible, links and buttons are semantically wrong, focus states are removed, images lack needed alt text, or motion ignores reduced-motion preferences.

## 4. SEO and Metadata

Rules: [SEO Rules](performance-seo-accessibility.md#seo-rules) and the [indexing policy](performance-seo-accessibility.md#indexing-and-sitemap-policy). Request changes if metadata breaks, routes or slugs change without approval or a redirect, or SEO-critical behavior changes without `pnpm validate:seo`.

## 5. Performance and JavaScript

Rules: [Performance Rules](performance-seo-accessibility.md#performance-rules) and [Change Policy](change-policy.md#changes-that-need-care). Request changes if:

- JavaScript or hydration was added for something HTML, CSS, or Astro can handle;
- a dependency or third-party script was added without approval; or
- font, image, or layout changes risk Core Web Vitals without Lighthouse evidence.

## 6. Styling and Design Tokens

Rules: [KISS Design System](design-system/README.md). Request changes if styles duplicate existing tokens, create an inconsistent pattern, introduce Tailwind or another framework without approval, or exceed the requested design change.

## 7. Content and Voice

Rules: [Content Status](content-status.md), [Content Model](content-model.md), and [Editorial Guidelines](editorial-guidelines.md). Request changes if placeholder content is deleted without approval, voice-sensitive prose is flattened into generic copy, or frontmatter violates the schema.

## 8. Architecture

Request changes if the change invents architecture where a simple edit works, moves or renames core files without approval, or adds coupling or unnecessary abstraction. Pages should stay thin, layouts should own shared framing, and existing patterns should be reused.

## 9. Documentation Drift

Every fact has one owning doc; [Architecture](architecture.md#documentation-and-sources-of-truth) maps topics to docs. Request changes if behavior, scripts, validation, workflow, or guardrails changed without updating the owning doc, or if the diff restates a fact that another doc already owns.

## Reviewer Verdict Guidance

| Verdict | Use when |
|---|---|
| `approve` | The change fits the request, no required issues exist, and validation is adequate or its absence is justified |
| `approve with notes` | The change is acceptable; notes are optional, minor, or future-facing |
| `request changes` | There is a correctness issue, a guardrail violation, avoidable accessibility, SEO, or performance risk, or validation that failed or was skipped without explanation |
