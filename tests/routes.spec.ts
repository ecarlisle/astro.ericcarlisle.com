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
  { path: '/speaking/', expectedHeading: 'Selected Talks' },
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

test('the about page links to selected talks without loading video code', async ({ page }) => {
  const response = await page.goto('/about/');
  expect(response?.ok()).toBe(true);

  const speakingLinks = page.locator('a[href="/speaking/"]');
  await expect(speakingLinks).toHaveCount(1);
  await expect(speakingLinks).toHaveText('View selected talks');
  await expect(page.locator('youtube-facade')).toHaveCount(0);

  const html = await page.content();
  expect(html).not.toMatch(/youtube(?:-nocookie)?\.com|youtu\.be|ytimg\.com/);
  expect(html).not.toContain('YouTubeFacade');
  expect(html).not.toContain('youtube-facade');
  expect(html).not.toContain('youtube-player');

  await speakingLinks.click();
  await expect(page).toHaveURL('/speaking/');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected Talks' })).toBeVisible();
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

test('/about/ inline links have correct text spacing', async ({ page }) => {
  await page.goto('/about/');

  // The speaking link paragraph should have "web. View selected talks."
  const body = page.locator('main');
  const text = await body.textContent();

  expect(text).toContain('web. View selected talks.');
  expect(text).toContain('LinkedIn or GitHub');
});

// ─── Webmention discovery ──────────────────────────────────────────────

test('blog article has one webmention endpoint link', async ({ page }) => {
  await page.goto(`/blog/${SAMPLE_BLOG_SLUG}/`);
  const links = page.locator('link[rel="webmention"]');
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute(
    'href',
    'https://webmention.io/ericcarlisle.com/webmention',
  );
});

test('second blog article also has one webmention endpoint', async ({ page }) => {
  await page.goto('/blog/why-do-i-need-all-this-usb-and-sd-media-holder/');
  const links = page.locator('link[rel="webmention"]');
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute(
    'href',
    'https://webmention.io/ericcarlisle.com/webmention',
  );
});

test('blog article has one canonical URL with trailing slash', async ({ page }) => {
  await page.goto(`/blog/${SAMPLE_BLOG_SLUG}/`);
  const canonicals = page.locator('link[rel="canonical"]');
  await expect(canonicals).toHaveCount(1);

  const href = await canonicals.first().getAttribute('href');
  expect(href).toMatch(/^https:\/\/ericcarlisle\.com\/blog\/250mm-trading-card-box\/$/);
});

test('second blog article canonical uses trailing-slash convention', async ({ page }) => {
  await page.goto('/blog/why-do-i-need-all-this-usb-and-sd-media-holder/');
  const href = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(href).toMatch(/\/$/);
  expect(href).toContain('why-do-i-need-all-this-usb-and-sd-media-holder');
});

test('webmention endpoint survives HTML minification', async ({ page }) => {
  await page.goto(`/blog/${SAMPLE_BLOG_SLUG}/`);
  const html = await page.content();
  // Minification collapses whitespace; the endpoint must still be present.
  expect(html).toContain('webmention.io/ericcarlisle.com/webmention');
  // Exactly one occurrence (no duplicates from nested layouts).
  const matches = html.match(/webmention\.io\/ericcarlisle\.com\/webmention/g);
  expect(matches).toHaveLength(1);
});

test('webmention endpoint is present across pages using the shared layout', async ({ page }) => {
  // The BlogPost layout (via BaseHead) renders the endpoint on every page.
  // Verify consistency across page types.
  await page.goto('/');
  await expect(page.locator('link[rel="webmention"]')).toHaveCount(1);

  await page.goto('/about/');
  await expect(page.locator('link[rel="webmention"]')).toHaveCount(1);
});

// ─── Webmention test page ────────────────────────────────────────────

test('webmention test page exists at /lab/webmention-test/', async ({ page }) => {
  const response = await page.goto('/lab/webmention-test/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Webmention Integration Test/);
});

test('webmention test page has noindex', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('webmention test page has canonical source URL', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'https://ericcarlisle.com/lab/webmention-test/');
});

test('webmention test page has exactly one h-entry', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  await expect(page.locator('.h-entry')).toHaveCount(1);
});

test('webmention test page has u-in-reply-to linking to target', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  const reply = page.locator('.u-in-reply-to');
  await expect(reply).toHaveCount(1);
  await expect(reply).toHaveAttribute(
    'href',
    'https://ericcarlisle.com/blog/250mm-trading-card-box/',
  );
});

test('webmention test page has p-content with correct text spacing', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  await expect(page.locator('.p-content')).toHaveCount(1);
  // The space before the link must survive HTML minification
  await expect(page.locator('.p-content')).toContainText(
    'Temporary Webmention integration test replying to 250mm Trading Card Box, a 3D Print.',
  );
});

test('webmention test page has p-author with h-card', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  await expect(page.locator('.h-card.p-author')).toHaveCount(1);
  await expect(page.locator('.p-name')).toContainText('Eric Carlisle');
});

test('webmention test page has u-url permalink', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  const uurl = page.locator('.u-url');
  await expect(uurl).toHaveCount(1);
  await expect(uurl).toHaveAttribute('href', 'https://ericcarlisle.com/lab/webmention-test/');
});

test('webmention test page has no client-side JavaScript', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  await expect(page.locator('script[src]')).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain('import(');
});

test('webmention test page does not render a second webmention endpoint', async ({ page }) => {
  await page.goto('/lab/webmention-test/');
  // The page has its own <head>, not the layout's BaseHead,
  // so it does not inherit the site-wide webmention endpoint.
  await expect(page.locator('link[rel="webmention"]')).toHaveCount(0);
});

test('webmention test page is not in the sitemap', async ({ page }) => {
  await page.goto('/sitemap-index.xml');
  const body = await page.textContent('body');
  expect(body).not.toContain('webmention-test');
});
