import { expect, test } from '@playwright/test';

const SPEAKING = '/speaking/';
const VIDEO_IDS = ['cW4-WJq8WbE', 'VAclokb-vsE', 'qqBVjr0dabM', 'WEB3UMzbIt0'];

test('speaking page presents one featured talk and the archive in order', async ({ page }) => {
  await page.goto(SPEAKING);

  await expect(page.getByRole('heading', { level: 1, name: 'Selected Talks' })).toBeVisible();
  await expect(page.getByText('Featured presentation')).toHaveCount(1);
  await expect(page.locator('.archive-label')).toHaveCount(3);

  const playButtons = page.locator('.yf-play');
  await expect(playButtons).toHaveCount(4);
  for (const [index, videoId] of VIDEO_IDS.entries()) {
    await expect(page.locator('youtube-facade').nth(index)).toHaveAttribute(
      'data-video-id',
      videoId,
    );
  }
});

test('speaking page uses local posters and makes no YouTube request before activation', async ({
  page,
}) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (
      (url.includes('youtube') || url.includes('ytimg') || url.includes('googlevideo')) &&
      !url.includes('localhost')
    ) {
      thirdPartyRequests.push(url);
    }
  });

  await page.goto(SPEAKING);
  await page.waitForTimeout(1000);

  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  expect(thirdPartyRequests).toEqual([]);

  const posters = page.locator('.yf-poster');
  await expect(posters).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(posters.nth(index)).toHaveAttribute(
      'src',
      /(?:\/_astro\/talk-|\/_image\?href=.*talk-).+/,
    );
  }
});

test('speaking page does not overflow a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(SPEAKING);

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  await expect(page.locator('.yf-play').first()).toBeVisible();
});

test('archive talks use full-width compact rows on desktop and stack on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(SPEAKING);

  const grid = page.locator('.talk-grid');
  const cards = grid.locator('.talk-card');
  const gridBox = await grid.boundingBox();

  await expect(cards).toHaveCount(3);
  expect(gridBox).not.toBeNull();

  for (let index = 0; index < 3; index += 1) {
    const card = cards.nth(index);
    const cardBox = await card.boundingBox();
    const titleBox = await card.getByRole('heading', { level: 3 }).boundingBox();
    const playerBox = await card.locator('youtube-facade').boundingBox();

    expect(cardBox).not.toBeNull();
    expect(playerBox).not.toBeNull();
    expect(Math.abs((cardBox?.width ?? 0) - (gridBox?.width ?? 0))).toBeLessThan(2);
    expect(playerBox?.x ?? 0).toBeGreaterThan(titleBox?.x ?? 0);
  }

  await page.setViewportSize({ width: 390, height: 844 });

  const firstCard = cards.first();
  const mobileDescriptionBox = await firstCard.locator(':scope > p:not(.talk-meta)').boundingBox();
  const mobilePlayerBox = await firstCard.locator('youtube-facade').boundingBox();

  expect(mobileDescriptionBox).not.toBeNull();
  expect(mobilePlayerBox).not.toBeNull();
  expect(mobilePlayerBox?.y ?? 0).toBeGreaterThan(
    (mobileDescriptionBox?.y ?? 0) + (mobileDescriptionBox?.height ?? 0),
  );
});

test('portfolio shows only the featured talk and links to the full archive', async ({ page }) => {
  await page.goto('/portfolio/');

  const speakingSection = page.locator('.speaking-feature');
  await expect(speakingSection).toBeVisible();
  await expect(speakingSection.locator('youtube-facade')).toHaveCount(1);
  await expect(speakingSection.locator('youtube-facade')).toHaveAttribute(
    'data-video-id',
    'cW4-WJq8WbE',
  );
  await expect(speakingSection.getByRole('link', { name: 'View all talks' })).toHaveAttribute(
    'href',
    '/speaking/',
  );
});
