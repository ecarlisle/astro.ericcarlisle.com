import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility regression checks using axe-core.
 *
 * These are smoke tests, not full audits. They catch serious automated
 * violations (missing labels, contrast failures, ARIA misuse) without
 * acting as a comprehensive accessibility review.
 */

// Rules disabled globally:
// - color-contrast: the site uses OKLCH tokens that axe's sRGB-based
//   contrast checker flags incorrectly in some cases. The project validates
//   contrast separately via Lighthouse and manual WCAG 2 AA checks.
const globalDisabledRules = ['color-contrast'];

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'blog', path: '/blog/' },
  { name: 'portfolio', path: '/portfolio/' },
  { name: 'contact', path: '/contact/' },
  { name: '404', path: '/404.html' },
] as const;

for (const { name, path } of pages) {
  test(`${name} (${path}) has no critical axe violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page }).disableRules(globalDisabledRules).analyze();

    expect(results.violations).toEqual([]);
  });
}

test('search (/search/) has no critical axe violations', async ({ page }) => {
  await page.goto('/search/');

  // Additional disabled rules for search:
  // - label-title-only: Pagefind UI renders its search input with only a
  //   title attribute for labeling. This is a third-party widget we do not
  //   control. The input is still keyboard-accessible and has a visible
  //   placeholder.
  const results = await new AxeBuilder({ page })
    .disableRules([...globalDisabledRules, 'label-title-only'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('blog post has no critical axe violations', async ({ page }) => {
  await page.goto('/blog/250mm-trading-card-box/');

  // Additional disabled rules for blog posts:
  // - region: the reading-progress bar sits outside <main> as a fixed
  //   positional element. It uses role="progressbar" with an accessible
  //   label. Wrapping it in a landmark would be a layout change beyond
  //   the scope of these regression tests.
  const results = await new AxeBuilder({ page })
    .disableRules([...globalDisabledRules, 'region'])
    .analyze();

  expect(results.violations).toEqual([]);
});
