import { expect, test } from '@playwright/test';
import type { Frame, Request } from 'playwright';

const NORMAL_PAGES = ['/', '/blog/', '/portfolio/', '/portfolio/design-system/'];

const STORYBOOK_PATTERNS = [
  '/design-system/lab/',
  'storybook',
  'sb-manager',
  'sb-preview',
  'sb-addons',
];

for (const pagePath of NORMAL_PAGES) {
  test(`Storybook isolation: ${pagePath} loads no Storybook assets`, async ({ page }) => {
    test.setTimeout(60000);
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    await page.goto(pagePath, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const storybookRequests = requests.filter((r) =>
      STORYBOOK_PATTERNS.some((p) => r.toLowerCase().includes(p)),
    );

    if (storybookRequests.length > 0) {
      console.log(`\n❌ ${pagePath} — ${storybookRequests.length} Storybook request(s):`);
      for (const r of storybookRequests) {
        console.log(`     ${r}`);
      }
    } else {
      const totalJS = requests.filter((r) => r.endsWith('.js')).length;
      console.log(`✅ ${pagePath} — ${totalJS} JS requests, no Storybook assets`);
    }

    expect(storybookRequests).toEqual([]);
  });
}

test('Storybook isolation: /design-system/lab/ loads Storybook assets', async ({ page }) => {
  test.setTimeout(120000);
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));

  // Also listen to iframe requests
  page.on('framenavigated', (frame: Frame) => {
    (frame as Frame & { on(event: 'request', listener: (req: Request) => void): void }).on(
      'request',
      (req: Request) => requests.push(req.url()),
    );
  });

  await page.goto('/design-system/lab/', { waitUntil: 'load' });
  await page.waitForTimeout(5000);

  const storybookRequests = requests.filter(
    (r) => r.includes('sb-manager') || r.includes('storybook'),
  );

  console.log(`\n/lab/ — ${storybookRequests.length} Storybook asset requests`);
  expect(storybookRequests.length).toBeGreaterThan(0);
});
