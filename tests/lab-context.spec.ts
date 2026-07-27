/** Context Health report tests. */
import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const HEALTH_PATH = '/lab/context/';

// ─── Report schema validation ───────────────────────────────────────────────

test('report JSON exists and is valid', () => {
  const path = 'src/data/context-health.json';
  expect(existsSync(path)).toBe(true);
  const raw = readFileSync(path, 'utf-8');
  const report = JSON.parse(raw);
  expect(report.schemaVersion).toBeTruthy();
  expect(report.overallSummary).toBeTruthy();
  expect(Array.isArray(report.metrics)).toBe(true);
  expect(report.metrics.length).toBeGreaterThanOrEqual(1);
});

test('all metric IDs are unique', () => {
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  const ids = report.metrics.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('all metric scores are within range or null', () => {
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  for (const m of report.metrics) {
    if (m.score !== null) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(1);
    }
  }
});

test('evidence file paths exist in the repository', () => {
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  for (const m of report.metrics) {
    if (m.details?.measuredFiles) {
      for (const f of m.details.measuredFiles) {
        expect(existsSync(f.path)).toBe(true);
      }
    }
  }
});

test('context-size values are finite and nonnegative', () => {
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  const sizeMetric = report.metrics.find((m) => m.id === 'active-context-size');
  expect(sizeMetric).toBeTruthy();
  expect(sizeMetric.details.characters).toBeGreaterThan(0);
  expect(sizeMetric.details.estimatedTokens).toBeGreaterThan(0);
});

// ─── Route availability ─────────────────────────────────────────────────────

test('the /lab/context/ route loads with correct heading', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  await expect(page.locator('h1')).toContainText('Context Health');
  await expect(page).toHaveTitle(/Context Health/);
});

test('the page has robots noindex metadata', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

// ─── Required sections ──────────────────────────────────────────────────────

test('page displays health overview summary', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  await expect(page.locator('.ch-overview__summary')).toContainText(
    report.overallSummary.slice(0, 40),
  );
});

test('page displays metric score cards', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const cards = page.locator('.ch-score');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test('page displays strengths list', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  for (const s of report.strengths) {
    await expect(page.locator('.ch-overview__block').first()).toContainText(s.slice(0, 30));
  }
});

test('page displays prioritized improvements', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const report = JSON.parse(readFileSync('src/data/context-health.json', 'utf-8'));
  for (const p of report.priorities) {
    await expect(page.locator('.ch-overview__block').nth(1)).toContainText(p.finding.slice(0, 30));
  }
});

// ─── Native details/summary ─────────────────────────────────────────────────

test('metric details use native details/summary elements', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const details = page.locator('.ch-details details');
  const count = await details.count();
  expect(count).toBeGreaterThanOrEqual(1);

  // Open the first one and verify content appears
  await details.first().locator('summary').click();
  await expect(details.first()).toHaveAttribute('open', '');
});

// ─── Positive and negative contributors ─────────────────────────────────────

test('checks render with result labels', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  // Open a metric detail to reveal checks
  await page.locator('.ch-details details').first().locator('summary').click();
  const checks = page.locator('.ch-check');
  const count = await checks.count();
  if (count > 0) {
    // At least one check should have a result
    await expect(checks.first().locator('.ch-check__result')).toBeVisible();
  }
});

// ─── No old simulator controls ──────────────────────────────────────────────

test('no task radio buttons are present', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const radios = page.locator('input[type="radio"]');
  await expect(radios).toHaveCount(0);
});

test('no document checkboxes are present', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const checkboxes = page.locator('input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(0);
});

test('no preset selector is present', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  await expect(page.locator('.preset-list')).toHaveCount(0);
});

// ─── No client JavaScript on the report page ────────────────────────────────

test('report page does not load lab-specific JavaScript', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((s) => s.map((el) => el?.getAttribute('src')));
  const labScripts = scripts.filter((src) => src?.includes('context'));
  expect(labScripts).toEqual([]);
});

test('report page has no inline lab controller code', async ({ page }) => {
  await page.goto(HEALTH_PATH);
  const html = await page.content();
  expect(html).not.toContain('runFixtureAnalysis');
  expect(html).not.toContain('renderTaskSelector');
  expect(html).not.toContain('renderPresetSelector');
});

// ─── Asset isolation from ordinary pages ────────────────────────────────────

test('homepage does not load context-health CSS', async ({ page }) => {
  await page.goto('/');
  const links = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((els) => els.map((el) => el?.getAttribute('href')));
  const healthCss = links.filter((h) => h?.includes('context'));
  expect(healthCss).toEqual([]);
});

test('blog article does not load context-health assets', async ({ page }) => {
  await page.goto('/blog/250mm-trading-card-box/');
  const html = await page.content();
  expect(html).not.toContain('Context Health');
});

// ─── Accessibility ─────────────────────────────────────────────────────────

test('no critical axe violations', async ({ page }) => {
  const AxeBuilder = await import('@axe-core/playwright').then((m) => m.default);
  await page.goto(HEALTH_PATH);
  // color-contrast disabled: the site uses OKLCH tokens that axe's sRGB-based
  // contrast checker flags incorrectly in some cases. The project validates
  // contrast separately via Lighthouse and manual WCAG 2 AA checks.
  // See tests/accessibility.spec.ts for the same exclusion on all other pages.
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(results.violations).toEqual([]);
});

// ─── Responsive ─────────────────────────────────────────────────────────────

test('no horizontal overflow at narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(HEALTH_PATH);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
