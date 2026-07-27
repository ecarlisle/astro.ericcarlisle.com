/**
 * Context Lab UI controller.
 *
 * Wires the analysis engine to the DOM. Handles state, rendering,
 * and event binding. All state is local to this module.
 */
import { runFixtureAnalysis } from './engine';
import { DOCUMENTS, PRESETS, TASKS } from './fixtures';
import type { ContextSizeResult, LabState, MetricResult } from './types';

const state: LabState = {
  selectedTaskId: 'a11y',
  selectedPresetId: 'curated',
  includedDocIds: new Set(PRESETS.find((p) => p.id === 'curated')?.docIdsByTask.a11y ?? []),
  expandedMetrics: new Set(),
};

const TASK_SEL = '#step-task';
const PRESET_SEL = '#step-preset';
const DOCS_SEL = '#step-docs';
const METRICS_SEL = '#step-results';

function $(sel: string): HTMLElement | null {
  return document.querySelector(sel);
}

export function initialize(): void {
  renderAll();
}

function renderAll(): void {
  renderTaskSelector();
  renderPresetSelector();
  renderDocList();
  renderMetrics();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPct(v: number | null): string {
  if (v === null) return 'N/A';
  return `${(v * 100).toFixed(0)}%`;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

// ─── Task selector ──────────────────────────────────────────────────────────

function renderTaskSelector(): void {
  const container = $(TASK_SEL);
  if (!container) return;

  const currentTask = TASKS.find((t) => t.id === state.selectedTaskId);

  container.innerHTML = `
    <fieldset class="task-list">
      <legend class="step__heading">1. Select a task</legend>
      ${TASKS.map(
        (t) => `
        <label class="task-list__item${t.id === state.selectedTaskId ? ' task-list__item--selected' : ''}">
          <input type="radio" name="task" value="${t.id}"${t.id === state.selectedTaskId ? ' checked' : ''} class="task-list__radio" />
          <span class="task-list__content">
            <span class="task-list__item-title">${t.title}</span>
            <span class="task-list__item-desc">${t.description}</span>
          </span>
        </label>
      `,
      ).join('')}
    </fieldset>
    ${
      currentTask
        ? `<p class="step__note">Requirements: ${currentTask.requirements.map((r) => r.replace(/-/g, ' ')).join(' · ')}</p>`
        : ''
    }
  `;

  container.querySelectorAll('input[name="task"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const id = (e.target as HTMLInputElement).value;
      if (!id || id === state.selectedTaskId) return;
      state.selectedTaskId = id;
      applyPreset(state.selectedPresetId || 'curated');
      renderAll();
    });
  });
}

// ─── Preset selector ────────────────────────────────────────────────────────

function renderPresetSelector(): void {
  const container = $(PRESET_SEL);
  if (!container) return;

  container.innerHTML = `
    <fieldset class="preset-list">
      <legend class="step__heading">2. Choose a preset</legend>
      <p class="step__hint">
        Presets define which documents are included for the selected task.
        The same preset selects different documents for different tasks.
        You can also toggle individual documents below.
      </p>
      ${PRESETS.map((p) => {
        const docs = p.docIdsByTask[state.selectedTaskId] ?? [];
        return `
        <label class="preset-list__item${p.id === state.selectedPresetId ? ' preset-list__item--selected' : ''}">
          <input type="radio" name="preset" value="${p.id}"${p.id === state.selectedPresetId ? ' checked' : ''} class="preset-list__radio" />
          <span class="preset-list__content">
            <span class="preset-list__item-label">${p.label}</span>
            <span class="preset-list__item-desc">${p.description}</span>
            <span class="preset-list__item-count">${docs.length} documents for this task</span>
          </span>
        </label>
      `;
      }).join('')}
    </fieldset>
  `;

  container.querySelectorAll('input[name="preset"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const id = (e.target as HTMLInputElement).value;
      if (!id || id === state.selectedPresetId) return;
      applyPreset(id);
      renderAll();
    });
  });
}

function applyPreset(presetId: string): void {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return;
  state.selectedPresetId = presetId;
  state.includedDocIds = new Set(preset.docIdsByTask[state.selectedTaskId] ?? []);
}

// ─── Document list ──────────────────────────────────────────────────────────

function renderDocList(): void {
  const container = $(DOCS_SEL);
  if (!container) return;

  const taskId = state.selectedTaskId;

  container.innerHTML = `
    <h2 class="step__heading">3. Review included documents</h2>
    <p class="step__hint">Toggle documents to include or exclude them from the context.</p>
    <ul class="doc-list" aria-label="Context documents">
      ${DOCUMENTS.map((doc) => {
        const isIncluded = state.includedDocIds.has(doc.id);
        const relevance = doc.relevanceByTask[taskId] ?? 0;
        const isRelevant = relevance >= 0.6;
        return `
          <li class="doc-list__item${isIncluded ? ' doc-list__item--included' : ''}">
            <label class="doc-list__label">
              <input
                type="checkbox"
                class="doc-list__checkbox"
                data-doc-id="${doc.id}"
                ${isIncluded ? 'checked' : ''}
              />
              <span class="doc-list__info">
                <span class="doc-list__title">${doc.title}</span>
                <span class="doc-list__meta">
                  ${doc.description}
                  <span class="doc-list__badge doc-list__badge--${doc.authority}">${doc.authority}</span>
                  <span class="doc-list__relevance${isRelevant ? ' doc-list__relevance--relevant' : ''}">
                    relevance ${relevance.toFixed(1)}
                  </span>
                  <span class="doc-list__size">${doc.length.toLocaleString()} chars</span>
                </span>
              </span>
            </label>
          </li>
        `;
      }).join('')}
    </ul>
    <p class="step__note">${state.includedDocIds.size} document${state.includedDocIds.size !== 1 ? 's' : ''} selected.</p>
  `;

  container.querySelectorAll('.doc-list__checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const checkbox = e.target as HTMLInputElement;
      const docId = checkbox.dataset.docId;
      if (!docId) return;
      if (checkbox.checked) {
        state.includedDocIds.add(docId);
      } else {
        state.includedDocIds.delete(docId);
      }
      state.selectedPresetId = '';
      renderDocList();
      renderMetrics();
    });
  });
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function renderMetrics(): void {
  const container = $(METRICS_SEL);
  if (!container) return;

  const result = runFixtureAnalysis(state.selectedTaskId, state.includedDocIds);

  container.innerHTML = `
    <h2 class="step__heading">4. Context quality metrics</h2>
    <p class="step__hint">
      These metrics model how well the selected context serves the chosen task. They are an
      educational approximation and do not measure actual agent behavior.
    </p>
    <div class="metrics-grid">
      ${renderMetricCard('precision', result.precision)}
      ${renderMetricCard('recall', result.recall)}
      ${renderMetricCard('sufficiency', result.sufficiency)}
      ${renderMetricCard('authority', result.authorityClarity)}
      ${renderSizeCard(result.contextSize)}
    </div>
  `;

  container.querySelectorAll('.metric-card__toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const card = (e.currentTarget as HTMLElement).closest('.metric-card');
      if (!card) return;
      const key = card.getAttribute('data-metric-key');
      if (!key) return;

      if (state.expandedMetrics.has(key)) {
        state.expandedMetrics.delete(key);
      } else {
        state.expandedMetrics.add(key);
      }
      renderMetrics();
    });
  });
}

function renderMetricCard(key: string, metric: MetricResult): string {
  const isExpanded = state.expandedMetrics.has(key);
  const pct = formatPct(metric.value);
  const isNA = metric.value === null;

  return `
    <div class="metric-card" data-metric-key="${key}" data-metric-value="${pct}">
      <div class="metric-card__header">
        <div class="metric-card__value">
          <span class="metric-card__number${isNA ? ' metric-card__number--na' : ''}">${pct}</span>
          ${
            isNA
              ? ''
              : `
          <span class="metric-card__bar" role="presentation">
            <span class="metric-card__bar-fill" style="width: ${((metric.value as number) * 100).toFixed(0)}%"></span>
          </span>`
          }
        </div>
        <h3 class="metric-card__label">${metric.label}</h3>
      </div>
      ${isNA ? `<p class="metric-card__na-note">${metric.notApplicableReason ?? 'Not applicable for the current configuration.'}</p>` : ''}
      <button
        class="metric-card__toggle"
        aria-expanded="${isExpanded}"
        aria-controls="metric-detail-${key}"
      >
        ${isExpanded ? 'Hide explanation' : 'Show explanation'}
      </button>
      <div
        id="metric-detail-${key}"
        class="metric-card__detail"
        ${isExpanded ? '' : 'hidden'}
      >
        <p class="metric-card__explanation">${metric.explanation}</p>
        ${metric.contributingDocs.length > 0 ? `<p class="metric-card__docs"><strong>Key documents:</strong> ${metric.contributingDocs.join(', ')}.</p>` : ''}
        <p class="metric-card__direction">${metric.higherIsBetter ? '↑ Higher is generally better' : '↓ Lower is generally better'}</p>
        <p class="metric-card__improve"><strong>To improve:</strong> ${suggestImprovement(key, metric)}</p>
      </div>
    </div>
  `;
}

function renderSizeCard(metric: ContextSizeResult): string {
  const isExpanded = state.expandedMetrics.has('contextSize');

  return `
    <div class="metric-card" data-metric-key="contextSize" data-metric-value="${formatNum(metric.chars)}">
      <div class="metric-card__header">
        <div class="metric-card__value metric-card__value--size">
          <span class="metric-card__number metric-card__number--size">${formatNum(metric.chars)}</span>
          <span class="metric-card__label--sub">chars</span>
          <span class="metric-card__number metric-card__number--size">~${formatNum(metric.estimatedTokens)}</span>
          <span class="metric-card__label--sub">estimated tokens</span>
        </div>
        <h3 class="metric-card__label">${metric.label}</h3>
      </div>
      <button
        class="metric-card__toggle"
        aria-expanded="${isExpanded}"
        aria-controls="metric-detail-contextSize"
      >
        ${isExpanded ? 'Hide explanation' : 'Show explanation'}
      </button>
      <div
        id="metric-detail-contextSize"
        class="metric-card__detail"
        ${isExpanded ? '' : 'hidden'}
      >
        <p class="metric-card__explanation">${metric.explanation}</p>
        ${metric.contributingDocs.length > 0 ? `<p class="metric-card__docs"><strong>Documents:</strong> ${metric.contributingDocs.join(', ')}.</p>` : ''}
        <p class="metric-card__direction">Interpret with precision, recall, and sufficiency — larger contexts need justification.</p>
      </div>
    </div>
  `;
}

function suggestImprovement(key: string, metric: MetricResult): string {
  const v = metric.value;
  switch (key) {
    case 'precision':
      return v !== null && v < 0.5
        ? 'Remove documents with low relevance to the task.'
        : 'Current precision is adequate. Focus on recall and sufficiency.';
    case 'recall':
      return v !== null && v < 0.7
        ? 'Include additional relevant documents that are currently missing.'
        : 'Most relevant documents are included.';
    case 'sufficiency':
      return v !== null && v < 1
        ? 'Include documents that cover the uncovered requirements.'
        : 'All task requirements are covered.';
    case 'authority':
      return v !== null && v < 0.8
        ? 'Remove conflicting sources or ensure a single authoritative document covers each requirement.'
        : 'Authority is clear for most covered requirements.';
    default:
      return 'Adjust the document selection and re-evaluate.';
  }
}
