import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AstroBlog smoke, accessibility, and SEO tests.
 *
 * Tests run against the production build served by a static file server.
 * The webServer command builds the site first to ensure dist/ is current.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['json', { outputFile: 'test-results/test-results.json' }]],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command:
      'pnpm build && node scripts/patch-storybook-noindex.mjs && mkdir -p dist/design-system/lab && cp -r storybook-static/* dist/design-system/lab/ && node scripts/static-server.mjs dist 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      LIGHTHOUSE_SCORES_PATH: './tests/fixtures/lighthouse-scores.json',
    },
  },
});
