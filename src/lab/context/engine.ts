/**
 * Context Lab analysis engine.
 *
 * Pure computation — no DOM, no side effects.
 *
 * `analyzeContext` is fixture-independent — it accepts any task, included docs,
 * and available docs. It does not import fixture data.
 *
 * `runFixtureAnalysis` is a small wrapper for the browser controller that loads
 * fixture data and calls analyzeContext.
 */
import { DOCUMENTS, TASKS } from './fixtures';
import type {
  AnalysisInput,
  AnalysisResult,
  ContextSizeResult,
  LabDocument,
  LabTask,
  MetricResult,
} from './types';

/** Default chars-per-token approximation (English prose). */
const DEFAULT_CHARS_PER_TOKEN = 4;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Run a complete context-quality analysis from supplied input.
 * Does not import fixture data.
 */
export function analyzeContext(input: AnalysisInput): AnalysisResult {
  const { task, includedDocs, availableDocs, charsPerToken } = input;
  const cpt = charsPerToken ?? DEFAULT_CHARS_PER_TOKEN;

  return {
    precision: computePrecision(task, includedDocs),
    recall: computeRecall(task, includedDocs, availableDocs),
    sufficiency: computeSufficiency(task, includedDocs),
    authorityClarity: computeAuthorityClarity(task, includedDocs),
    contextSize: computeContextSize(includedDocs, cpt),
  };
}

/**
 * Fixture-backed analysis for the browser controller.
 * Loads tasks and documents from fixture data, then delegates to analyzeContext.
 */
export function runFixtureAnalysis(taskId: string, includedDocIds: Set<string>): AnalysisResult {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Unknown task: ${taskId}`);

  const includedDocs = DOCUMENTS.filter((d) => includedDocIds.has(d.id));
  const availableDocs = DOCUMENTS;

  return analyzeContext({ task, includedDocs, availableDocs });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightedRelevance(task: LabTask, docs: LabDocument[]): number {
  return docs.reduce((sum, d) => {
    const rel = d.relevanceByTask[task.id] ?? 0;
    return sum + d.length * rel;
  }, 0);
}

function totalChars(docs: LabDocument[]): number {
  return docs.reduce((sum, d) => sum + d.length, 0);
}

function docNames(docs: LabDocument[]): string[] {
  return docs.map((d) => d.title);
}

// ─── Precision ──────────────────────────────────────────────────────────────

/**
 * Size-weighted precision: fraction of the included-context size that
 * carries positive relevance for the task.
 *
 *   precision = Σ(included_size × relevance) / Σ(included_size)
 *
 * Every document with relevance > 0 contributes to the numerator.
 * Returns null when no documents are included.
 */
function computePrecision(task: LabTask, includedDocs: LabDocument[]): MetricResult {
  if (includedDocs.length === 0) {
    return {
      value: null,
      label: 'Context Precision',
      explanation: 'No documents are included. Precision cannot be calculated.',
      higherIsBetter: true,
      contributingDocs: [],
      notApplicableReason: 'No documents selected.',
    };
  }

  const numerator = weightedRelevance(task, includedDocs);
  const denominator = totalChars(includedDocs);
  const value = denominator > 0 ? numerator / denominator : 0;

  const contributing = includedDocs.filter((d) => (d.relevanceByTask[task.id] ?? 0) > 0);
  const zeroRelevance = includedDocs.filter((d) => (d.relevanceByTask[task.id] ?? 0) === 0);

  let explanation: string;
  if (contributing.length === 0) {
    explanation = 'No selected documents carry relevance for this task. Precision is 0%.';
  } else {
    const lines: string[] = [
      `What fraction of the selected context is relevant to "${task.title}"?`,
      `Each document is weighted by its character size and continuous relevance (0–1).`,
    ];
    for (const d of contributing) {
      const rel = d.relevanceByTask[task.id] ?? 0;
      lines.push(
        `  ${d.title}: ${d.length.toLocaleString()} chars × relevance ${rel.toFixed(1)} = ${(d.length * rel).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      );
    }
    if (zeroRelevance.length > 0) {
      lines.push(
        `Zero-relevance documents: ${zeroRelevance.map((d) => d.title).join(', ')} (contribute 0 to numerator but still add to denominator).`,
      );
    }
    lines.push(
      `Precision = weighted relevance sum (${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ÷ total chars (${denominator.toLocaleString()}) = ${(value * 100).toFixed(1)}%.`,
    );
    explanation = lines.join(' ');
  }

  return {
    value,
    label: 'Context Precision',
    explanation,
    higherIsBetter: true,
    contributingDocs: docNames(contributing),
  };
}

// ─── Recall ─────────────────────────────────────────────────────────────────

/**
 * Size-weighted recall: fraction of all available relevant context
 * that was retrieved.
 *
 *   recall = Σ(included_size × relevance) / Σ(available_size × relevance)
 *
 * Every document with relevance > 0 contributes to both numerator
 * and denominator. Returns null when no weight exists in the repository.
 */
function computeRecall(
  task: LabTask,
  includedDocs: LabDocument[],
  availableDocs: LabDocument[],
): MetricResult {
  const numerator = weightedRelevance(task, includedDocs);
  const denominator = weightedRelevance(task, availableDocs);

  if (denominator === 0) {
    return {
      value: null,
      label: 'Context Recall',
      explanation:
        'No documents in the repository carry relevance for this task. Recall is undefined.',
      higherIsBetter: true,
      contributingDocs: [],
      notApplicableReason: 'No relevant documents exist in the repository.',
    };
  }

  const value = numerator / denominator;

  const contributing = includedDocs.filter((d) => (d.relevanceByTask[task.id] ?? 0) > 0);
  const relevantAvailable = availableDocs.filter((d) => (d.relevanceByTask[task.id] ?? 0) > 0);
  const missing = relevantAvailable.filter((d) => !contributing.some((c) => c.id === d.id));

  const parts: string[] = [
    `How much of the available relevant context is included?`,
    `Of ${relevantAvailable.length} documents with positive relevance for this task, ${contributing.length} are selected.`,
  ];
  if (missing.length > 0) {
    parts.push(
      `Missing documents: ${missing.map((d) => `${d.title} (relevance ${(d.relevanceByTask[task.id] ?? 0).toFixed(1)})`).join('; ')}.`,
    );
  }
  parts.push(
    `Recall = included relevant weight (${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ÷ total relevant weight (${denominator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) = ${(value * 100).toFixed(1)}%.`,
  );

  return {
    value,
    label: 'Context Recall',
    explanation: parts.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(contributing),
  };
}

// ─── Sufficiency ────────────────────────────────────────────────────────────

/**
 * Requirement-coverage sufficiency.
 *
 *   sufficiency = covered_requirements / total_requirements
 */
function computeSufficiency(task: LabTask, includedDocs: LabDocument[]): MetricResult {
  const total = task.requirements.length;

  if (includedDocs.length === 0 || total === 0) {
    return {
      value: 0,
      label: 'Sufficiency',
      explanation:
        total === 0
          ? 'The task has no requirements defined.'
          : 'No documents are included. No requirements are covered.',
      higherIsBetter: true,
      contributingDocs: [],
    };
  }

  const covered = task.requirements.filter((req) =>
    includedDocs.some((doc) => doc.covers.includes(req)),
  );
  const coveredCount = covered.length;
  const uncovered = task.requirements.filter(
    (req) => !includedDocs.some((doc) => doc.covers.includes(req)),
  );
  const value = coveredCount / total;

  const lines: string[] = [
    `How many of the task requirements are addressed by selected documents? ${coveredCount} of ${total} requirements are covered. Sufficiency = ${coveredCount} ÷ ${total} = ${(value * 100).toFixed(0)}%.`,
  ];
  if (covered.length > 0) {
    const details = covered.map((req) => {
      const doc = includedDocs.find((d) => d.covers.includes(req));
      return `${req.replace(/-/g, ' ')} → ${doc?.title ?? 'unknown'}`;
    });
    lines.push(`Covered: ${details.join('; ')}.`);
  }
  if (uncovered.length > 0) {
    lines.push(`Not covered: ${uncovered.map((r) => r.replace(/-/g, ' ')).join(', ')}.`);
  }

  return {
    value,
    label: 'Sufficiency',
    explanation: lines.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(
      includedDocs.filter((d) => d.covers.some((c) => task.requirements.includes(c))),
    ),
  };
}

// ─── Authority clarity ──────────────────────────────────────────────────────

const TIER_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

/**
 * Authority clarity: for covered requirements, what fraction have an
 * unambiguous authoritative source at the highest applicable authority tier?
 *
 * For each covered requirement:
 * 1. Find included docs claiming authority for it.
 * 2. Determine the highest authority tier present.
 * 3. Among docs at that highest tier, check for conflicts.
 * 4. Multiple conflicting docs at the same highest tier → ambiguous.
 * 5. Lower-tier docs do not override a clear higher-tier source.
 *
 * Returns null when no requirements are covered.
 */
function computeAuthorityClarity(task: LabTask, includedDocs: LabDocument[]): MetricResult {
  const covered = task.requirements.filter((req) =>
    includedDocs.some((doc) => doc.covers.includes(req)),
  );

  if (covered.length === 0) {
    return {
      value: null,
      label: 'Authority Clarity',
      explanation:
        'No requirements are covered by selected documents. Authority clarity cannot be assessed.',
      higherIsBetter: true,
      contributingDocs: [],
      notApplicableReason: 'No requirements are covered.',
    };
  }

  const clearReqs: string[] = [];
  const ambiguousReqs: Array<{ req: string; reason: string }> = [];

  for (const req of covered) {
    const authoritative = includedDocs.filter((d) => d.authoritativeFor.includes(req));

    if (authoritative.length === 0) {
      ambiguousReqs.push({
        req,
        reason: `No authoritative source covers "${req.replace(/-/g, ' ')}".`,
      });
      continue;
    }

    // Find the highest tier present
    const maxTier = Math.max(...authoritative.map((d) => TIER_ORDER[d.authority] ?? 0));
    const topTier = authoritative.filter((d) => TIER_ORDER[d.authority] === maxTier);

    // Check conflicts only among top-tier docs
    const conflict = topTier.some((a) =>
      topTier.some(
        (b) => b.id !== a.id && (a.conflictsWith.includes(b.id) || b.conflictsWith.includes(a.id)),
      ),
    );

    if (!conflict && topTier.length >= 1) {
      clearReqs.push(req);
    } else {
      const names = topTier.map((d) => d.title).join(', ');
      ambiguousReqs.push({
        req,
        reason: `Competing authority on "${req.replace(/-/g, ' ')}" among top-tier documents: ${names}.`,
      });
    }
  }

  const value = covered.length > 0 ? clearReqs.length / covered.length : 0;

  const parts: string[] = [
    `Of ${covered.length} covered requirements, ${clearReqs.length} have clear authority and ${ambiguousReqs.length} are ambiguous or conflicting. Clarity = ${clearReqs.length} ÷ ${covered.length} = ${(value * 100).toFixed(0)}%.`,
  ];
  if (clearReqs.length > 0)
    parts.push(`Clear: ${clearReqs.map((r) => r.replace(/-/g, ' ')).join(', ')}.`);
  if (ambiguousReqs.length > 0) parts.push(ambiguousReqs.map((a) => a.reason).join(' '));

  return {
    value,
    label: 'Authority Clarity',
    explanation: parts.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(
      includedDocs.filter((d) => d.authoritativeFor.some((a) => task.requirements.includes(a))),
    ),
  };
}

// ─── Context size ───────────────────────────────────────────────────────────

/**
 * Active context size.
 *
 * Token estimate uses charsPerToken (default 4 for English prose).
 */
function computeContextSize(includedDocs: LabDocument[], charsPerToken: number): ContextSizeResult {
  const chars = includedDocs.reduce((sum, d) => sum + d.length, 0);
  const estimatedTokens = Math.round(chars / charsPerToken);

  return {
    chars,
    estimatedTokens,
    label: 'Active Context Size',
    explanation: [
      `Total size across ${includedDocs.length} document${includedDocs.length !== 1 ? 's' : ''}: ${chars.toLocaleString()} characters, approximately ${estimatedTokens.toLocaleString()} tokens (estimated at 1 token ≈ ${charsPerToken} characters for English prose, not a real tokenizer).`,
      `Interpret alongside precision, recall, and sufficiency — larger context with high precision is better than small context with low sufficiency.`,
    ].join(' '),
    contributingDocs: docNames(includedDocs),
  };
}
