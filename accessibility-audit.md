# Accessibility Audit

## Summary

The site has a strong accessibility foundation. Semantic HTML is used consistently, all pages have a single clear `<h1>`, heading hierarchy is logical, skip links are present, focus styles are visible, reduced-motion preferences are respected for most animations, interactive controls have accessible names, and touch targets meet minimum size requirements. The main areas for improvement are the 404 page heading structure, a few missing `aria-current` states on filter/tag links, some inconsistent new-tab indicators, and a card animation that plays even when reduced motion is preferred.

## High Priority Issues

### Issue: 404 page has no accessible heading

**Where:** `src/pages/404.astro`

**Problem:** The only `<h1>` on the 404 page has `aria-hidden="true"`, which hides it from screen readers. The visible "Page not found" text is a `<p>`, not a heading. Screen reader users navigating by headings will find no heading on this page.

**Fix:** Remove `aria-hidden="true"` from the `<h1>` so it serves as the page heading. The "404" text is visually decorative at large scale, but it is also meaningful content — it communicates the error code. If the visual treatment must remain, keep the `<h1>` visible to assistive technology and add a visually-hidden supplement if needed:

```html
<h1 class="not-found-code">
  404
  <span class="sr-only"> — Page not found</span>
</h1>
<p class="not-found-label" aria-hidden="true">Page not found</p>
```

Alternatively, keep the current visual layout but change the structure so the `<h1>` is the "Page not found" text and the large "404" is a decorative `<div>`:

```html
<div class="not-found-code" aria-hidden="true">404</div>
<h1 class="not-found-label">Page not found</h1>
```

**Verify:** Navigate to a 404 page with a screen reader and confirm a heading is announced.

---

## Medium Priority Issues

### Issue: Card enter animation ignores prefers-reduced-motion

**Where:** `src/styles/global.css` (lines ~470–483), `src/components/Card.astro`

**Problem:** The `.card-enter` class applies `animation: card-enter 0.4s ease-out both` unconditionally. The `card-enter` keyframe uses `transform: translateY(1rem)`, which is motion. The `@supports (animation-timeline: view())` block is correctly wrapped in `@media (prefers-reduced-motion: no-preference)`, but the base animation at line ~482 is not. Users who prefer reduced motion will still see cards slide up on page load.

**Fix:** Wrap the base `.card-enter` animation in a reduced-motion check:

```css
@media (prefers-reduced-motion: no-preference) {
  .card-enter {
    animation: card-enter 0.4s ease-out both;
  }
}
```

**Verify:** Enable "Reduce motion" in OS settings. Reload a page with cards and confirm no slide-up animation plays.

---

### Issue: Outline button hover transform ignores prefers-reduced-motion

**Where:** `src/pages/index.astro` (`.button--outline:hover`)

**Problem:** The `.button--outline:hover` rule applies `transform: translateY(-1px)` without a reduced-motion guard. The main `.button:hover` transform was moved behind `@media (prefers-reduced-motion: no-preference)` in `components.css`, but this page-specific variant was not updated to match.

**Fix:** Either remove the transform from `.button--outline:hover`, or wrap it in a `@media (prefers-reduced-motion: no-preference)` block:

```css
@media (prefers-reduced-motion: no-preference) {
  .button--outline:hover {
    transform: translateY(-1px);
  }
}
```

**Verify:** Enable "Reduce motion" in OS settings. Hover over an outline button and confirm no vertical shift occurs.

---

### Issue: Tag filter bar links lack active/current indication

**Where:** `src/components/TagFilterBar.astro`

**Problem:** When the tag filter bar renders on the blog index, the links navigate to `/tags/{tag}` pages. On those tag pages, there is no `aria-current` or visual indication of which tag is active. The tag pages themselves are noted as empty in the project docs, with filtering being client-side via the filter bar. This means the filter bar links navigate to pages that may not show filtered content, and there is no programmatic indication of the current selection.

**Fix:** This is a known architectural limitation documented in `AGENTS.md`. The current behavior is functional — the links navigate to tag index pages. If tag pages are populated in the future, add `aria-current="true"` to the active tag link. For now, no code change is needed, but this should be addressed when tag pages are implemented.

**Verify:** N/A until tag pages are implemented.

---

### Issue: Webmention avatar links rely on title attribute for accessible name

**Where:** `src/components/Webmentions.astro`

**Problem:** The `.wm-avatar` links contain an `<img alt="">` (empty alt, decorative) or a fallback `<span>`, and use the `title` attribute for the accessible name (e.g., `title="Liked by Jane Doe"`). The `title` attribute is not reliably announced by all screen readers and is not a robust accessible name mechanism.

**Fix:** Add a visually-hidden `<span>` inside the link to provide a reliable accessible name:

```html
<a href={authorUrl} target="_blank" rel="noopener noreferrer" class="wm-avatar">
  <span class="sr-only">{m.author?.name ? `Reposted by ${m.author.name}` : 'Repost'}</span>
  {safeHttpUrl(m.author?.photo)
    ? <img src={safeHttpUrl(m.author?.photo)} alt="" width="28" height="28" loading="lazy" />
    : <span class="wm-avatar-fallback" aria-hidden="true">R</span>}
</a>
```

**Verify:** Navigate webmention avatars with a screen reader and confirm each link announces a meaningful name.

---

### Issue: Portfolio repo links open in new tab without indication

**Where:** `src/pages/portfolio.astro`

**Problem:** Repository links in portfolio case studies use `target="_blank"` with `rel="noopener noreferrer"` but do not indicate to users that they open in a new tab. Social links in `SocialLinks.astro` correctly include "(opens in new tab)" in their `sr-only` text, but portfolio repo links do not follow this pattern.

**Fix:** Add a visually-hidden indicator to each external repo link:

```html
<a href="..." target="_blank" rel="noopener noreferrer" class="repo-link">
  wpmedia/arc-themes-blocks
  <span class="sr-only">(opens in new tab)</span>
</a>
```

**Verify:** Navigate portfolio page with a screen reader and confirm external links announce that they open in a new tab.

---

## Low Priority Improvements

### Issue: Contact form focus style overrides global focus-visible

**Where:** `src/pages/contact.astro`

**Problem:** Contact form inputs set `outline: none` on `:focus` and replace it with a `box-shadow`. While this provides a visual focus indicator, it overrides the global `:focus-visible` style and uses `:focus` instead of `:focus-visible`, which means the focus ring appears on mouse click as well as keyboard focus.

**Fix:** Change `:focus` to `:focus-visible` on contact form inputs to match the global pattern:

```css
.contact-form input:focus-visible,
.contact-form textarea:focus-visible {
  outline: none;
  border-color: var(--color-action);
  box-shadow: 0 0 0 1px var(--color-action);
}
```

**Verify:** Click into a contact form input with a mouse — no focus ring should appear. Tab into it with a keyboard — the focus ring should appear.

---

### Issue: Table of contents heading level may confuse heading navigation

**Where:** `src/layouts/BlogPost.astro`

**Problem:** The table of contents sidebar uses `<h3>On this page</h3>` inside an `<aside>`. When a screen reader user navigates by headings, this h3 appears between the article's h2 and h3 headings, which could be confusing. The TOC is in a separate `<aside>` element, which provides some structural separation, but heading-level navigation may still interleave TOC and article headings.

**Fix:** This is a minor concern. The `<aside>` provides semantic separation. If this becomes a real usability issue, the TOC heading could be changed to a visually-styled `<div>` with `role="heading" aria-level="2"` or simply styled as bold text without heading semantics. No change recommended at this time.

**Verify:** N/A

---

### Issue: Footer social links not wrapped in nav landmark

**Where:** `src/components/Footer.astro`

**Problem:** The footer renders `<SocialLinks />` inside a `<div class="social-links">` without a `<nav>` wrapper. While this is not a barrier — the links are in the footer context and are discoverable — wrapping them in a `<nav aria-label="Social links">` would make them easier to find for screen reader users who navigate by landmarks.

**Fix:** Wrap the footer social links in a nav element:

```html
<footer class="site-frame" data-pagefind-ignore>
  &copy; {today.getFullYear()} Eric Carlisle. All rights reserved.
  <nav class="social-links" aria-label="Social links">
    <SocialLinks />
  </nav>
</footer>
```

**Verify:** Navigate by landmarks with a screen reader and confirm a "Social links" navigation region is announced in the footer.

---

## Verified Strengths

- **Skip link** — Present on all pages (`<a href="#main-content" class="skip-link">Skip to main content</a>`), correctly positioned off-screen and revealed on focus.
- **Semantic HTML** — `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, `<aside>`, `<section>` used correctly throughout.
- **One clear h1 per page** — Every page has exactly one `<h1>`.
- **Logical heading hierarchy** — Headings follow a logical order without skipping levels.
- **Navigation landmarks** — Main navigation uses `<nav aria-label="Main navigation">`.
- **aria-current on active nav links** — `HeaderLink.astro` uses `aria-current="page"` for the active link.
- **Mobile menu accessibility** — Menu toggle has `aria-expanded` and `aria-controls`. Escape key closes menu and returns focus to toggle button.
- **Focus-visible styles** — Global `:focus-visible` rule provides visible focus indicators using design tokens.
- **Reduced-motion handling** — Header hide/show animation, menu toggle chevron rotation, card hover transforms, and button hover transforms all respect `prefers-reduced-motion`.
- **Social links accessible names** — Each social link has a visually-hidden `<span>` with descriptive text including "(opens in new tab)".
- **Theme toggle accessible name** — Uses `aria-label="Toggle light/dark theme"`.
- **Search link accessible name** — Uses `aria-label="Search site"`.
- **Share links accessible names** — Each share link has `aria-label` (e.g., "Share on X / Twitter").
- **Image alt text** — Hero images use `coverAlt || title`. Avatar image has `alt="Eric Carlisle"`. Webmention images use `alt=""` (decorative).
- **Decorative SVGs** — All decorative SVGs use `aria-hidden="true"`.
- **Contact form labels** — Uses implicit label wrapping (label element wraps input), which is valid and accessible.
- **Form error handling** — Error message uses `role="alert"` for live announcement.
- **Form success handling** — Success message uses `role="status"` and `tabindex="-1"` with programmatic focus.
- **Honeypot field** — Uses `aria-hidden="true"` and `tabindex="-1"` to hide from assistive technology and keyboard navigation.
- **Reading progress bar** — Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.
- **Table of contents** — Uses `<nav aria-label="Table of contents">`.
- **Touch targets** — Interactive controls use `--size-touch-target-min` (44px) for minimum touch target size.
- **No positive tabindex** — No positive `tabindex` values found in the codebase.
- **target="_blank" security** — External links use `rel="noopener noreferrer"`.
- **Language attribute** — `<html lang="en">` is set on all pages.
- **Viewport meta** — `<meta name="viewport" content="width=device-width,initial-scale=1">` is present.

## Recommended Fix Order

1. **Fix 404 page heading** — High priority, small change, removes a barrier for screen reader users.
2. **Wrap card-enter animation in prefers-reduced-motion** — Medium priority, respects user motion preferences.
3. **Wrap button--outline hover transform in prefers-reduced-motion** — Medium priority, consistency with other motion handling.
4. **Add visually-hidden text to webmention avatar links** — Medium priority, improves screen reader experience.
5. **Add "(opens in new tab)" to portfolio repo links** — Medium priority, consistency with social links pattern.
6. **Change contact form :focus to :focus-visible** — Low priority, consistency with global focus pattern.
7. **Wrap footer social links in nav landmark** — Low priority, improves landmark navigation.
