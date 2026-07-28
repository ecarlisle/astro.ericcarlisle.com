/** YouTube facade tests. */
import { expect, test } from '@playwright/test';

const TEST_PAGE = '/lab/youtube-facade-test/';

test('initial HTML contains no YouTube iframe', async ({ page }) => {
  await page.goto(TEST_PAGE);
  const html = await page.content();
  expect(html).not.toContain('youtube-nocookie.com');
  expect(html).not.toContain('www.youtube.com/embed');
});

test('poster images are rendered', async ({ page }) => {
  await page.goto(TEST_PAGE);
  const posters = page.locator('.yf-poster');
  await expect(posters.first()).toBeVisible();
  await expect(posters).toHaveCount(2);
});

test('play buttons are present and accessible', async ({ page }) => {
  await page.goto(TEST_PAGE);
  const firstBtn = page.locator('.yf-play').first();
  await expect(firstBtn).toBeVisible();
  await expect(firstBtn).toHaveAttribute('aria-label', 'Play: Test video');

  const secondBtn = page.locator('.yf-play').nth(1);
  await expect(secondBtn).toHaveAttribute('aria-label', 'Play: Second test video');
});

test('no third-party YouTube requests before activation', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (
      (url.includes('youtube') || url.includes('ytimg') || url.includes('googlevideo')) &&
      !url.includes('localhost')
    ) {
      requests.push(url);
    }
  });

  await page.goto(TEST_PAGE);
  await page.waitForTimeout(1500);
  expect(requests).toEqual([]);
});

test('activation creates a youtube-nocookie iframe with correct video ID', async ({ page }) => {
  await page.goto(TEST_PAGE);
  await page.locator('.yf-play').first().click();

  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toBeVisible({ timeout: 15000 });

  const src = await iframe.getAttribute('src');
  expect(src).toContain('_tiRKn5gV28');
});

test('iframe has correct attributes', async ({ page }) => {
  await page.goto(TEST_PAGE);
  await page.locator('.yf-play').first().click();

  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toBeVisible({ timeout: 15000 });

  await expect(iframe).toHaveAttribute('allowfullscreen', '');
  await expect(iframe).toHaveAttribute('title', 'Test video');
  await expect(iframe).toHaveAttribute('allow', /autoplay/);
});

test('second facade instance creates its own iframe independently', async ({ page }) => {
  await page.goto(TEST_PAGE);

  await page.locator('.yf-play').nth(1).click();

  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toBeVisible({ timeout: 15000 });

  const src = await iframe.getAttribute('src');
  expect(src).toContain('dQw4w9WgXcQ');
});

test('repeated activation does not create another iframe', async ({ page }) => {
  await page.goto(TEST_PAGE);
  await page.locator('.yf-play').first().click();

  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toBeVisible({ timeout: 15000 });

  // Force-dispatch the click event on the (now-hidden) button
  await page.locator('.yf-play').first().dispatchEvent('click');
  await page.waitForTimeout(500);

  await expect(iframe).toHaveCount(1);
});

test('caption is rendered when provided', async ({ page }) => {
  await page.goto(TEST_PAGE);
  const caption = page.locator('.yf-caption');
  await expect(caption).toContainText('Test caption');
});

test('noscript fallback link exists in source HTML', async ({ page }) => {
  await page.goto(TEST_PAGE);
  const html = await page.content();
  expect(html).toContain('yf-noscript');
  expect(html).toContain('Watch on YouTube');
  expect(html).toContain('www.youtube.com/watch');
});

test('page without facade does not reference facade bootstrap', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  expect(html).not.toContain('YouTubeFacade');
  expect(html).not.toContain('youtube-facade');
});
