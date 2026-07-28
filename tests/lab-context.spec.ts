import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { buildEvidenceUrl } from '../src/lib/context-health-evidence.mjs';

const healthPath = '/lab/context/';
const reportPath = 'src/data/context-health.json';
const generatorPath = 'scripts/generate-context-health.mjs';
const validatorPath = 'scripts/validate-context-health.mjs';
const refreshSkillPath = '.agents/skills/context-health-refresh/SKILL.md';
const resultScores = { pass: 1, partial: 0.5, fail: 0 } as const;

type Result = keyof typeof resultScores;
interface Citation {
  path: string;
  section?: string;
  startLine?: number;
  endLine?: number;
}
interface TestCheck {
  id: string;
  impact: 'positive' | 'negative';
  weight: number;
  result: Result;
  contribution: number;
  interpretation: string;
  evidence: { observation: string; citations: Citation[] };
}
interface Assessed {
  score: number | null;
  status: string;
  evidenceMaturity: string;
  evidenceMaturityReason: string;
  interpretation: string;
  limitations: string[];
  checks?: TestCheck[];
  details?: {
    characters: number;
    estimatedTokens: number;
    estimationMethod: string;
    measuredFiles: Array<{ path: string; characters: number }>;
  };
}
interface Observed {
  status: 'not-measured' | 'measured' | 'insufficient-evidence';
  score: number | null;
  numerator: number | null;
  denominator: number | null;
  taskCount: number;
  runCount: number;
  agentConfigurationCount: number;
  repositoryRevision: string | null;
  evaluationSuiteVersion: string | null;
  variation: string | null;
  confidence: string | null;
}
interface TestMetric {
  id: string;
  label: string;
  assessed: Assessed;
  observed: Observed;
}
interface TestReport {
  schemaVersion: string;
  repositoryRevision: string;
  overallSummary: string;
  priorities: unknown[];
  effectiveContext: { id: string; version: string; files: string[] };
  profileCoverage: Array<{
    id: string;
    version: string | null;
    status: string;
    score?: number;
  }>;
  metrics: TestMetric[];
  methodology: {
    id: string;
    version: string;
    status: string;
    evidenceMaturityVersion: string;
    evidenceMaturityLevels: Array<{ id: string }>;
    scenarioTaxonomy: string[];
    foundations: Array<{ url: string }>;
    activeContextThresholds?: string;
  };
  score?: number;
}

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

function runValidator(path: string) {
  return spawnSync(process.execPath, [validatorPath], {
    encoding: 'utf8',
    env: { ...process.env, CONTEXT_HEALTH_REPORT_PATH: path },
  });
}

test('Context Health refresh skill is linked and preserves evaluation boundaries', () => {
  const skill = readFileSync(refreshSkillPath, 'utf8');
  const frontmatter = skill.match(/^---\n([\s\S]+?)\n---/);
  expect(frontmatter).toBeTruthy();
  expect(frontmatter?.[1]).toContain('name: context-health-refresh');
  expect(frontmatter?.[1].split('\n')).toHaveLength(2);

  for (const heading of [
    '## Establish the audit',
    '## Collect surgical evidence',
    '## Preserve assessment boundaries',
    '## Record structured source references',
    '## Generate and inspect the report',
    '## Validate the page',
  ]) {
    expect(skill).toContain(heading);
  }
  expect(skill).toContain('Never infer it from static');
  expect(skill).toContain('Do not calculate an aggregate Context Health score');
  expect(skill).toContain('Do not introduce universal token thresholds');
  expect(skill).toContain('Do not build a runner');
  expect(skill).toContain('bounded influences');
  expect(skill).toContain('or endorse Context Health');
  expect(skill).toContain('Lock them before classifying evidence or assigning results');

  for (const link of [...skill.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1])) {
    expect(existsSync(resolve(dirname(refreshSkillPath), link.split('#')[0]))).toBe(true);
  }

  const agents = readFileSync('AGENTS.md', 'utf8');
  expect(agents).toContain(
    '[Context Health refresh](.agents/skills/context-health-refresh/SKILL.md) and [Context Health scoring rubric](docs/context-health-rubric.md)',
  );
  const rubric = readFileSync('docs/context-health-rubric.md', 'utf8');
  expect(rubric).toContain(
    '[Context Health refresh skill](../.agents/skills/context-health-refresh/SKILL.md)',
  );
});

test('schema versions, baseline scores, and profile coverage are explicit', () => {
  const report = readReport();
  expect(report.schemaVersion).toBe('3.0.0');
  expect(report.methodology).toMatchObject({
    id: 'context-health-core',
    version: '0.1.0',
    status: 'experimental',
    evidenceMaturityVersion: '1.0.0',
  });
  expect(report.effectiveContext).toMatchObject({
    id: 'significant-astro-ui',
    version: '2.0.0',
  });
  expect(report.metrics.map((metric) => metric.id)).toEqual([
    'context-precision',
    'context-recall',
    'sufficiency',
    'authority-clarity',
    'active-context-size',
  ]);
  expect(
    Object.fromEntries(report.metrics.map((metric) => [metric.id, metric.assessed.score])),
  ).toEqual({
    'context-precision': 0.875,
    'context-recall': 1,
    sufficiency: 1,
    'authority-clarity': 1,
    'active-context-size': null,
  });
  expect(report.profileCoverage.map((profile) => [profile.id, profile.status])).toEqual([
    ['significant-astro-ui', 'static-assessed'],
    ['content-editorial', 'not-evaluated'],
    ['deployment-ci-diagnosis', 'not-evaluated'],
    ['contact-worker', 'not-evaluated'],
    ['pr-review', 'not-evaluated'],
  ]);
  expect(report.profileCoverage.every((profile) => profile.score === undefined)).toBe(true);
  expect(report.score).toBeUndefined();
});

test('static assessments retain locked checks and use non-universal statuses', () => {
  const report = readReport();
  for (const metric of report.metrics.filter((item) => item.assessed.checks)) {
    const checks = metric.assessed.checks ?? [];
    const expectedScore = checks.reduce(
      (sum, check) => sum + check.weight * resultScores[check.result],
      0,
    );
    expect(checks.reduce((sum, check) => sum + check.weight, 0)).toBeCloseTo(1, 8);
    expect(metric.assessed.score).toBeCloseTo(expectedScore, 3);
    expect(metric.assessed.status).toBe(
      checks.every((check) => check.result === 'pass')
        ? 'complete-for-current-static-checks'
        : 'gaps-found',
    );
    for (const check of checks) {
      expect(check.contribution).toBeCloseTo(check.weight * resultScores[check.result], 3);
      expect(check.evidence.observation).toBeTruthy();
      expect(check.interpretation).toBeTruthy();
      expect(check.evidence.citations.length).toBeGreaterThan(0);
    }
  }
  expect(JSON.stringify(report)).not.toMatch(/healthy|needs-attention|at-risk/);
  expect(report.methodology.activeContextThresholds).toBeUndefined();
});

test('evidence maturity uses defined levels, reasons, and metric-specific judgments', () => {
  const report = readReport();
  const levels = new Set(report.methodology.evidenceMaturityLevels.map((level) => level.id));
  expect(levels).toEqual(
    new Set(['declared', 'structurally-verified', 'observed', 'repeated', 'resilient']),
  );
  const assigned = new Set<string>();
  for (const metric of report.metrics) {
    expect(levels.has(metric.assessed.evidenceMaturity)).toBe(true);
    expect(metric.assessed.evidenceMaturityReason.length).toBeGreaterThan(30);
    assigned.add(metric.assessed.evidenceMaturity);
  }
  expect(assigned.size).toBeGreaterThan(1);
});

test('all observed metrics are honestly not measured', () => {
  const report = readReport();
  for (const metric of report.metrics) {
    expect(metric.observed).toMatchObject({
      status: 'not-measured',
      score: null,
      numerator: null,
      denominator: null,
      taskCount: 0,
      runCount: 0,
      agentConfigurationCount: 0,
      repositoryRevision: null,
      evaluationSuiteVersion: null,
      variation: null,
      confidence: null,
    });
  }
});

test('validator rejects invented or incomplete observed measurements', () => {
  withTemporaryReport((path) => {
    const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    report.metrics[0].observed.status = 'measured';
    report.metrics[0].observed.denominator = 0;
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
    const result = runValidator(path);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'measured results need score, numerator, and positive denominator',
    );
    expect(result.stderr).toContain('measured taskCount must be a positive integer');
  });
});

test('validator rejects an aggregate score, profile score, and universal thresholds', () => {
  for (const mutation of ['aggregate', 'profile', 'threshold'] as const) {
    withTemporaryReport((path) => {
      const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
      if (mutation === 'aggregate') report.score = 1;
      if (mutation === 'profile') report.profileCoverage[1].score = 0;
      if (mutation === 'threshold') {
        report.methodology.activeContextThresholds = 'Healthy at 24,000 tokens or fewer.';
      }
      writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
      const result = runValidator(path);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/aggregate score|profile score|universal token/);
    });
  }
});

test('repository citations exist at the audited revision', () => {
  const report = readReport();
  for (const metric of report.metrics) {
    for (const check of metric.assessed.checks ?? []) {
      for (const citation of check.evidence.citations) {
        const source = execFileSync(
          'git',
          ['show', `${report.repositoryRevision}:${citation.path}`],
          { encoding: 'utf8' },
        );
        if (citation.startLine !== undefined) {
          const endLine = citation.endLine ?? citation.startLine;
          expect(endLine).toBeGreaterThanOrEqual(citation.startLine);
          expect(endLine).toBeLessThanOrEqual(source.split(/\r?\n/).length);
        }
      }
    }
  }
});

test('evidence URL builder selects GitHub file, heading, and Markdown source views', () => {
  const repositoryUrl = 'https://github.com/ecarlisle/astro.ericcarlisle.com';
  const revision = '77093ed';
  const rangeUrl = buildEvidenceUrl(revision, {
    path: 'docs/testing.md',
    startLine: 5,
    endLine: 13,
  });
  expect(rangeUrl).toBe(`${repositoryUrl}/blob/${revision}/docs/testing.md?plain=1#L5-L13`);
  expect(buildEvidenceUrl(revision, { path: 'docs/testing.md', startLine: 5 })).toBe(
    `${repositoryUrl}/blob/${revision}/docs/testing.md?plain=1#L5`,
  );
  expect(buildEvidenceUrl(revision, { path: 'docs/testing.md' })).toBe(
    `${repositoryUrl}/blob/${revision}/docs/testing.md`,
  );
  expect(
    buildEvidenceUrl(revision, {
      path: 'docs/testing.md',
      section: '## Available Checks',
    }),
  ).toBe(`${repositoryUrl}/blob/${revision}/docs/testing.md#available-checks`);
  expect(rangeUrl.indexOf('?plain=1')).toBeLessThan(rangeUrl.indexOf('#L5'));
  expect(buildEvidenceUrl('not-a-revision', { path: 'AGENTS.md' })).toContain('/blob/main/');
  expect(() =>
    buildEvidenceUrl(revision, { path: 'docs/testing.md', startLine: 13, endLine: 5 }),
  ).toThrow('citation line range must not be reversed');
});

test('generator preserves baseline scores, measures code units, and is idempotent', () => {
  withTemporaryReport((path) => {
    const stale = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const baseline = Object.fromEntries(
      stale.metrics.map((metric) => [metric.id, metric.assessed.score]),
    );
    const size = stale.metrics.find((metric) => metric.id === 'active-context-size')?.assessed;
    const precision = stale.metrics.find((metric) => metric.id === 'context-precision')?.assessed;
    if (!size?.details || !precision) throw new Error('required metrics missing');
    size.details.characters = 1;
    precision.score = 0;
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
    const generatedSize = generated.metrics.find(
      (metric) => metric.id === 'active-context-size',
    )?.assessed;
    expect(generatedSize?.details?.characters).toBe(expectedCharacters);
    expect(generatedSize?.details?.estimatedTokens).toBe(Math.ceil(expectedCharacters / 4));
    expect(generatedSize?.details?.estimationMethod).toContain('UTF-16 code units');
    expect(
      Object.fromEntries(generated.metrics.map((metric) => [metric.id, metric.assessed.score])),
    ).toEqual(baseline);
  });
});

test('prototype result names and stale measurements are rejected', () => {
  withTemporaryReport((path) => {
    const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const check = report.metrics.find((metric) => metric.assessed.checks)?.assessed.checks?.[0];
    if (!check) throw new Error('assessed check missing');
    check.result = 'toString' as Result;
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
    const result = runValidator(path);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('invalid result toString');
  });

  withTemporaryReport((path) => {
    const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
    const size = report.metrics.find((metric) => metric.id === 'active-context-size')?.assessed;
    if (!size?.details) throw new Error('size missing');
    size.details.measuredFiles[0].characters += 1;
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
    const result = runValidator(path);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('measuredFiles are stale');
  });
});

test('validator rejects invalid repository evidence metadata', () => {
  const cases = [
    {
      mutate: (citation: Citation) => {
        citation.path = 'docs/does-not-exist.md';
        delete citation.section;
        delete citation.startLine;
        delete citation.endLine;
      },
      message: 'evidence path does not exist at audited revision',
    },
    {
      mutate: (citation: Citation) => {
        citation.startLine = 12;
        citation.endLine = 11;
      },
      message: 'citation line range must not be reversed',
    },
    {
      mutate: (citation: Citation) => {
        citation.path = 'https://example.com/unsafe';
      },
      message: 'safe repository-relative path',
    },
  ];
  for (const fixture of cases) {
    withTemporaryReport((path) => {
      const report = JSON.parse(readFileSync(path, 'utf8')) as TestReport;
      const citation = report.metrics.find((metric) => metric.assessed.checks)?.assessed.checks?.[0]
        .evidence.citations[0];
      if (!citation) throw new Error('citation missing');
      fixture.mutate(citation);
      writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
      const result = runValidator(path);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(fixture.message);
    });
  }
});

test('page distinguishes static assessment, observed evidence, maturity, and coverage', async ({
  page,
}) => {
  const report = readReport();
  await page.goto(healthPath);
  await expect(page).toHaveTitle('Context Health: EricCarlisle.com');
  await expect(page.locator('.ch-page > h1')).toHaveText('Context Health: EricCarlisle.com');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /observed performance reported separately/,
  );
  await expect(
    page.getByText('Experimental methodology; no observed task performance yet.'),
  ).toBeVisible();
  await expect(page.locator('.ch-score')).toHaveCount(5);
  await expect(page.locator('.ch-score__observed')).toHaveText(
    Array(5).fill('Observed: Not yet measured'),
  );
  await expect(page.locator('.ch-profile')).toHaveCount(5);
  await expect(page.locator('.ch-profile .ch-status--not-evaluated')).toHaveCount(4);
  await expect(page.getByText(/No aggregate score is calculated/)).toBeVisible();
  await expect(page.getByText(/100% static score means only/)).toBeVisible();

  for (const metric of report.metrics) {
    const detail = page.locator('.ch-details details').filter({ hasText: metric.label });
    await detail.locator('summary').click();
    await expect(detail.getByRole('heading', { name: 'Static assessed' })).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'Observed performance' })).toBeVisible();
    await expect(detail.getByText('No observed evidence yet.')).toBeVisible();
    await expect(detail.getByText(/Evidence maturity:/)).toBeVisible();
  }
});

test('positive and negative source evidence links target the audited revision', async ({
  page,
}) => {
  const report = readReport();
  await page.goto(healthPath);
  for (const impact of ['positive', 'negative'] as const) {
    const check = report.metrics
      .flatMap((metric) => metric.assessed.checks ?? [])
      .find((candidate) => candidate.impact === impact);
    const citation = check?.evidence.citations[0];
    if (!citation) throw new Error(`${impact} citation missing`);
    const url = buildEvidenceUrl(report.repositoryRevision, citation);
    await expect(page.locator(`.ch-check--${impact} a[href="${url}"]`).first()).toBeAttached();
  }
});

test('narrative findings remain plain text', async ({ page }) => {
  const report = readReport();
  await page.goto(healthPath);
  await expect(page.locator('.ch-priority__recommendation')).toHaveCount(report.priorities.length);
  await expect(page.locator('.ch-overview a')).toHaveCount(0);
  await expect(page.locator('.ch-check__evidence a, .ch-check__interpretation a')).toHaveCount(0);
});

test('native disclosures work without JavaScript and feature scripts are absent', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(healthPath);
  const detail = page.locator('.ch-details details').first();
  await expect(detail).not.toHaveAttribute('open', '');
  await detail.locator('summary').click();
  await expect(detail).toHaveAttribute('open', '');
  await expect(page.locator('.ch-page input, .ch-page button, .ch-page select')).toHaveCount(0);
  const scriptSources = await page
    .locator('script[src]')
    .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src')));
  expect(scriptSources.filter((source) => /context|lab-context/i.test(source ?? ''))).toEqual([]);
  await context.close();
});

test('deployment workflow validates Context Health with full history before building', () => {
  const workflow = readFileSync('.github/workflows/astro.yml', 'utf8');
  expect(workflow).toContain('fetch-depth: 0');
  const validation = workflow.indexOf('run: pnpm context:health:validate');
  const build = workflow.indexOf('run: pnpm build');
  expect(validation).toBeGreaterThan(0);
  expect(validation).toBeLessThan(build);
});

test('Context Health CSS is page-only', async ({ page }) => {
  await page.goto(healthPath);
  const stylesheets = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  const contents = await Promise.all(
    stylesheets.map(async (href) => ({ href, css: await (await fetch(href)).text() })),
  );
  const contextAssets = contents.filter(({ css }) => css.includes('.ch-page'));
  expect(contextAssets).toHaveLength(1);
  for (const path of ['/', '/blog/250mm-trading-card-box/', '/search/']) {
    await page.goto(path);
    const linked = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
    expect(linked).not.toContain(contextAssets[0].href);
  }
});

test('ordinary pages do not load Sentry resources', async ({ page }) => {
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

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`${viewport.name} layout has no page overflow`, async ({ page }) => {
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
