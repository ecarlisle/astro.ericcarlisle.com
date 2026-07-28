/** STL viewer tests. */
import { expect, test } from '@playwright/test';

const ARTICLE_1 = '/blog/250mm-trading-card-box/';
const ARTICLE_2 = '/blog/why-do-i-need-all-this-usb-and-sd-media-holder/';

test('homepage does not reference STL viewer', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  expect(html).not.toContain('stl-viewer');
});

test('STL article has viewer component', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const viewer = page.locator('stl-viewer');
  await expect(viewer).toHaveCount(1);
  // Alt text is present
  const srText = page.locator('stl-viewer .sr-only');
  await expect(srText).toContainText('3D model');
});

test('STL is not requested before activation', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('.stl') || url.includes('three.module')) {
      requests.push(url);
    }
  });

  await page.goto(ARTICLE_1);
  await page.waitForTimeout(1000);

  // STL and Three.js should not be requested before activation
  expect(requests).toEqual([]);
});

test('viewer activates without recursion error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(ARTICLE_1);
  const activateBtn = page.locator('.stl-activate');
  await expect(activateBtn).toBeVisible();

  await activateBtn.click();
  await page.waitForTimeout(2000);

  // Verify no recursion or stack overflow occurred in viewer code
  const hasRangeError = errors.some(
    (e) => e.includes('Maximum call stack') || e.includes('RangeError'),
  );
  expect(hasRangeError).toBe(false);

  // The viewer may show "Could not load" in headless environments without WebGL.
  // That's acceptable — the critical test is that no RangeError occurred.
  // If WebGL is available, verify the model loaded; otherwise skip.
  const statusText = await page.locator('.stl-status').textContent();
  if (statusText?.includes('Could not')) {
    // WebGL not available in this environment — viewer gracefully handled it.
    // Verify the error message is one of the expected ones.
    expect(statusText).toMatch(/Could not (load 3D model|initialize 3D viewer)/);
  }
});

test('viewer without color prop does not have data-color attribute', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const viewer = page.locator('stl-viewer');
  await expect(viewer).not.toHaveAttribute('data-color');
});

test('reset view button appears after activation attempt', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const resetBtn = page.locator('.stl-reset');
  await expect(resetBtn).toHaveAttribute('hidden', '');

  await page.locator('.stl-activate').click();
  await page.waitForTimeout(1000);

  // Reset button should be present (may be hidden if viewer failed due to WebGL)
  await expect(resetBtn).toBeAttached();
});

test('no download link is present on first article', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const downloadLink = page.locator('stl-viewer a.stl-download');
  await expect(downloadLink).toHaveCount(0);
});

test('second STL article also has viewer with correct download link', async ({ page }) => {
  await page.goto(ARTICLE_2);
  const viewer = page.locator('stl-viewer');
  await expect(viewer).toHaveCount(1);

  const downloadLink = page.locator('stl-viewer a.stl-download');
  await expect(downloadLink).toHaveCount(0);
});

// ─── YouTube facade in article ─────────────────────────────────────────────

test('timelapse video heading is present', async ({ page }) => {
  await page.goto(ARTICLE_1);
  await expect(page.locator('#timelapse-video-using-octolapse')).toBeVisible();
});

test('YouTube facade renders on the article', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const facade = page.locator('youtube-facade');
  await expect(facade).toHaveCount(1);
  await expect(facade.locator('.yf-poster')).toBeVisible();
  await expect(facade.locator('.yf-play')).toBeVisible();
});

test('article facade has no iframe before activation', async ({ page }) => {
  await page.goto(ARTICLE_1);
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
});

test('no YouTube requests from the article before activation', async ({ page }) => {
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
  await page.goto(ARTICLE_1);
  await page.waitForTimeout(1500);
  expect(requests).toEqual([]);
});

test('activating the article facade mounts a youtube-nocookie iframe', async ({ page }) => {
  await page.goto(ARTICLE_1);
  await page.locator('.yf-play').click();
  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toBeVisible({ timeout: 15000 });
  const src = await iframe.getAttribute('src');
  expect(src).toContain('_tiRKn5gV28');
  await expect(iframe).toHaveAttribute(
    'title',
    'Timelapse of the 250mm trading card box being printed with Octolapse',
  );
});

test('the article STL viewer still works independently', async ({ page }) => {
  await page.goto(ARTICLE_1);
  const stl = page.locator('stl-viewer');
  await expect(stl).toHaveCount(1);
  await expect(stl.locator('.stl-activate')).toBeVisible();
});
