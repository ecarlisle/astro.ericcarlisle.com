---
name: Performance Budget
slug: performance-budget
description: Use this skill when adding dependencies, scripts, images, embeds, search, analytics, or interactive UI.
category: engineering
applies_to:
  - Astro
  - frontend
  - performance
  - Core Web Vitals
  - Lighthouse
triggers:
  - dependency
  - script
  - image
  - embed
  - analytics
  - interactive UI
  - font
priority: high
version: 1
---
# Performance Budget Skill

Use this skill when adding or changing dependencies, scripts, images, fonts, embeds, search, analytics, animation, data fetching, or interactive UI.

## Purpose

Protect page speed, responsiveness, accessibility, and maintainability by keeping the site mobile-first, static-first, and lightweight by default.

This skill applies Core Web Vitals awareness, minimal JavaScript, careful resource loading, and Lighthouse-friendly output without blocking useful features.

## Goal

Preserve a fast, lightweight site by default. Add client-side code, third-party resources, runtime behavior, and heavier assets only when they clearly improve the user experience and cannot be solved with simpler native, static, or project-local approaches.

## Core Priorities

* Mobile-first performance.
* Minimal JavaScript.
* Static rendering by default.
* Native HTML and CSS before client-side JavaScript.
* Feature-specific scripts only where needed.
* No global bundles for page-specific behavior.
* Lightweight images, fonts, and CSS.
* Avoid heavyweight third-party embeds.
* Preserve Core Web Vitals and Lighthouse-friendly output.
* Prefer progressive enhancement over JavaScript-required behavior.
* Do not sacrifice accessibility for performance.

## Rules

* Do not add a dependency without explaining why existing tools, native browser features, or simple project code are insufficient.
* Do not load search, comments, analytics, embeds, animation libraries, or page-specific features globally unless required.
* Defer, lazy-load, or isolate optional scripts.
* Avoid client hydration unless interactivity is actually needed.
* Prefer static Astro components over client-rendered components when possible.
* Prefer optimized image formats already used by the project.
* Always define image width and height when possible to reduce layout shift.
* Lazy-load below-the-fold images and embeds.
* Do not lazy-load likely LCP images, such as primary hero images.
* Keep CSS token-based and avoid large utility sprawl.
* Avoid broad CSS or JavaScript changes for narrow UI fixes.
* Respect `prefers-reduced-motion` for animation.
* Avoid animation that harms responsiveness, readability, or battery life.
* Avoid render-blocking third-party scripts unless intentionally required.
* Avoid adding tracking or analytics scripts without clear need and consent/privacy consideration.
* Do not hide meaningful content behind client-side rendering when it can be statically rendered.

## Mobile-First Checks

When reviewing performance, assume mobile devices and slower networks are the baseline.

Check that:

* The page remains useful with limited bandwidth.
* Important content appears without waiting for optional scripts.
* Navigation and reading work before enhancements load.
* Images are appropriately sized for mobile viewports.
* Large desktop assets are not forced onto mobile users.
* Touch interactions remain responsive.
* Animations and transitions do not create jank.
* Layout does not shift during load.
* Font loading does not cause excessive delay or visual instability.
* Critical UI does not depend on large JavaScript bundles.

## JavaScript Checks

Check that:

* Client JavaScript is only shipped for real interactivity.
* Page-specific scripts are not included globally.
* Astro hydration directives are used intentionally.
* Components are not hydrated by default when static output would work.
* Event listeners are scoped to the relevant component or page.
* Optional features do not block initial render.
* Large libraries are avoided for small interactions.
* Search, comments, analytics, and embeds are isolated from pages that do not use them.
* Inline scripts are small, purposeful, and documented when their timing matters.

## Image and Media Checks

Check that:

* Images use optimized formats supported by the project.
* Images include width and height where possible.
* Images use responsive sizing where appropriate.
* Above-the-fold images are prioritized carefully.
* Below-the-fold images are lazy-loaded.
* Decorative media does not add unnecessary weight.
* Video, animation, and embeds do not autoplay heavy resources.
* Social preview images are not accidentally loaded into the page unless needed.
* Generated or transformed images do not create unexpectedly large build output.

## Font and CSS Checks

Check that:

* Font choices are intentional and limited.
* Font files are not duplicated.
* Font loading strategy avoids unnecessary blocking.
* CSS uses existing tokens and project conventions.
* New styles do not create large one-off systems.
* Unused CSS or utility sprawl is avoided.
* Layouts use simple CSS before JavaScript measurement or resize logic.
* Theme styles do not duplicate large blocks unnecessarily.
* CSS changes do not introduce avoidable layout shift.

## Third-Party Resource Checks

Check that:

* Third-party scripts are necessary.
* Third-party resources are not loaded globally unless required site-wide.
* Embeds are lazy-loaded or replaced with lightweight previews when appropriate.
* Analytics are minimal and privacy-conscious.
* External resources do not block rendering.
* Failure of a third-party resource does not break core page content.
* Third-party additions are scoped, documented, and easy to remove.

## Fix Guidance

When fixing performance issues:

1. Identify the added or changed resource.
2. Explain the performance risk briefly.
3. Apply the smallest targeted fix.
4. Prefer removing, deferring, lazy-loading, or scoping before adding complexity.
5. Preserve accessibility and content quality.
6. Verify production output, not only the development server.
7. Avoid turning a narrow performance fix into a broad refactor.

## Verification

Run the lightest checks that prove the change.

Prefer:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

For performance-sensitive changes, run or recommend:

```bash
pnpm lighthouse:all
```

After performance-sensitive changes, verify:

* The production build succeeds.
* Generated output does not include unexpected client assets.
* Static pages remain static where possible.
* JavaScript bundles are not added to pages that do not need them.
* Images are optimized and correctly sized.
* Important content renders before optional enhancements.
* Layout shift was not introduced.
* Mobile behavior remains responsive.
* Accessibility behavior was preserved.

For major UI, dependency, media, embed, search, analytics, or animation changes, check mobile performance specifically, not only desktop.

## Stop Conditions

Stop and report instead of guessing when:

* A change requires a new dependency without a clear need.
* A feature appears to require global JavaScript.
* A performance fix would reduce accessibility or content quality.
* A change would move static content behind client-side rendering.
* A third-party resource would block rendering or become required for core content.
* Generated output, asset size, or bundle behavior is unclear.
* Lighthouse or build output shows a serious regression.

## Output Format

When reporting performance findings, use this format:

### Issue: [short name]

**Where:** [page, component, dependency, asset, script, font, embed, or route]

**Problem:** [brief explanation of the performance, loading, JavaScript, media, CSS, font, dependency, or third-party resource issue]

**Fix:** [specific recommendation or code change]

**Verify:** [build output, bundle check, Lighthouse, mobile test, rendered page check, generated HTML check, or asset inspection]

## Reporting

After changes, report:

* Files changed.
* Resources, scripts, assets, fonts, embeds, or dependencies affected.
* Whether client-side JavaScript was added.
* Whether dependencies changed.
* Whether generated output changed.
* Mobile performance notes.
* Lighthouse notes if run.
* Validation commands run.
* Any skipped checks.
* Any remaining risks or follow-up recommendations.
