import { expect, test } from '@playwright/test';
import { SAMPLE_BLOG_SLUG } from './fixtures';

/**
 * Route smoke tests.
 *
 * Verify that important pages load, have exactly one accessible h1,
 * and contain expected visible content. These are tripwires, not
 * exhaustive content checks.
 */

const routes = [
  { path: '/', expectedHeading: 'Hi,' },
  { path: '/about/', expectedHeading: 'About Me' },
  { path: '/blog/', expectedHeading: 'Blog' },
  { path: '/portfolio/', expectedHeading: 'Portfolio' },
  { path: '/contact/', expectedHeading: 'Contact' },
  { path: '/search/', expectedHeading: 'Search' },
] as const;

for (const { path, expectedHeading } of routes) {
  test(`${path} loads with a single accessible h1`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/.+/);

    const h1s = page.locator(
      'body > h1:not([aria-hidden="true"]), main h1:not([aria-hidden="true"]), article h1:not([aria-hidden="true"])',
    );
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(expectedHeading);
  });
}

test('/404 loads with an accessible h1', async ({ page }) => {
  // Navigate directly to the 404 page. Astro preview serves dist/404.html
  // at /404.html for unknown routes, but direct navigation is more reliable.
  const response = await page.goto('/404.html');
  expect(response).not.toBeNull();

  const h1s = page.locator(
    'body > h1:not([aria-hidden="true"]), main h1:not([aria-hidden="true"]), article h1:not([aria-hidden="true"])',
  );
  await expect(h1s).toHaveCount(1);
  await expect(h1s.first()).toBeVisible();
});

test('a representative blog post loads with a single accessible h1', async ({ page }) => {
  await page.goto(`/blog/${SAMPLE_BLOG_SLUG}/`);
  await expect(page).toHaveTitle(/.+/);

  const h1s = page.locator(
    'body > h1:not([aria-hidden="true"]), main h1:not([aria-hidden="true"]), article h1:not([aria-hidden="true"])',
  );
  await expect(h1s).toHaveCount(1);
  await expect(h1s.first()).toContainText('250mm Trading Card Box');
});

test('the portfolio page renders case study content', async ({ page }) => {
  await page.goto('/portfolio/');

  // Smoke test: at least one case study renders. Exact count is intentionally
  // not asserted — content additions should not break this tripwire.
  const caseStudies = page.locator('.case-study');
  await expect(caseStudies.first()).toBeVisible();
});

test('the contact form has accessible structure', async ({ page }) => {
  await page.goto('/contact/');

  const form = page.locator('#contact-form');
  await expect(form).toBeVisible();

  // Verify label association using getByLabel — this confirms each field
  // has an accessible name derived from its wrapping <label> element.
  const nameInput = page.getByLabel(/name/i);
  await expect(nameInput).toHaveAttribute('required', '');
  await expect(nameInput).toBeVisible();

  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).toHaveAttribute('required', '');
  await expect(emailInput).toBeVisible();

  const messageInput = page.getByLabel(/message/i);
  await expect(messageInput).toHaveAttribute('required', '');
  await expect(messageInput).toBeVisible();

  // Submit button is present.
  const submit = page.locator('#contact-form button[type="submit"]');
  await expect(submit).toBeVisible();
  await expect(submit).toContainText('Send Message');

  // Honeypot field is not keyboard-reachable.
  const honeypot = page.locator('#botField');
  await expect(honeypot).toHaveAttribute('tabindex', '-1');
  await expect(honeypot).toHaveAttribute('autocomplete', 'off');

  // Error container uses role="alert" for live region semantics.
  const errorEl = page.locator('#contact-error');
  await expect(errorEl).toHaveAttribute('role', 'alert');
});
