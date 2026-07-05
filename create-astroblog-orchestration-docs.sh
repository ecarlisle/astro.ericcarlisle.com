#!/usr/bin/env bash
set -euo pipefail

DOCS_DIR="docs"

mkdir -p "$DOCS_DIR"

create_file_if_missing() {
  local file_path="$1"

  if [[ -f "$file_path" ]]; then
    echo "Skipped existing file: $file_path"
    return
  fi

  mkdir -p "$(dirname "$file_path")"
  cat > "$file_path"
  echo "Created: $file_path"
}

create_file_if_missing "$DOCS_DIR/agent-workflow.md" <<'EOF'
# Agent Workflow

This document describes the recommended orchestration workflow for AstroBlog agent-assisted work.

Use this file alongside:

```txt
AGENTS.md
docs/change-policy.md
docs/reviewer-checklist.md
```

`AGENTS.md` is the top-level entry point. This document contains the deeper workflow details.

## Default Workflow

For non-trivial feature, styling, architecture, accessibility, SEO, or content-system changes, use:

```txt
Scout → Architect → Builder → Reviewer
```

This creates a deliberate handoff between investigation, planning, implementation, and review.

## Shortened Workflows

For tiny, obvious changes:

```txt
Scout → Builder → Reviewer
```

For docs-only changes:

```txt
Scout → Builder
```

For risky or user-facing changes:

```txt
Scout → Architect → Builder → Reviewer → Builder fixes → Reviewer final
```

Use the full workflow when the task affects:

- Layout
- Accessibility
- SEO
- Routing
- Content schema
- Build behavior
- Search
- Metadata
- Scripts
- Contact form behavior
- User-facing styling
- Global CSS tokens

## Role Responsibilities

### Scout

Scout investigates without editing.

Scout should identify:

- Relevant files
- Current behavior
- Existing patterns
- Risks and unknowns
- Suggested validation commands
- The smallest likely implementation path

Scout should not:

- Edit files
- Run destructive commands
- Invent broad refactors
- Delete placeholder content
- Treat placeholder posts as final editorial content

Scout output:

```txt
Relevant files:
- ...

Current behavior:
- ...

Existing patterns:
- ...

Suggested path:
- ...

Risks / unknowns:
- ...

Suggested checks:
- ...
```

### Architect

Architect plans without editing.

Architect should produce:

- A concise implementation plan
- Acceptance criteria
- Risk notes
- Validation steps
- Documentation update notes when relevant

Architect should preserve:

- Static-first delivery
- Minimal JavaScript
- Semantic HTML
- Accessibility
- SEO
- Core Web Vitals
- Typography and global CSS token consistency
- Existing project conventions

Architect should not:

- Edit files
- Add dependencies
- Expand scope
- Replace existing architecture without a concrete reason

Architect output:

```txt
Plan:
1. ...

Acceptance criteria:
- ...

Risks:
- ...

Validation:
- ...

Docs to update:
- ...
```

### Builder

Builder implements the approved plan.

Builder should:

- Follow the plan
- Make the smallest safe change
- Prefer existing patterns
- Use `pnpm` only
- Run relevant validation
- Report failures honestly
- Update docs when behavior, conventions, scripts, architecture, content rules, or workflow changes

Builder should not:

- Add dependencies without approval
- Introduce client-side JavaScript unless clearly required
- Rewrite unrelated files
- Edit generated directories
- Delete placeholder content unless explicitly asked
- Mask failing checks

Builder output:

```txt
Changed files:
- ...

Summary:
- ...

Validation:
- ...

Notes / follow-up:
- ...
```

### Reviewer

Reviewer inspects the diff without editing.

Reviewer should check:

- Whether the change satisfies the original request
- Scope creep
- Accessibility
- SEO
- Performance
- Semantic HTML
- Maintainability
- Styling and design-token consistency
- JavaScript and hydration impact
- Documentation drift
- Validation adequacy

Reviewer should not:

- Edit files unless explicitly asked
- Request broad rewrites without a concrete issue
- Nitpick harmless choices that follow project conventions
- Approve avoidable dependency additions, unnecessary JavaScript, broken metadata, inaccessible markup, or unvalidated build behavior

Reviewer output:

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

## Handling Reviewer Feedback

If Reviewer returns `request changes`:

1. Builder should address only the required fixes.
2. Builder should avoid opportunistic refactoring.
3. Builder should rerun the smallest relevant validation.
4. Reviewer should perform a final review.

If Reviewer returns `approve with notes`:

- The task may be considered complete unless the user wants optional improvements.
- Optional improvements should not be implemented automatically unless they are low-risk and clearly within scope.

If Reviewer returns `approve`:

- Final response should summarize files changed, checks run, and any remaining risks.

## When to Ask the User

Ask the user before:

- Adding dependencies
- Changing routes or URLs
- Changing content schema
- Changing deployment behavior
- Adding client-side JavaScript
- Deleting placeholder content
- Rewriting voice-sensitive editorial content
- Making large visual redesigns
- Changing contact form or worker behavior
- Performing broad refactors

If the user already gave explicit approval, proceed within that scope.

## Completion Format

For non-trivial work, final responses should include:

```txt
Changed files:
- ...

What changed:
- ...

Checks run:
- ...

Reviewer verdict:
- ...

Remaining risks:
- ...
```

If no checks were run, say why.

If checks failed, include the failure and do not call the task complete.
EOF

create_file_if_missing "$DOCS_DIR/change-policy.md" <<'EOF'
# Change Policy

This document defines approval boundaries for AstroBlog changes.

Use this alongside:

```txt
AGENTS.md
docs/agent-workflow.md
docs/reviewer-checklist.md
```

The goal is to keep agent-assisted work safe, focused, and easy to review.

## Default Rule

Prefer the smallest safe change.

Before changing architecture, behavior, dependencies, content schema, routing, deployment, or user-facing design systems, check whether the change requires explicit approval.

## Changes That Require Explicit Approval

### Dependencies

Do not add, remove, or upgrade dependencies without explicit approval.

Before recommending a dependency, explain:

- Why the project needs it
- Why Astro, HTML, CSS, platform APIs, or existing dependencies are insufficient
- Expected impact on performance
- Expected impact on bundle size
- Expected maintenance/security implications

### Client-Side JavaScript

Do not introduce client-side JavaScript unless clearly required and approved when the impact is non-trivial.

Before adding client-side JavaScript, consider:

- HTML
- CSS
- Astro build-time behavior
- Static generation
- Progressive enhancement

If JavaScript is needed:

- Keep it small
- Avoid unnecessary hydration
- Preserve keyboard behavior
- Preserve screen-reader behavior
- Validate performance impact

### Content Schema

Do not change `src/content.config.ts` casually.

Schema changes may affect:

- Existing blog posts
- MDX content
- Listing pages
- RSS
- Sitemap
- Metadata
- Search
- Article templates
- Build/typecheck behavior

Before changing the schema:

- Identify affected fields
- Update related content
- Update docs
- Run relevant checks

### Routes and URLs

Do not change routes, slugs, or URL structure without explicit approval.

Route changes may affect:

- SEO
- Backlinks
- Sitemap output
- RSS links
- Internal links
- Search index behavior
- Portfolio links
- Shared URLs

If a route must change, consider redirects or compatibility behavior.

### Metadata and SEO Structure

Do not change metadata architecture casually.

Be careful with:

- Canonical URLs
- Page titles
- Meta descriptions
- Open Graph metadata
- Structured data
- RSS metadata
- Sitemap behavior
- Internal links

### Deployment and Build Behavior

Do not change deployment, build, adapter, or hosting behavior without explicit approval.

This includes:

- `astro.config.mjs`
- Build scripts
- Preview scripts
- Sitemap/RSS integration behavior
- Cloudflare-related behavior
- Partytown behavior
- Search indexing behavior

### Contact Worker

Do not change contact form worker behavior without explicit approval.

The worker may involve:

- Validation
- Spam protection
- Request/response shape
- Secrets
- Rate limiting
- Email delivery or notification behavior

Treat this as a separate runtime surface.

### Placeholder Content

Do not delete placeholder content unless explicitly asked.

Placeholder posts may validate:

- Layout
- Tags
- Pagination
- Search
- Metadata
- Styling
- RSS
- Sitemap behavior

If removing placeholder content, confirm which validation coverage remains.

### Broad Refactors

Do not perform broad refactors unless explicitly requested.

Examples requiring approval:

- Moving many components
- Renaming core files
- Replacing styling patterns
- Reworking layout architecture
- Rewriting content collection structure
- Introducing new abstraction layers

## Changes Usually Safe Without Additional Approval

These are generally safe when they stay within the user request and project conventions:

- Small accessibility improvements
- Minor semantic HTML improvements
- Small CSS token usage corrections
- Fixing obvious typos
- Updating docs to match existing behavior
- Small bug fixes with validation
- Narrow component cleanup
- Removing unused code only when clearly unused and validated

## Review Expectations

Reviewer should request changes when a diff:

- Adds unnecessary dependencies
- Adds avoidable client-side JavaScript
- Breaks accessibility
- Breaks metadata
- Changes routes unexpectedly
- Edits generated files
- Deletes placeholder content without approval
- Introduces broad refactors
- Fails checks without explanation
- Leaves documentation stale after changing conventions or behavior

Reviewer may approve with notes when:

- The change is correct
- Validation is adequate
- Remaining concerns are small, optional, or future-facing

## Documentation Expectations

When changing architecture, content conventions, scripts, deployment behavior, styling conventions, accessibility patterns, SEO behavior, or agent workflow, update the relevant document in `docs/`.

Prefer updating existing docs before creating new docs.
EOF

create_file_if_missing "$DOCS_DIR/reviewer-checklist.md" <<'EOF'
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
docs/performance.md
docs/accessibility.md
docs/editorial-guidelines.md
docs/agent-workflow.md
docs/change-policy.md
docs/reviewer-checklist.md
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
EOF

echo
echo "Done. Review created files in $DOCS_DIR/."
echo "Recommended next step: update AGENTS.md to reference docs/agent-workflow.md, docs/change-policy.md, and docs/reviewer-checklist.md."
