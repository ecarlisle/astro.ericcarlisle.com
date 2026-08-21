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
  { path: '/privacy/', expectedHeading: 'Privacy Policy' },
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

test('blog features the newest article without a LOG byline label', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/blog/');

  const grid = page.locator('#post-grid');
  await expect(grid).toHaveClass(/grid--featured-first/);

  const cards = grid.locator(':scope > .card');
  expect(await cards.count()).toBeGreaterThan(1);

  const firstBox = await cards.first().boundingBox();
  const gridBox = await grid.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(gridBox).not.toBeNull();
  expect(Math.abs((firstBox?.width ?? 0) - (gridBox?.width ?? 0))).toBeLessThan(2);

  await expect(grid.locator('.meta-label')).toHaveCount(0);
  await expect(grid).not.toContainText(/\bLOG\b/);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileCardBox = await cards.first().boundingBox();
  const mobileGridBox = await grid.boundingBox();
  expect(mobileCardBox).not.toBeNull();
  expect(mobileGridBox).not.toBeNull();
  expect(Math.abs((mobileCardBox?.width ?? 0) - (mobileGridBox?.width ?? 0))).toBeLessThan(2);
});

test('footer has LinkedIn, GitHub, and Privacy text links', async ({ page }) => {
  await page.goto('/');

  const footerNav = page.getByRole('navigation', { name: 'Footer' });
  const links = footerNav.getByRole('link');
  await expect(links).toHaveCount(3);
  await expect(links).toHaveText([/LinkedIn/, /GitHub/, 'Privacy']);
  await expect(links.nth(0)).toHaveAttribute('href', 'https://linkedin.com/in/ericcarlisle');
  await expect(links.nth(1)).toHaveAttribute('href', 'https://github.com/ecarlisle');
  await expect(links.nth(2)).toHaveAttribute('href', '/privacy/');
  await expect(footerNav.locator('.external-link-glyph')).toHaveCount(2);
  await expect(links.nth(2).locator('.external-link-glyph')).toHaveCount(0);
});

test('About, Portfolio, and Blog share homepage header alignment without terminal labels', async ({
  page,
}) => {
  const pages = ['/about/', '/portfolio/', '/blog/'] as const;

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const homepageHeadingBox = await page.locator('.home-hero h1').boundingBox();
    const homepageSurfaceBox = await page.locator('.home-hero').boundingBox();

    expect(homepageHeadingBox).not.toBeNull();
    expect(homepageSurfaceBox).not.toBeNull();

    for (const path of pages) {
      await page.goto(path);

      const header = page.locator('.page-intro.technical-surface');
      const headingBox = await header.locator('h1').boundingBox();

      await expect(header).toBeVisible();
      await expect(header.locator('.terminal-eyebrow')).toHaveCount(0);
      await expect(header.locator('h1')).toHaveCount(1);
      expect(headingBox).not.toBeNull();
      expect(Math.abs((headingBox?.x ?? 0) - (homepageHeadingBox?.x ?? 0))).toBeLessThan(2);

      if (path === '/blog/' && viewport.width > 720) {
        const headerBox = await header.boundingBox();

        expect(headerBox).not.toBeNull();
        expect(Math.abs((headerBox?.x ?? 0) - (homepageSurfaceBox?.x ?? 0))).toBeLessThan(2);
      }
    }
  }
});

test('Contact content and form align with the heading on the readable rail', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/contact/');

    const headingBox = await page.locator('.page-header h1').boundingBox();
    const contentBox = await page.locator('.contact-section').boundingBox();
    const formBox = await page.locator('.contact-form').boundingBox();

    expect(headingBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(Math.abs((contentBox?.x ?? 0) - (headingBox?.x ?? 0))).toBeLessThan(2);
    expect(Math.abs((formBox?.x ?? 0) - (headingBox?.x ?? 0))).toBeLessThan(2);
    expect(formBox?.width ?? 0).toBeLessThanOrEqual(contentBox?.width ?? 0);
  }
});

test('homepage labels its compact capability group with a modest action gap', async ({ page }) => {
  await page.goto('/');

  const actions = page.locator('.home-hero-actions');
  const label = page.locator('#core-capabilities-label');
  const chips = page.locator('.home-hero-chips');
  const actionsBox = await actions.boundingBox();
  const labelBox = await label.boundingBox();

  await expect(label).toContainText('Core capabilities');
  await expect(chips).toHaveAttribute('aria-labelledby', 'core-capabilities-label');
  await expect(page.locator('.section-index')).toHaveText('>~/field_notes');
  expect(actionsBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect((labelBox?.y ?? 0) - ((actionsBox?.y ?? 0) + (actionsBox?.height ?? 0))).toBeLessThan(32);
});

test('the portfolio page renders case study content', async ({ page }) => {
  await page.goto('/portfolio/');

  // Smoke test: at least one case study renders. Exact count is intentionally
  // not asserted — content additions should not break this tripwire.
  const caseStudies = page.locator('.case-study');
  await expect(caseStudies.first()).toBeVisible();
});

// ─── Portfolio fragment anchors ────────────────────────────────────────
// Case-study titles carry permanent, human-readable fragment ids (e.g.
// /portfolio/#kiss-design-system). These are public URLs, so the ids are
// explicit in the template and must not drift from the titles they anchor.

const portfolioFragments = [
  { id: 'kiss-design-system', title: 'KISS Design System', level: 'h3' },
  {
    id: 'multi-tenant-frontend-systems',
    title: 'Scaling Multi-Tenant Frontend Systems',
    level: 'h3',
  },
  {
    id: 'enterprise-commerce-performance',
    title: 'Reengineering Enterprise Commerce Performance',
    level: 'h3',
  },
  {
    id: 'product-team-integration-layers',
    title: 'Building Integration Layers for Product Teams',
    level: 'h3',
  },
  {
    id: 'interactive-decision-experiences',
    title: 'Designing Interactive Decision Experiences',
    level: 'h3',
  },
  { id: 'how-i-work', title: 'How I work', level: 'h2' },
] as const;

test('portfolio fragment ids are unique and anchor the right titles', async ({ page }) => {
  await page.goto('/portfolio/');

  for (const { id, title, level } of portfolioFragments) {
    const heading = page.locator(`${level}#${id}`);
    await expect(heading).toHaveCount(1);
    await expect(heading).toContainText(title);

    // Each title has a sibling permalink pointing at its own fragment.
    const permalink = heading.locator('..').locator('a.permalink');
    await expect(permalink).toHaveCount(1);
    await expect(permalink).toHaveAttribute('href', `#${id}`);
    await expect(permalink).toHaveAttribute('aria-label', `Link to ${title}`);
    await expect(permalink.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  }

  // Duplicate ids on the page would break fragment navigation.
  const ids = await page.locator('h2[id], h3[id]').evaluateAll((els) => els.map((el) => el.id));
  expect(new Set(ids).size).toBe(ids.length);

  // Permalinks are sibling anchors — never nested inside another link.
  await expect(page.locator('a a')).toHaveCount(0);
});

for (const { id, title, level } of portfolioFragments) {
  test(`/#${id} fragment lands on the ${title} case study`, async ({ page }) => {
    await page.goto(`/portfolio/#${id}`);

    const heading = page.locator(`${level}#${id}`);
    await expect(heading).toContainText(title);
    await expect(heading).toBeInViewport();

    // The fixed header must not obscure the target: the heading should rest
    // at or below the header's measured height (scroll-margin-top clears it).
    const box = await heading.boundingBox();
    const headerHeight =
      (await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
      )) || 72;
    expect(box).not.toBeNull();
    expect(box?.y).toBeGreaterThanOrEqual(headerHeight - 1);
  });
}

test('portfolio permalinks are keyboard-reachable with a visible focus treatment', async ({
  page,
}) => {
  await page.goto('/portfolio/');
  const permalink = page.locator('a.permalink[href="#kiss-design-system"]');
  await expect(permalink).toHaveCount(1);

  // Drive focus with real keyboard navigation until the permalink receives it.
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const focusedHref = await page.evaluate(() =>
      document.activeElement instanceof HTMLElement
        ? document.activeElement.getAttribute('href')
        : null,
    );
    if (focusedHref === '#kiss-design-system') break;
  }
  await expect(permalink).toBeFocused();

  // Keyboard focus must be visually identified (dashed focus ring).
  const outlineStyle = await permalink.evaluate((el) =>
    getComputedStyle(el).getPropertyValue('outline-style'),
  );
  expect(outlineStyle).not.toBe('none');
  await expect(permalink).toBeInViewport();
});

test('portfolio title permalinks stay tappable at mobile viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/portfolio/');

  // Longest title: the permalink must remain visible and on-screen.
  const permalink = page.locator('a.permalink[href="#interactive-decision-experiences"]');
  await expect(permalink).toBeVisible();
  const box = await permalink.boundingBox();
  if (!box) throw new Error('permalink has no bounding box');

  // Reasonable touch target without spilling off the viewport.
  expect(box.width).toBeGreaterThanOrEqual(40);
  expect(box.height).toBeGreaterThanOrEqual(40);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
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

// ─── Webmentions heading level ──────────────────────────────────────

const WEBMENTION_ARTICLE = '/blog/250mm-trading-card-box/';

test('article page renders a Webmentions section', async ({ page }) => {
  await page.goto(WEBMENTION_ARTICLE);
  // The section may be absent if no mentions are available (e.g. CI without token), but
  // when present it must use the correct heading level. Accept 0 or 1 sections.
  const count = await page.locator('.webmentions').count();
  expect(count).toBeLessThanOrEqual(1);
  if (count === 1) {
    await expect(page.locator('.webmentions')).toBeVisible();
  }
});

test('webmentions heading is level 2, not level 3', async ({ page }) => {
  await page.goto(WEBMENTION_ARTICLE);
  const section = page.locator('.webmentions');
  const exists = (await section.count()) === 1;
  if (!exists) return; // skip if no webmentions are rendered
  await expect(section.locator('h2.webmentions-heading')).toHaveCount(1);
  await expect(section.locator('h3')).toHaveCount(0);
});

test('article heading outline is correct', async ({ page }) => {
  await page.goto(WEBMENTION_ARTICLE);
  const headings = page.locator('article h1, article h2, article h3');
  const levels = await headings.evaluateAll((els) =>
    els.map((el) => ({
      level: el.tagName.toLowerCase(),
      text: (el.textContent ?? '').trim().substring(0, 40),
    })),
  );

  // Title must be h1
  const titleHeading = levels.find((h) => h.level === 'h1');
  expect(titleHeading).toBeTruthy();

  // All top-level sections are h2 (Webmentions is one of them)
  const h2s = levels.filter((h) => h.level === 'h2');
  expect(h2s.length).toBeGreaterThanOrEqual(1);

  // There should be no h3 that isn't inside a legitimate subsection
  const h3s = levels.filter((h) => h.level === 'h3');
  for (const h3 of h3s) {
    // Every h3 must have a preceding h2 sibling or be inside a marked subsection
    const idx = levels.indexOf(h3);
    const preceding = levels.slice(0, idx).reverse();
    const prevH2 = preceding.find((h) => h.level === 'h2');
    expect(prevH2).toBeTruthy();
  }
});
