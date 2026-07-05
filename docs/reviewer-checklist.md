# Reviewer Checklist

This checklist supports the Reviewer role in AstroBlog orchestration.

Use it to review diffs after implementation.

Reviewer should remain read-only unless explicitly asked to edit.

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

Confirm:

- The change addresses the original request.
- The implementation does not expand scope unnecessarily.
- The smallest safe change was preferred.
- No unrelated files were changed without a clear reason.

Request changes if:

- The implementation solves a different problem.
- The diff includes unrelated refactors.
- The task was broadened without approval.

## 2. Build, Type, and Lint

Check whether appropriate validation was run.

Common checks:

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm lighthouse:all
```

Use `pnpm` only.

Request changes if:

- Relevant checks failed and were ignored.
- The agent claims completion despite failing validation.
- The implementation affects build behavior but no build/typecheck was run or explained.

## 3. Accessibility

Check for:

- Semantic HTML
- Clear heading hierarchy
- Keyboard navigation
- Focus-visible states
- Reduced-motion behavior
- Color contrast
- Meaningful alt text
- Correct labels for forms and controls
- Minimum touch targets
- No inaccessible custom interactions

Request changes if:

- Interactive elements are not keyboard accessible.
- Links/buttons are semantically wrong.
- Focus states are removed.
- Images lack needed alt text.
- Motion ignores reduced-motion preferences.

## 4. SEO and Metadata

Check for preservation of:

- Canonical URLs
- Page titles
- Meta descriptions
- Open Graph metadata
- Structured data when present
- RSS behavior
- Sitemap output
- Useful internal links
- Valid content frontmatter

Request changes if:

- Metadata is broken or missing.
- Route/slug changes were made without approval.
- SEO-critical behavior changed without validation.
- Content schema changes were not reflected in docs/content.

## 5. Performance

Check for:

- No unnecessary client-side JavaScript
- No unnecessary hydration
- No avoidable third-party scripts
- No oversized dependencies
- Font loading remains local and efficient
- Images remain optimized
- Layout shifts are not introduced
- Core Web Vitals are preserved

Request changes if:

- Avoidable JavaScript is added.
- A new dependency is added without approval.
- A layout or font change risks performance without validation.
- Lighthouse-sensitive behavior changes without running or explaining checks.

## 6. Styling and Design Tokens

Check for:

- Existing design tokens used before new tokens
- Typography conventions preserved
- Layout spacing remains consistent
- Global styles used for global concerns
- Component styles used only for local concerns
- No new styling framework introduced

Request changes if:

- Styles duplicate existing tokens.
- The change creates an inconsistent pattern.
- Tailwind or another styling framework is introduced without explicit approval.
- User-facing design changes exceed the request.

## 7. JavaScript and Hydration

Check whether new JavaScript is justified.

Confirm:

- Static-first behavior is preserved.
- Progressive enhancement is used when appropriate.
- Hydration is avoided unless needed.
- Keyboard and screen-reader behavior are preserved.
- Performance impact was considered.

Request changes if:

- JavaScript was added for something HTML/CSS/Astro can handle.
- Hydration is added without clear need.
- Accessibility is reduced.

## 8. Content and Voice

Check for:

- Placeholder content preserved unless removal was requested
- Eric's editorial voice not flattened into generic marketing copy
- Technical claims remain credible
- Content fields match `src/content.config.ts`
- Tags/categories still support site behavior

Request changes if:

- Placeholder content is deleted without approval.
- Voice-sensitive content is rewritten too generically.
- Frontmatter violates the schema.

## 9. Architecture

Check for:

- Existing patterns reused
- Components remain focused
- Pages remain reasonably thin
- Layouts own shared framing
- Utilities remain reusable and clear
- No unnecessary abstraction layers

Request changes if:

- The implementation invents architecture where a simple edit would work.
- Core files are moved/renamed without approval.
- The change creates coupling or ambiguity.

## 10. Documentation Drift

Check whether docs need updates.

Docs commonly affected:

```txt
docs/architecture.md
docs/testing.md
docs/performance-seo-accessibility.md
docs/editorial-guidelines.md
docs/content-status.md
docs/agent-workflow.md
docs/change-policy.md
docs/reviewer-checklist.md
docs/deployment.md
```

Request changes if:

- Behavior changed but docs were not updated.
- Workflow or guardrails changed but `AGENTS.md` or docs were not updated.
- Scripts or validation commands changed without docs updates.

## Reviewer Verdict Guidance

Use `approve` when:

- The change fits the request.
- No required issues are found.
- Validation is adequate or lack of validation is clearly justified.

Use `approve with notes` when:

- The change is acceptable.
- Notes are optional, future-facing, or minor.

Use `request changes` when:

- There is a correctness issue.
- There is a guardrail violation.
- There is avoidable accessibility, SEO, or performance risk.
- Required validation failed or was skipped without explanation.
