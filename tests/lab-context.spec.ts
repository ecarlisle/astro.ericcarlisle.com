import { expect, test } from '@playwright/test';
import { analyzeContext, runFixtureAnalysis } from '../src/lab/context/engine';
import { DOCUMENTS, PRESETS, TASKS } from '../src/lab/context/fixtures';
import type { LabDocument } from '../src/lab/context/types';

const LAB_PATH = '/lab/context/';
const FIRST_CHECKBOX = '.doc-list__checkbox';
const METRIC_CARD = '.metric-card';

// ─── Engine: fixture-independent API ────────────────────────────────────────

test('analyzeContext with artificial task and docs produces exact precision', () => {
  const task = { id: 'test', title: 'Test', description: '', requirements: ['req-a'] };
  const docs = [
    {
      id: 'd1',
      title: 'Doc A',
      description: '',
      authority: 'high' as const,
      length: 1000,
      relevanceByTask: { test: 1.0 },
      covers: ['req-a'],
      authoritativeFor: [],
      conflictsWith: [],
    },
  ];
  const result = analyzeContext({ task, includedDocs: docs, availableDocs: docs });
  expect(result.precision.value).toBeCloseTo(1.0, 4);
  expect(result.sufficiency.value).toBeCloseTo(1.0, 4);
});

test('analyzeContext with zero-relevance docs gives zero precision', () => {
  const task = { id: 'test', title: 'Test', description: '', requirements: [] };
  const docs = [
    {
      id: 'd1',
      title: 'Doc A',
      description: '',
      authority: 'high' as const,
      length: 500,
      relevanceByTask: { test: 0.0 },
      covers: [],
      authoritativeFor: [],
      conflictsWith: [],
    },
  ];
  const result = analyzeContext({ task, includedDocs: docs, availableDocs: docs });
  expect(result.precision.value).toBeCloseTo(0, 4);
});

test('analyzeContext with null recall returns null with reason', () => {
  const task = { id: 'test', title: 'Test', description: '', requirements: [] };
  const docs: LabDocument[] = [];
  const result = analyzeContext({ task, includedDocs: [], availableDocs: docs });
  expect(result.recall.value).toBeNull();
  expect(result.recall.notApplicableReason).toBeTruthy();
});

// ─── Engine: continuous relevance (0.5 document contributes to numerator) ────

test('document with 0.5 relevance contributes proportionally to precision', () => {
  const task = { id: 'test', title: 'Test', description: '', requirements: [] };
  const docs = [
    {
      id: 'd1',
      title: 'Doc Half',
      description: '',
      authority: 'medium' as const,
      length: 1000,
      relevanceByTask: { test: 0.5 },
      covers: [],
      authoritativeFor: [],
      conflictsWith: [],
    },
  ];
  const result = analyzeContext({ task, includedDocs: docs, availableDocs: docs });
  // precision = (1000 * 0.5) / 1000 = 0.5
  expect(result.precision.value).toBeCloseTo(0.5, 4);
  // contributingDocs should include the doc
  expect(result.precision.contributingDocs).toContain('Doc Half');
  // explanation should describe the weighting
  expect(result.precision.explanation).toContain('0.5');
});

// ─── Engine: size-weighted precision ────────────────────────────────────────

test('size-weighted precision of relevant-only docs equals 1.0', () => {
  const result = runFixtureAnalysis('a11y', new Set(['doc-a11y-guidelines']));
  expect(result.precision.value).toBeCloseTo(1.0, 4);
});

test('size-weighted precision with irrelevant docs is below 1.0', () => {
  // doc-a11y-guidelines (relevance 1.0, 3200) + doc-tokens (relevance 0.0, 1800)
  // precision = (3200*1.0 + 1800*0.0) / (3200 + 1800) = 3200/5000 = 0.64
  const result = runFixtureAnalysis('a11y', new Set(['doc-a11y-guidelines', 'doc-tokens']));
  expect(result.precision.value).toBeCloseTo(0.64, 4);
});

test('size-weighted precision with no documents returns null', () => {
  const result = runFixtureAnalysis('a11y', new Set());
  expect(result.precision.value).toBeNull();
  expect(result.precision.notApplicableReason).toBeTruthy();
});

// ─── Engine: size-weighted recall ───────────────────────────────────────────

test('size-weighted recall of all available docs equals 1.0', () => {
  const allDocIds = new Set(DOCUMENTS.map((d) => d.id));
  const result = runFixtureAnalysis('tokens', allDocIds);
  expect(result.recall.value).toBeCloseTo(1.0, 4);
});

test('recall with no included documents is 0', () => {
  const result = runFixtureAnalysis('a11y', new Set());
  expect(result.recall.value).toBeCloseTo(0, 4);
});

// ─── Engine: sufficiency ────────────────────────────────────────────────────

test('sufficiency with all requirements covered equals 1.0', () => {
  const docIds = new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask.a11y ?? []);
  const result = runFixtureAnalysis('a11y', docIds);
  expect(result.sufficiency.value).toBeCloseTo(1.0, 4);
});

test('sufficiency with no documents equals 0', () => {
  const result = runFixtureAnalysis('a11y', new Set());
  expect(result.sufficiency.value).toBeCloseTo(0, 4);
});

// ─── Engine: authority clarity ──────────────────────────────────────────────

test('single authoritative doc with no conflict gives clear authority', () => {
  const result = runFixtureAnalysis('tokens', new Set(['doc-tokens']));
  expect(result.authorityClarity.value).toBeCloseTo(1.0, 4);
});

test('competing authoritative sources for same requirement reduce clarity', () => {
  const result = runFixtureAnalysis(
    'a11y',
    new Set(['doc-a11y-guidelines', 'doc-html-semantics', 'doc-legacy-a11y-notes']),
  );
  expect(result.authorityClarity.value).toBeCloseTo(0.8, 4);
});

test('conflicting docs for different requirements does not reduce clarity for unrelated reqs', () => {
  // doc-perf-budget and doc-legacy-perf-notes conflict on bundle-optimization only.
  // Other requirements have clear authority.
  const result = runFixtureAnalysis('perf', new Set(['doc-perf-budget', 'doc-legacy-perf-notes']));
  // Covered: bundle-optimization (ambiguous), image-optimization (clear),
  // font-loading (clear), css-minification (clear) = 3/4
  expect(result.authorityClarity.value).toBeCloseTo(0.75, 4);
});

test('authority clarity with no covered requirements returns null', () => {
  const result = runFixtureAnalysis('a11y', new Set(['doc-deploy']));
  expect(result.authorityClarity.value).toBeNull();
});

// ─── Engine: no curated preset has unresolved conflict ──────────────────────

test('no curated preset has an unresolved authoritative conflict', () => {
  for (const task of TASKS) {
    const curated = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.sufficiency.value).toBeCloseTo(1.0, 4);
    expect(curated.authorityClarity.value).toBeCloseTo(1.0, 4);
  }
});

// ─── Engine: context size ───────────────────────────────────────────────────

test('context size returns correct characters and estimated tokens', () => {
  const result = runFixtureAnalysis('tokens', new Set(['doc-tokens', 'doc-components']));
  expect(result.contextSize.chars).toBe(4400);
  expect(result.contextSize.estimatedTokens).toBe(1100);
});

test('context size with no documents is 0', () => {
  const result = runFixtureAnalysis('a11y', new Set());
  expect(result.contextSize.chars).toBe(0);
  expect(result.contextSize.estimatedTokens).toBe(0);
});

// ─── Engine: preset relationships ───────────────────────────────────────────

test('curated sufficiency >= minimal sufficiency for all tasks', () => {
  for (const task of TASKS) {
    const curated = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const minimal = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'minimal')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.sufficiency.value ?? 0).toBeGreaterThanOrEqual(minimal.sufficiency.value ?? 0);
  }
});

test('curated precision > overloaded precision for all tasks', () => {
  for (const task of TASKS) {
    const curated = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const overloaded = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.precision.value ?? 0).toBeGreaterThan(overloaded.precision.value ?? 0);
  }
});

test('curated authority >= overloaded authority for all tasks', () => {
  for (const task of TASKS) {
    const curated = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const overloaded = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.authorityClarity.value ?? 0).toBeGreaterThanOrEqual(
      overloaded.authorityClarity.value ?? 0,
    );
  }
});

test('curated authority clarity > overloaded for a11y and perf', () => {
  for (const taskId of ['a11y', 'perf']) {
    const curated = runFixtureAnalysis(
      taskId,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[taskId] ?? []),
    );
    const overloaded = runFixtureAnalysis(
      taskId,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[taskId] ?? []),
    );
    expect(curated.authorityClarity.value ?? 0).toBeGreaterThan(
      overloaded.authorityClarity.value ?? 0,
    );
  }
});

test('overloaded context size > curated > minimal', () => {
  for (const task of TASKS) {
    const o = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    const c = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const m = runFixtureAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'minimal')?.docIdsByTask[task.id] ?? []),
    );
    expect(o.contextSize.chars).toBeGreaterThan(c.contextSize.chars);
    expect(c.contextSize.chars).toBeGreaterThanOrEqual(m.contextSize.chars);
  }
});

// ─── Engine: determinism ────────────────────────────────────────────────────

test('same inputs produce same results', () => {
  const ids = new Set(['doc-a11y-guidelines', 'doc-html-semantics']);
  const first = runFixtureAnalysis('a11y', ids);
  const second = runFixtureAnalysis('a11y', ids);
  expect(first.precision.value).toBe(second.precision.value);
});

test('conflict handling is order-independent', () => {
  const r1 = runFixtureAnalysis('a11y', new Set(['doc-a11y-guidelines', 'doc-html-semantics']));
  const r2 = runFixtureAnalysis('a11y', new Set(['doc-html-semantics', 'doc-a11y-guidelines']));
  expect(r1.authorityClarity.value).toBe(r2.authorityClarity.value);
});

// ─── Route ──────────────────────────────────────────────────────────────────

test('the /lab/context/ route loads with correct heading', async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page.locator('h1')).toContainText('Context Lab');
  await expect(page).toHaveTitle(/Context Lab/);
});

test('the lab page has robots noindex metadata', async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

// ─── Native radio: task selector ────────────────────────────────────────────

test('task radio group uses native inputs', async ({ page }) => {
  await page.goto(LAB_PATH);
  const radios = page.locator('input[name="task"]');
  await expect(radios).toHaveCount(3);
  // First radio (a11y) should be checked by default
  await expect(radios.nth(0)).toBeChecked();
});

test('clicking a task label switches the radio selection', async ({ page }) => {
  await page.goto(LAB_PATH);
  const radios = page.locator('input[name="task"]');
  // Click the second task label
  await page.locator('input[name="task"]').nth(1).check({ force: true });
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(0)).not.toBeChecked();
});

test('arrow keys navigate the task radio group', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.waitForSelector('input[name="task"]');
  const radios = page.locator('input[name="task"]');
  // Native radio groups handle arrow keys automatically.
  // Click the first visible label to start.
  const firstLabel = page.locator('.task-list__item').first();
  await firstLabel.click();
  // ArrowDown should move to the next value
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
});

// ─── Native radio: preset selector ──────────────────────────────────────────

test('preset radio group uses native inputs', async ({ page }) => {
  await page.goto(LAB_PATH);
  const radios = page.locator('input[name="preset"]');
  await expect(radios).toHaveCount(3);
  // Default preset is 'curated' (index 1)
  await expect(radios.nth(1)).toBeChecked();
});

test('preset change updates document count', async ({ page }) => {
  await page.goto(LAB_PATH);
  // Curated (default): 2 docs
  let checked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(checked).toBe(2);

  // Switch to overloaded
  await page.locator('input[name="preset"]').nth(2).check({ force: true });
  checked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(checked).toBe(10);
});

// ─── Metric cards ───────────────────────────────────────────────────────────

test('all five metric cards are rendered when documents are selected', async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page.locator(METRIC_CARD)).toHaveCount(5);
});

test('each metric card has a toggleable explanation', async ({ page }) => {
  await page.goto(LAB_PATH);
  const toggles = page.locator('.metric-card__toggle');
  const count = await toggles.count();
  for (let i = 0; i < count; i++) {
    const toggle = toggles.nth(i);
    await expect(toggle).toContainText('Show explanation');
    await toggle.click();
    await expect(toggle).toContainText('Hide explanation');
  }
});

test('metrics update when task changes', async ({ page }) => {
  await page.goto(LAB_PATH);
  const initial = await page
    .locator('[data-metric-key="precision"]')
    .getAttribute('data-metric-value');
  await page.locator('input[name="task"]').nth(1).check({ force: true });
  const updated = await page
    .locator('[data-metric-key="precision"]')
    .getAttribute('data-metric-value');
  expect(updated).not.toBe(initial);
});

// ─── Authority clarity evidence ─────────────────────────────────────────────

test('authority clarity card displays a percentage or N/A', async ({ page }) => {
  await page.goto(LAB_PATH);
  const value = await page
    .locator('[data-metric-key="authority"]')
    .getAttribute('data-metric-value');
  expect(value).toMatch(/^\d+%$|^N\/A$/);
});

test('authority clarity shows key documents in explanation', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator('[data-metric-key="authority"] .metric-card__toggle').click();
  await expect(page.locator('[data-metric-key="authority"] .metric-card__detail')).toContainText(
    'key documents',
    { ignoreCase: true },
  );
});

// ─── Context size ───────────────────────────────────────────────────────────

test('context size displays chars and estimated tokens', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator('[data-metric-key="contextSize"] .metric-card__toggle').click();
  const detail = page.locator('[data-metric-key="contextSize"] .metric-card__detail');
  await expect(detail).toContainText('characters');
  await expect(detail).toContainText('tokens');
});

test('context size increases from curated to overloaded', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator('input[name="preset"]').nth(0).check({ force: true });
  const curatedVal = Number(
    (
      await page.locator('[data-metric-key="contextSize"]').getAttribute('data-metric-value')
    )?.replace(/,/g, ''),
  );
  await page.locator('input[name="preset"]').nth(2).check({ force: true });
  const overloadedVal = Number(
    (
      await page.locator('[data-metric-key="contextSize"]').getAttribute('data-metric-value')
    )?.replace(/,/g, ''),
  );
  expect(overloadedVal).toBeGreaterThan(curatedVal);
});

// ─── Toggle document ────────────────────────────────────────────────────────

test('toggling a document off updates metrics', async ({ page }) => {
  await page.goto(LAB_PATH);
  const initial = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  await page.locator(FIRST_CHECKBOX).first().uncheck();
  expect(await page.locator(`${FIRST_CHECKBOX}:checked`).count()).toBe(initial - 1);
});

// ─── Empty context ──────────────────────────────────────────────────────────

test('unchecking all documents shows N/A for precision', async ({ page }) => {
  await page.goto(LAB_PATH);
  const count = await page.locator(FIRST_CHECKBOX).count();
  for (let i = 0; i < count; i++) {
    await page.locator(FIRST_CHECKBOX).nth(i).uncheck();
  }
  expect(
    await page.locator('[data-metric-key="precision"]').getAttribute('data-metric-value'),
  ).toBe('N/A');
});

// ─── Keyboard accessibility ─────────────────────────────────────────────────

test('Tab reaches the task radio group and Arrow keys move selection', async ({ page }) => {
  await page.goto(LAB_PATH);
  const radios = page.locator('input[name="task"]');
  // Click the first label to start
  const firstLabel = page.locator('.task-list__item').first();
  await firstLabel.click();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
});

test('Tab reaches the preset radio group', async ({ page }) => {
  await page.goto(LAB_PATH);
  const presetRadios = page.locator('input[name="preset"]');
  // Tab through to presets
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Arrow right or down should move through presets
  await page.keyboard.press('ArrowDown');
  // Should have moved selection
  const checked = await presetRadios.evaluateAll((radios) =>
    radios.findIndex((r) => (r as HTMLInputElement).checked),
  );
  expect(checked).toBeGreaterThanOrEqual(0);
});

test('metric explanation toggle is keyboard accessible', async ({ page }) => {
  await page.goto(LAB_PATH);
  const toggle = page.locator('.metric-card__toggle').first();
  await toggle.focus();
  await expect(toggle).toBeFocused();
});

// ─── Axe ────────────────────────────────────────────────────────────────────

test('the lab page has no critical axe violations', async ({ page }) => {
  const AxeBuilder = await import('@axe-core/playwright').then((m) => m.default);
  await page.goto(LAB_PATH);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ─── JS isolation ───────────────────────────────────────────────────────────

test('homepage does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[src*="context"]')).toHaveCount(0);
  expect(await page.content()).not.toContain('lab/context');
});

test('a blog article does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/blog/250mm-trading-card-box/');
  await expect(page.locator('script[src*="context"]')).toHaveCount(0);
});

test('the search page does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/search/');
  await expect(page.locator('script[src*="context"]')).toHaveCount(0);
});
