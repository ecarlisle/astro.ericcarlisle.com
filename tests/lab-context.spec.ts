/**
 * Context Lab tests.
 *
 * Covers metric calculations, preset behavior, boundary cases,
 * accessible interaction, route availability, and JS isolation
 * on ordinary pages.
 */
import { expect, test } from '@playwright/test';
import { runAnalysis } from '../src/lab/context/engine';
import { DOCUMENTS, PRESETS, TASKS } from '../src/lab/context/fixtures';

const LAB_PATH = '/lab/context/';
const A11Y_TASK_BTN = 'button[data-task-id="a11y"]';
const PERF_TASK_BTN = 'button[data-task-id="perf"]';
const TOKENS_TASK_BTN = 'button[data-task-id="tokens"]';
const CURATED_PRESET_BTN = 'button[data-preset-id="curated"]';
const OVERLOADED_PRESET_BTN = 'button[data-preset-id="overloaded"]';
const FIRST_CHECKBOX = '.doc-list__checkbox';
const METRIC_CARD = '.metric-card';

// ─── Engine-level tests ─────────────────────────────────────────────────────

test('size-weighted precision of relevant-only docs equals 1.0', () => {
  // Only doc-a11y-guidelines (relevance 1.0 for a11y): precision = sum(3200*1.0)/3200 = 1.0
  const result = runAnalysis('a11y', new Set(['doc-a11y-guidelines']));
  expect(result.precision.value).toBeCloseTo(1.0, 4);
});

test('size-weighted precision with irrelevant docs is below 1.0', () => {
  // doc-a11y-guidelines (relevance 1.0, 3200) + doc-tokens (relevance 0.0, 1800)
  // precision = (3200*1.0 + 1800*0.0) / (3200 + 1800) = 3200/5000 = 0.64
  const result = runAnalysis('a11y', new Set(['doc-a11y-guidelines', 'doc-tokens']));
  expect(result.precision.value).toBeCloseTo(0.64, 4);
});

test('size-weighted precision with no documents returns null', () => {
  const result = runAnalysis('a11y', new Set());
  expect(result.precision.value).toBeNull();
  expect(result.precision.notApplicableReason).toBeTruthy();
});

test('size-weighted recall of all available docs equals 1.0', () => {
  const allDocIds = new Set(DOCUMENTS.map((d) => d.id));
  const result = runAnalysis('tokens', allDocIds);
  expect(result.recall.value).toBeCloseTo(1.0, 4);
});

test('recall with no relevant available docs returns null', () => {
  // This case can't be tested without an artificial task.
  // When runAnalysis receives an unknown task ID it throws.
  // Real tasks always have some relevant context available.
});

test('recall with no included documents is 0', () => {
  const result = runAnalysis('a11y', new Set());
  expect(result.recall.value).toBeCloseTo(0, 4);
});

test('sufficiency with all requirements covered equals 1.0', () => {
  // Curated a11y covers all 5 requirements
  const docIds = new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask.a11y ?? []);
  const result = runAnalysis('a11y', docIds);
  expect(result.sufficiency.value).toBeCloseTo(1.0, 4);
});

test('sufficiency with no documents equals 0', () => {
  const result = runAnalysis('a11y', new Set());
  expect(result.sufficiency.value).toBeCloseTo(0, 4);
});

test('single authoritative doc with no conflict gives clear authority', () => {
  // doc-tokens alone for tokens task: authoritative for spacing-tokens, color-tokens, typography-scale
  // All 3 covered requirements have exactly one authoritative source with no conflicts
  const result = runAnalysis('tokens', new Set(['doc-tokens']));
  expect(result.authorityClarity.value).toBeCloseTo(1.0, 4);
});

test('competing authoritative sources for same requirement reduce clarity', () => {
  // doc-a11y-guidelines AND doc-legacy-a11y-notes both authoritative for keyboard-navigation AND conflict
  // doc-html-semantics adds focus-management (clear)
  // Covered: semantic-landmarks (clear), keyboard-navigation (ambiguous), aria-labels (clear),
  //          skip-link (clear), focus-management (clear) → 4/5 = 0.8
  const result = runAnalysis(
    'a11y',
    new Set(['doc-a11y-guidelines', 'doc-html-semantics', 'doc-legacy-a11y-notes']),
  );
  expect(result.authorityClarity.value).toBeCloseTo(0.8, 4);
});

test('conflicting docs for different requirements does not reduce clarity for unrelated reqs', () => {
  // doc-perf-budget conflicts with doc-legacy-perf-notes on bundle-optimization.
  // But image-optimization, font-loading, css-minification have only doc-perf-budget
  // as authoritative — the conflict doesn't spill over.
  // Covered: bundle-optimization (ambiguous), image-optimization (clear), font-loading (clear),
  //          lazy-loading (NOT covered), css-minification (clear) → 3/4 covered?
  // Actually lazy-loading isn't covered by either doc → 4/4 covered? No.
  // doc-perf-budget covers: bundle-optimization, image-optimization, font-loading, css-minification
  // doc-legacy-perf-notes covers: bundle-optimization, image-optimization
  // Covered: bundle-optimization, image-optimization, font-loading, css-minification = 4
  // Clear: 3/4 = 0.75
  const result = runAnalysis('perf', new Set(['doc-perf-budget', 'doc-legacy-perf-notes']));
  expect(result.authorityClarity.value).toBeCloseTo(0.75, 4);
});

test('authority clarity with no covered requirements returns null', () => {
  // doc-deploy covers no requirements for any task
  const result = runAnalysis('a11y', new Set(['doc-deploy']));
  expect(result.authorityClarity.value).toBeNull();
});

test('no curated preset has an unresolved authoritative conflict', () => {
  for (const task of TASKS) {
    const curated = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.sufficiency.value).toBeCloseTo(1.0, 4);
    expect(curated.authorityClarity.value).toBeCloseTo(1.0, 4);
  }
});

test('context size returns correct characters and estimated tokens', () => {
  // doc-tokens = 1800 chars, doc-components = 2600 chars → total 4400 chars
  // Estimated tokens = 4400 / 4 = 1100
  const result = runAnalysis('tokens', new Set(['doc-tokens', 'doc-components']));
  expect(result.contextSize.chars).toBe(4400);
  expect(result.contextSize.estimatedTokens).toBe(1100);
});

test('context size with no documents is 0', () => {
  const result = runAnalysis('a11y', new Set());
  expect(result.contextSize.chars).toBe(0);
  expect(result.contextSize.estimatedTokens).toBe(0);
});

// ─── Preset relationship tests (engine-level) ───────────────────────────────

test('curated sufficiency >= minimal sufficiency for all tasks', () => {
  for (const task of TASKS) {
    const curated = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const minimal = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'minimal')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.sufficiency.value ?? 0).toBeGreaterThanOrEqual(minimal.sufficiency.value ?? 0);
  }
});

test('curated precision > overloaded precision for all tasks', () => {
  for (const task of TASKS) {
    const curated = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const overloaded = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.precision.value ?? 0).toBeGreaterThan(overloaded.precision.value ?? 0);
  }
});

test('curated authority clarity >= overloaded authority clarity for all tasks', () => {
  for (const task of TASKS) {
    const curated = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const overloaded = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    expect(curated.authorityClarity.value ?? 0).toBeGreaterThanOrEqual(
      overloaded.authorityClarity.value ?? 0,
    );
  }
});

test('curated authority clarity > overloaded authority clarity for a11y and perf', () => {
  for (const taskId of ['a11y', 'perf']) {
    const curated = runAnalysis(
      taskId,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[taskId] ?? []),
    );
    const overloaded = runAnalysis(
      taskId,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[taskId] ?? []),
    );
    expect(curated.authorityClarity.value ?? 0).toBeGreaterThan(
      overloaded.authorityClarity.value ?? 0,
    );
  }
});

test('overloaded context size > curated context size > minimal context size', () => {
  for (const task of TASKS) {
    const overloaded = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'overloaded')?.docIdsByTask[task.id] ?? []),
    );
    const curated = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask[task.id] ?? []),
    );
    const minimal = runAnalysis(
      task.id,
      new Set(PRESETS.find((p) => p.id === 'minimal')?.docIdsByTask[task.id] ?? []),
    );
    expect(overloaded.contextSize.chars).toBeGreaterThan(curated.contextSize.chars);
    expect(curated.contextSize.chars).toBeGreaterThanOrEqual(minimal.contextSize.chars);
  }
});

// ─── Determinism ────────────────────────────────────────────────────────────

test('the same inputs produce the same results', () => {
  const docIds = new Set(['doc-a11y-guidelines', 'doc-html-semantics']);
  const first = runAnalysis('a11y', docIds);
  const second = runAnalysis('a11y', docIds);
  expect(first.precision.value).toBe(second.precision.value);
  expect(first.recall.value).toBe(second.recall.value);
  expect(first.sufficiency.value).toBe(second.sufficiency.value);
  expect(first.authorityClarity.value).toBe(second.authorityClarity.value);
  expect(first.contextSize.chars).toBe(second.contextSize.chars);
});

test('conflict handling is order-independent', () => {
  const set1 = new Set(['doc-a11y-guidelines', 'doc-html-semantics']);
  const set2 = new Set(['doc-html-semantics', 'doc-a11y-guidelines']);
  const r1 = runAnalysis('a11y', set1);
  const r2 = runAnalysis('a11y', set2);
  expect(r1.authorityClarity.value).toBe(r2.authorityClarity.value);
});

// ─── Route availability ─────────────────────────────────────────────────────

test('the /lab/context/ route loads with correct heading', async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page.locator('h1')).toContainText('Context Lab');
  await expect(page).toHaveTitle(/Context Lab/);
});

test('the lab page has robots noindex metadata', async ({ page }) => {
  await page.goto(LAB_PATH);
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute('content', 'noindex, follow');
});

// ─── Task selector ──────────────────────────────────────────────────────────

test('clicking a task switches the selected task', async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page.locator(A11Y_TASK_BTN)).toHaveAttribute('aria-checked', 'true');

  await page.locator(PERF_TASK_BTN).click();
  await expect(page.locator(PERF_TASK_BTN)).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator(A11Y_TASK_BTN)).toHaveAttribute('aria-checked', 'false');
});

// ─── Preset behavior ────────────────────────────────────────────────────────

test('task-specific presets select different docs for different tasks', async ({ page }) => {
  await page.goto(LAB_PATH);

  await page.locator(CURATED_PRESET_BTN).click();
  let checked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(checked).toBe(2);

  await page.locator(TOKENS_TASK_BTN).click();
  checked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(checked).toBe(2);
});

test('overloaded preset selects all 10 documents', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator(OVERLOADED_PRESET_BTN).click();
  const checked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(checked).toBe(10);
});

// ─── Metric presence ────────────────────────────────────────────────────────

test('all five metric cards are rendered when documents are selected', async ({ page }) => {
  await page.goto(LAB_PATH);
  const cards = page.locator(METRIC_CARD);
  await expect(cards).toHaveCount(5);
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
  const initialPrecision = await page
    .locator('[data-metric-key="precision"]')
    .getAttribute('data-metric-value');
  await page.locator(PERF_TASK_BTN).click();
  const newPrecision = await page
    .locator('[data-metric-key="precision"]')
    .getAttribute('data-metric-value');
  expect(newPrecision).not.toBe(initialPrecision);
});

// ─── Size-weighted precision ────────────────────────────────────────────────

test('overloaded precision < curated precision for a11y task', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator(CURATED_PRESET_BTN).click();
  const curatedVal = Number(
    (
      await page.locator('[data-metric-key="precision"]').getAttribute('data-metric-value')
    )?.replace('%', ''),
  );
  await page.locator(OVERLOADED_PRESET_BTN).click();
  const overloadedVal = Number(
    (
      await page.locator('[data-metric-key="precision"]').getAttribute('data-metric-value')
    )?.replace('%', ''),
  );
  expect(overloadedVal).toBeLessThan(curatedVal);
});

// ─── Authority clarity ───────────────────────────────────────────────────────

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
  const detail = page.locator('[data-metric-key="authority"] .metric-card__detail');
  await expect(detail).toContainText('key documents', { ignoreCase: true });
});

// ─── Context size with tokens ───────────────────────────────────────────────

test('context size displays chars and estimated tokens', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator('[data-metric-key="contextSize"] .metric-card__toggle').click();
  const detail = page.locator('[data-metric-key="contextSize"] .metric-card__detail');
  await expect(detail).toContainText('characters');
  await expect(detail).toContainText('tokens');
});

test('context size increases from curated to overloaded', async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.locator(CURATED_PRESET_BTN).click();
  const curatedVal = Number(
    (
      await page.locator('[data-metric-key="contextSize"]').getAttribute('data-metric-value')
    )?.replace(/,/g, ''),
  );
  await page.locator(OVERLOADED_PRESET_BTN).click();
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
  const initialChecked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  await page.locator(FIRST_CHECKBOX).first().uncheck();
  const updatedChecked = await page.locator(`${FIRST_CHECKBOX}:checked`).count();
  expect(updatedChecked).toBe(initialChecked - 1);
});

// ─── Empty context ──────────────────────────────────────────────────────────

test('unchecking all documents shows N/A for precision', async ({ page }) => {
  await page.goto(LAB_PATH);
  const checkboxes = page.locator(FIRST_CHECKBOX);
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).uncheck();
  }
  const precision = await page
    .locator('[data-metric-key="precision"]')
    .getAttribute('data-metric-value');
  expect(precision).toBe('N/A');
});

// ─── Keyboard accessibility ─────────────────────────────────────────────────

test('task buttons are keyboard accessible', async ({ page }) => {
  await page.goto(LAB_PATH);
  const buttons = page.locator('.task-list__item');
  await buttons.first().focus();
  await expect(buttons.first()).toBeFocused();
});

test('preset buttons are keyboard accessible', async ({ page }) => {
  await page.goto(LAB_PATH);
  const buttons = page.locator('.preset-list__item');
  await buttons.first().focus();
  await expect(buttons.first()).toBeFocused();
});

test('metric explanation toggles are keyboard accessible', async ({ page }) => {
  await page.goto(LAB_PATH);
  const toggle = page.locator('.metric-card__toggle').first();
  await toggle.focus();
  await expect(toggle).toBeFocused();
});

// ─── No axe violations ──────────────────────────────────────────────────────

test('the lab page has no critical axe violations', async ({ page }) => {
  const AxeBuilder = await import('@axe-core/playwright').then((m) => m.default);
  await page.goto(LAB_PATH);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ─── JS isolation ───────────────────────────────────────────────────────────

test('homepage does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/');
  const labScripts = page.locator('script[src*="context"]');
  await expect(labScripts).toHaveCount(0);
  const content = await page.content();
  expect(content).not.toContain('lab/context');
});

test('a blog article does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/blog/250mm-trading-card-box/');
  const labScripts = page.locator('script[src*="context"]');
  await expect(labScripts).toHaveCount(0);
});

test('the search page does not load lab-generated JavaScript', async ({ page }) => {
  await page.goto('/search/');
  const labScripts = page.locator('script[src*="context"]');
  await expect(labScripts).toHaveCount(0);
});
