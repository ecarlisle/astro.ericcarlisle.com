/**
 * Context Lab analysis engine — pure computation, no fixture imports.
 *
 * `analyzeContext` is fixture-independent. It accepts any task, included docs,
 * and available docs. It does not import fixture data.
 */
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

// ─── Input validation ───────────────────────────────────────────────────────

function validateInput(input: AnalysisInput): void {
  const { task, includedDocs, availableDocs, charsPerToken } = input;

  // charsPerToken must be positive and finite
  if (charsPerToken !== undefined) {
    if (
      typeof charsPerToken !== 'number' ||
      !Number.isFinite(charsPerToken) ||
      charsPerToken <= 0
    ) {
      throw new Error(`charsPerToken must be a positive finite number, got ${charsPerToken}`);
    }
  }

  // Document lengths must be finite and nonnegative
  for (const doc of [...includedDocs, ...availableDocs]) {
    if (typeof doc.length !== 'number' || !Number.isFinite(doc.length) || doc.length < 0) {
      throw new Error(`Document "${doc.id}" has invalid length: ${doc.length}`);
    }
  }

  // Available doc IDs must be unique
  const availableIds = availableDocs.map((d) => d.id);
  if (new Set(availableIds).size !== availableIds.length) {
    throw new Error('availableDocs contains duplicate document IDs');
  }

  // Included doc IDs must be unique
  const includedIds = includedDocs.map((d) => d.id);
  if (new Set(includedIds).size !== includedIds.length) {
    throw new Error('includedDocs contains duplicate document IDs');
  }

  // Every included doc must exist in available docs
  const availableIdSet = new Set(availableIds);
  for (const doc of includedDocs) {
    if (!availableIdSet.has(doc.id)) {
      throw new Error(`Included document "${doc.id}" is not present in availableDocs`);
    }
  }

  // Relevance values must be finite and between 0 and 1
  for (const doc of [...includedDocs, ...availableDocs]) {
    const rel = doc.relevanceByTask[task.id];
    if (rel !== undefined) {
      if (typeof rel !== 'number' || !Number.isFinite(rel) || rel < 0 || rel > 1) {
        throw new Error(`Document "${doc.id}" has invalid relevance for task "${task.id}": ${rel}`);
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Run a complete context-quality analysis from supplied input.
 * Validates inputs before computing. Does not import fixture data.
 */
export function analyzeContext(input: AnalysisInput): AnalysisResult {
  validateInput(input);

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
 * Size-weighted precision: Σ(included_size × relevance) / Σ(included_size)
 * Returns null when no documents are included.
 * Guaranteed to be 0–1 when inputs are valid.
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
  const zero = includedDocs.filter((d) => (d.relevanceByTask[task.id] ?? 0) === 0);

  const lines: string[] = [
    `What fraction of the selected context is relevant to "${task.title}"?`,
    `Each document is weighted by character size × continuous relevance (0–1).`,
  ];
  for (const d of contributing) {
    const rel = d.relevanceByTask[task.id] ?? 0;
    const weighted = (d.length * rel).toLocaleString(undefined, { maximumFractionDigits: 0 });
    lines.push(
      `  ${d.title}: ${d.length.toLocaleString()} chars × ${rel.toFixed(1)} = ${weighted}`,
    );
  }
  if (zero.length > 0) {
    lines.push(
      `Zero-relevance: ${zero.map((d) => d.title).join(', ')} (add 0 to numerator, add to denominator).`,
    );
  }
  lines.push(
    `Precision = ${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ ${denominator.toLocaleString()} = ${(value * 100).toFixed(1)}%.`,
  );

  return {
    value,
    label: 'Context Precision',
    explanation: lines.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(contributing),
  };
}

// ─── Recall ─────────────────────────────────────────────────────────────────

/**
 * Size-weighted recall: Σ(included × relevance) / Σ(available × relevance)
 * Returns null when denominator is zero.
 * Guaranteed to be 0–1 when inputs are valid (included ⊆ available).
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
    `Of ${relevantAvailable.length} documents with positive relevance, ${contributing.length} are selected.`,
  ];
  if (missing.length > 0) {
    parts.push(
      `Missing: ${missing.map((d) => `${d.title} (relevance ${(d.relevanceByTask[task.id] ?? 0).toFixed(1)})`).join('; ')}.`,
    );
  }
  parts.push(
    `Recall = ${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ ${denominator.toLocaleString(undefined, { maximumFractionDigits: 0 })} = ${(value * 100).toFixed(1)}%.`,
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
  const uncovered = task.requirements.filter(
    (req) => !includedDocs.some((doc) => doc.covers.includes(req)),
  );
  const value = covered.length / total;

  const lines: string[] = [
    `${covered.length} of ${total} requirements are covered. Sufficiency = ${covered.length} ÷ ${total} = ${(value * 100).toFixed(0)}%.`,
  ];
  if (covered.length > 0) {
    lines.push(
      `Covered: ${covered.map((req) => `${req.replace(/-/g, ' ')} → ${includedDocs.find((d) => d.covers.includes(req))?.title ?? '?'}`).join('; ')}.`,
    );
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

function computeAuthorityClarity(task: LabTask, includedDocs: LabDocument[]): MetricResult {
  const covered = task.requirements.filter((req) =>
    includedDocs.some((doc) => doc.covers.includes(req)),
  );

  if (covered.length === 0) {
    return {
      value: null,
      label: 'Authority Clarity',
      explanation: 'No requirements are covered. Authority clarity cannot be assessed.',
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

    const maxTier = Math.max(...authoritative.map((d) => TIER_ORDER[d.authority] ?? 0));
    const topTier = authoritative.filter((d) => TIER_ORDER[d.authority] === maxTier);

    const conflict = topTier.some((a) =>
      topTier.some(
        (b) => b.id !== a.id && (a.conflictsWith.includes(b.id) || b.conflictsWith.includes(a.id)),
      ),
    );

    if (!conflict && topTier.length >= 1) {
      clearReqs.push(req);
    } else {
      ambiguousReqs.push({
        req,
        reason: `Competing authority on "${req.replace(/-/g, ' ')}" among top-tier docs: ${topTier.map((d) => d.title).join(', ')}.`,
      });
    }
  }

  const value = covered.length > 0 ? clearReqs.length / covered.length : 0;

  const parts: string[] = [
    `${clearReqs.length} of ${covered.length} covered requirements have clear authority. Clarity = ${clearReqs.length} ÷ ${covered.length} = ${(value * 100).toFixed(0)}%.`,
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

function computeContextSize(includedDocs: LabDocument[], charsPerToken: number): ContextSizeResult {
  const chars = includedDocs.reduce((sum, d) => sum + d.length, 0);
  const estimatedTokens = Math.round(chars / charsPerToken);

  return {
    chars,
    estimatedTokens,
    label: 'Active Context Size',
    explanation: [
      `${includedDocs.length} document${includedDocs.length !== 1 ? 's' : ''}: ${chars.toLocaleString()} characters, ~${estimatedTokens.toLocaleString()} tokens (≈${charsPerToken} chars/token for English prose, not a real tokenizer).`,
      `Interpret alongside precision, recall, and sufficiency.`,
    ].join(' '),
    contributingDocs: docNames(includedDocs),
  };
}
