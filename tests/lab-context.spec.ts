import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const healthPath = '/lab/context/';
const reportPath = 'src/data/context-health.json';
const generatorPath = 'scripts/generate-context-health.mjs';
const validatorPath = 'scripts/validate-context-health.mjs';
const resultScores = { pass: 1, partial: 0.5, fail: 0 } as const;

type Result = keyof typeof resultScores;
interface TestCheck {
  weight: number;
  result: Result;
  contribution: number;
  interpretation: string;
  evidence: {
    observation: string;
    citations: Array<{ path: string; section: string }>;
  };
}
interface TestMetric {
  id: string;
  label: string;
  assessmentType: 'agent-assessed' | 'deterministic';
  score: number | null;
  checks?: TestCheck[];
  details?: {
    characters: number;
    estimatedTokens: number;
    measuredFiles: Array<{ path: string; characters: number }>;
  };
}
interface TestReport {
  schemaVersion: string;
  overallSummary: string;
  priorities: unknown[];
  effectiveContext: { files: string[] };
  metrics: TestMetric[];
}
type ContrastMeasurements = Record<
  string,
  {
    body: number;
    metricValue: number;
    status: number;
    positive: number;
    negative: number;
    priority: number;
    summary: number;
    focus: number;
  }
>;

function readReport(): TestReport {
  return JSON.parse(readFileSync(reportPath, 'utf8')) as TestReport;
}

function withTemporaryReport(run: (path: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'context-health-'));
  const path = join(directory, 'report.json');
  try {
    writeFileSync(path, readFileSync(reportPath));
    run(path);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('report schema, score calculations, and evidence citations are valid', () => {
  const report = readReport();
  expect(report.schemaVersion).toBe('2.0.0');
  expect(report.metrics.map((metric) => metric.id)).toEqual([
    'context-precision',
    'context-recall',
    'sufficiency',
    'authority-clarity',
    'active-context-size',
  ]);
  expect(report.priorities.length).toBeGreaterThan(0);
  expect(report.priorities.length).toBeLessThanOrEqual(3);

  for (const metric of report.metrics.filter((item) => item.assessmentType === 'agent-assessed')) {
    const checks = metric.checks ?? [];
    const expectedScore = checks.reduce(
      (sum, check) => sum + check.weight * resultScores[check.result],
      0,
    );
    expect(checks.reduce((sum, check) => sum + check.weight, 0)).toBeCloseTo(1, 8);
    expect(metric.score).not.toBeNull();
    if (metric.score === null) throw new Error(`${metric.id} score missing`);
    expect(metric.score).toBeCloseTo(expectedScore, 3);
    for (const check of checks) {
      expect(check.contribution).toBeCloseTo(check.weight * resultScores[check.result], 3);
      expect(check.evidence.observation).toBeTruthy();
      expect(check.interpretation).toBeTruthy();
      expect(check.evidence.citations.length).toBeGreaterThan(0);
      for (const citation of check.evidence.citations) {
        expect(existsSync(citation.path), citation.path).toBe(true);
        expect(
          readFileSync(citation.path, 'utf8'),
          `${citation.path}: ${citation.section}`,
        ).toContain(citation.section);
      }
    }
  }
});

test('generator measures characters, derives scores, and is idempotent', () => {
  withTemporaryReport((path) => {
    const stale = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const staleSize = stale.metrics.find((metric) => metric.id === 'active-context-size');
    const stalePrecision = stale.metrics.find((metric) => metric.id === 'context-precision');
    expect(staleSize?.details).toBeTruthy();
    expect(stalePrecision).toBeTruthy();
    if (!staleSize?.details || !stalePrecision) throw new Error('required metrics missing');
    staleSize.details.characters = 1;
    stalePrecision.score = 0;
    writeFileSync(path, `${JSON.stringify(stale, null, 2)}\n`);

    const env = { ...process.env, CONTEXT_HEALTH_REPORT_PATH: path };
    execFileSync(process.execPath, [generatorPath], { env });
    const first = readFileSync(path, 'utf8');
    execFileSync(process.execPath, [generatorPath], { env });
    const second = readFileSync(path, 'utf8');
    expect(second).toBe(first);

    const generated = JSON.parse(second) as TestReport;
    const expectedCharacters = generated.effectiveContext.files.reduce(
      (sum, file) => sum + readFileSync(file, 'utf8').length,
      0,
    );
    const size = generated.metrics.find((metric) => metric.id === 'active-context-size');
    expect(size?.details?.characters).toBe(expectedCharacters);
    expect(size?.details?.estimatedTokens).toBe(Math.ceil(expectedCharacters / 4));
    const precision = generated.metrics.find((metric) => metric.id === 'context-precision');
    const expectedPrecision = (precision?.checks ?? []).reduce(
      (sum, check) => sum + check.weight * resultScores[check.result],
      0,
    );
    expect(precision?.score).toBeCloseTo(expectedPrecision, 3);
  });
});

test('generator reports validator process-launch failures', () => {
  withTemporaryReport((path) => {
    const result = spawnSync(process.execPath, [generatorPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        CONTEXT_HEALTH_REPORT_PATH: path,
        CONTEXT_HEALTH_VALIDATOR_EXECUTABLE: '/definitely/missing/context-health-node',
      },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cannot run validator');
    expect(result.stderr).not.toContain('TypeError');
  });
});

test('prototype result names are rejected by scoring and validation', () => {
  withTemporaryReport((path) => {
    const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const assessed = report.metrics.find((metric) => metric.assessmentType === 'agent-assessed');
    const firstCheck = assessed?.checks?.[0];
    expect(firstCheck).toBeTruthy();
    if (!firstCheck) throw new Error('agent-assessed check missing');
    firstCheck.result = 'toString' as Result;
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);

    const generator = spawnSync(process.execPath, [generatorPath], {
      encoding: 'utf8',
      env: { ...process.env, CONTEXT_HEALTH_REPORT_PATH: path },
    });
    expect(generator.status).not.toBe(0);
    expect(generator.stderr).toContain('unknown result "toString"');

    const validator = spawnSync(process.execPath, [validatorPath], {
      encoding: 'utf8',
      env: { ...process.env, CONTEXT_HEALTH_REPORT_PATH: path },
    });
    expect(validator.status).not.toBe(0);
    expect(validator.stderr).toContain('invalid result toString');
  });
});

test('validator rejects stale deterministic measurements', () => {
  withTemporaryReport((path) => {
    const stale = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const size = stale.metrics.find((metric) => metric.id === 'active-context-size');
    expect(size?.details).toBeTruthy();
    if (!size?.details) throw new Error('active-context-size details missing');
    size.details.measuredFiles[0].characters += 1;
    writeFileSync(path, `${JSON.stringify(stale, null, 2)}\n`);

    const result = spawnSync(process.execPath, [validatorPath], {
      encoding: 'utf8',
      env: { ...process.env, CONTEXT_HEALTH_REPORT_PATH: path },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('measuredFiles are stale');
  });
});

test('report renders the overview, priorities, metrics, and contributor groups', async ({
  page,
}) => {
  const report = readReport();
  await page.goto(healthPath);

  await expect(page).toHaveTitle(/Context Health/);
  await expect(page.locator('h1')).toHaveText('Context Health');
  await expect(page.locator('.ch-overview__summary')).toHaveText(report.overallSummary);
  await expect(page.locator('.ch-priority__recommendation')).toHaveCount(report.priorities.length);
  await expect(page.locator('.ch-score')).toHaveCount(report.metrics.length);
  for (const metric of report.metrics) {
    await expect(page.locator('.ch-score__label', { hasText: metric.label })).toHaveCount(1);
  }

  const overview = page.locator('.ch-overview');
  await expect(overview.locator(':scope > h2')).toHaveText('Overview');
  await expect(overview.locator('.ch-overview__columns h3')).toHaveText([
    'Key strengths',
    'Prioritized improvements',
  ]);
  await expect(overview.locator('.ch-overview__columns h2')).toHaveCount(0);
  const priorities = overview.locator('ol');
  const priorityStyles = await priorities.evaluate((list) => {
    const styles = getComputedStyle(list);
    return {
      listStyleType: styles.listStyleType,
      paddingInlineStart: Number.parseFloat(styles.paddingInlineStart),
    };
  });
  expect(priorityStyles.listStyleType).not.toBe('none');
  expect(priorityStyles.paddingInlineStart).toBeGreaterThan(0);

  const assessed = report.metrics.filter((metric) => metric.assessmentType === 'agent-assessed');
  const assessedDetails = page.locator('.ch-details details').filter({
    has: page.locator('.ch-contributors'),
  });
  expect(await assessedDetails.count()).toBe(assessed.length);
  for (let index = 0; index < assessed.length; index += 1) {
    const metric = assessed[index];
    const detail = assessedDetails.nth(index);
    await detail.locator('summary').click();
    const positiveCount = metric.checks?.filter((check) => check.result === 'pass').length ?? 0;
    const negativeCount = (metric.checks?.length ?? 0) - positiveCount;
    expect(positiveCount + negativeCount).toBeGreaterThan(0);
    await expect(detail.getByRole('heading', { name: 'Positive contributors' })).toHaveCount(
      positiveCount > 0 ? 1 : 0,
    );
    await expect(detail.getByRole('heading', { name: 'Negative contributors' })).toHaveCount(
      negativeCount > 0 ? 1 : 0,
    );
    await expect(detail.locator('.ch-check--positive')).toHaveCount(positiveCount);
    await expect(detail.locator('.ch-check--negative')).toHaveCount(negativeCount);
  }
});

test('active context uses the same formatted value in its card and disclosure', async ({
  page,
}) => {
  await page.goto(healthPath);
  const card = page.locator('.ch-score').filter({ hasText: 'Active Context Size' });
  const value = (await card.locator('.ch-score__value').textContent())?.trim();
  expect(value).toMatch(/^\d{1,3}(,\d{3})* chars$/);
  await expect(
    page.locator('.ch-details summary').filter({ hasText: 'Active Context Size' }),
  ).toContainText(value ?? 'missing value');
});

test('native details controls work with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(healthPath);
  const details = page.locator('.ch-details details').first();
  await expect(details).not.toHaveAttribute('open', '');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await context.close();
});

test('obsolete simulator controls and client JavaScript are absent', async ({ page }) => {
  await page.goto(healthPath);
  const reportRegion = page.locator('.ch-page');
  await expect(reportRegion.locator('input, button, select')).toHaveCount(0);
  await expect(reportRegion.locator('.preset-list, .experiment, #app')).toHaveCount(0);
  const scriptSources = await page
    .locator('script[src]')
    .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src')));
  expect(scriptSources.filter((source) => /context|lab-context/i.test(source ?? ''))).toEqual([]);
  const loadedScripts = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'script')
      .map((entry) => entry.name),
  );
  expect(loadedScripts.filter((source) => /context|lab-context/i.test(source))).toEqual([]);
  const html = await page.content();
  expect(html).not.toContain('runFixtureAnalysis');
  expect(html).not.toContain('ch-page__script');
});

test('deployment workflow validates Context Health before building', () => {
  const workflow = readFileSync('.github/workflows/astro.yml', 'utf8');
  const validationStep = workflow.indexOf('run: pnpm context:health:validate');
  const firstBuild = workflow.indexOf('run: pnpm build');
  expect(validationStep).toBeGreaterThan(0);
  expect(firstBuild).toBeGreaterThan(0);
  expect(validationStep).toBeLessThan(firstBuild);
  expect(workflow.match(/run: pnpm context:health:validate/g)).toHaveLength(1);
});

test('Context Health CSS is a guarded page-only asset', async ({ page }) => {
  await page.goto(healthPath);
  const stylesheets = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(stylesheets.length).toBeGreaterThan(0);
  const contents = await Promise.all(
    stylesheets.map(async (href) => ({ href, css: await (await fetch(href)).text() })),
  );
  const contextAssets = contents.filter(({ css }) => css.includes('.ch-page'));
  expect(
    contextAssets,
    'expected one generated stylesheet containing Context Health rules',
  ).toHaveLength(1);
  const contextHref = contextAssets[0].href;

  for (const path of ['/', '/blog/250mm-trading-card-box/', '/search/']) {
    await page.goto(path);
    const linked = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
    expect(linked, `${path} must not load Context Health CSS`).not.toContain(contextHref);
  }
});

test('ordinary production pages do not load Sentry resources', async ({ page }) => {
  for (const path of ['/', '/blog/250mm-trading-card-box/', '/search/']) {
    await page.goto(path);
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name),
    );
    expect(resources.filter((url) => /sentry|spotlight/i.test(url))).toEqual([]);
  }
});

test('axe passes with color contrast enabled', async ({ page }) => {
  await page.goto(healthPath);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('representative text and focus indicators meet contrast thresholds', async ({ page }) => {
  await page.goto(healthPath);
  const measurements: ContrastMeasurements = {};

  for (const theme of ['light', 'dark']) {
    await page
      .locator('html')
      .evaluate((html, value) => html.setAttribute('data-theme', value), theme);
    await page.locator('.ch-details summary').first().focus();
    measurements[theme] = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('2D canvas unavailable');

      const rgba = (value: string): number[] => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#000';
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      const luminance = ([r, g, b]: number[]) => {
        const channels = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const ratio = (foreground: string, background: string) => {
        const first = luminance(rgba(foreground));
        const second = luminance(rgba(background));
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      };
      const opaqueBackground = (element: Element | null): string => {
        let current = element;
        while (current) {
          const background = getComputedStyle(current).backgroundColor;
          if (rgba(background)[3] === 255) return background;
          current = current.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const textRatio = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing contrast target: ${selector}`);
        return ratio(getComputedStyle(element).color, opaqueBackground(element));
      };

      const summary = document.querySelector('.ch-details summary');
      if (!summary) throw new Error('Missing summary');
      return {
        body: textRatio('.ch-overview__summary'),
        metricValue: textRatio('.ch-score__value'),
        status: textRatio('.ch-status'),
        positive: textRatio('.ch-check--positive .ch-check__result'),
        negative: textRatio('.ch-check--negative .ch-check__result'),
        priority: textRatio('.ch-priority__recommendation'),
        summary: textRatio('.ch-details summary'),
        focus: ratio(
          getComputedStyle(summary).outlineColor,
          opaqueBackground(summary.parentElement),
        ),
      };
    });
  }

  console.log(`Context Health contrast ratios: ${JSON.stringify(measurements)}`);
  for (const theme of Object.values(measurements)) {
    expect(theme.metricValue).toBeGreaterThanOrEqual(3);
    expect(theme.focus).toBeGreaterThanOrEqual(3);
    const normalTextKeys = [
      'body',
      'status',
      'positive',
      'negative',
      'priority',
      'summary',
    ] as const;
    for (const key of normalTextKeys) {
      expect(theme[key], key).toBeGreaterThanOrEqual(4.5);
    }
  }
});

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`${viewport.name} layout is readable without page overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(healthPath);
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    await expect(page.locator('.ch-score').first()).toBeVisible();
    await expect(page.locator('.ch-details summary').first()).toBeVisible();
  });
}
