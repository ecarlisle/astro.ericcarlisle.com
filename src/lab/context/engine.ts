/**
 * Context Lab analysis engine.
 *
 * Pure computation — no DOM, no side effects. Produces deterministic
 * metric results from fixture data and an included document set.
 *
 * These metrics are an educational model of agent context quality.
 * They do not measure actual agent behavior or LLM output.
 */
import { CHARS_PER_TOKEN, DOCUMENTS, RELEVANCE_THRESHOLD, TASKS } from './fixtures';
import type {
  AnalysisResult,
  ContextSizeResult,
  LabDocument,
  LabTask,
  MetricResult,
} from './types';

/**
 * Run a complete context-quality analysis.
 */
export function runAnalysis(taskId: string, includedDocIds: Set<string>): AnalysisResult {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Unknown task: ${taskId}`);
  }

  const includedDocs = DOCUMENTS.filter((d) => includedDocIds.has(d.id));
  const allDocs = DOCUMENTS;

  return {
    precision: computePrecision(task, includedDocs),
    recall: computeRecall(task, includedDocs, allDocs),
    sufficiency: computeSufficiency(task, includedDocs),
    authorityClarity: computeAuthorityClarity(task, includedDocs),
    contextSize: computeContextSize(includedDocs),
  };
}

/** Docs with relevance >= threshold for a given task. */
function relevantDocs(task: LabTask, docs: LabDocument[]): LabDocument[] {
  return docs.filter((d) => (d.relevanceByTask[task.id] ?? 0) >= RELEVANCE_THRESHOLD);
}

/** Sum of (char length × relevance) for the given docs and task. */
function weightedRelevance(task: LabTask, docs: LabDocument[]): number {
  return docs.reduce((sum, d) => {
    const rel = d.relevanceByTask[task.id] ?? 0;
    return sum + d.length * rel;
  }, 0);
}

/** Sum of raw char lengths. */
function totalChars(docs: LabDocument[]): number {
  return docs.reduce((sum, d) => sum + d.length, 0);
}

/** Names of docs as a formatted list. */
function docNames(docs: LabDocument[]): string[] {
  return docs.map((d) => d.title);
}

// ─── Precision ──────────────────────────────────────────────────────────────

/**
 * Size-weighted precision: fraction of the included-context size that is
 * relevant to the task.
 *
 *   precision = Σ(included_size × relevance) / Σ(included_size)
 *
 * Handles empty context by returning null.
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

  const relevantFromTask = relevantDocs(task, includedDocs);
  const totalFromTask = includedDocs.length;
  const contributing = docNames(relevantFromTask);

  return {
    value,
    label: 'Context Precision',
    explanation:
      `What fraction of the selected context is relevant to "${task.title}"? ` +
      `Each document is weighted by its size and relevance. ` +
      `${contributing.length} of ${totalFromTask} selected documents are relevant to this task. ` +
      `Precision = size-weighted relevance sum (${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ` +
      `÷ total chars (${denominator.toLocaleString()}) = ${(value * 100).toFixed(1)}%.`,
    higherIsBetter: true,
    contributingDocs: contributing,
  };
}

// ─── Recall ─────────────────────────────────────────────────────────────────

/**
 * Size-weighted recall: fraction of all relevant context that was retrieved.
 *
 *   recall = Σ(included_size × relevance) / Σ(all_available_size × relevance)
 */
function computeRecall(
  task: LabTask,
  includedDocs: LabDocument[],
  allDocs: LabDocument[],
): MetricResult {
  const numerator = weightedRelevance(task, includedDocs);
  const denominator = weightedRelevance(task, allDocs);

  if (denominator === 0) {
    return {
      value: null,
      label: 'Context Recall',
      explanation: 'No documents in the repository are relevant to this task. Recall is undefined.',
      higherIsBetter: true,
      contributingDocs: [],
      notApplicableReason: 'No relevant documents exist in the repository.',
    };
  }

  const value = numerator / denominator;
  const relevantAvailable = relevantDocs(task, allDocs);
  const relevantIncluded = relevantDocs(task, includedDocs);
  const missing = relevantAvailable.filter((d) => !includedDocs.includes(d));

  const explanationParts: string[] = [
    `How much of the available relevant context is included? ` +
      `Of ${relevantAvailable.length} relevant documents, ${relevantIncluded.length} are selected.`,
  ];
  if (missing.length > 0) {
    explanationParts.push(`Missing relevant documents: ${missing.map((d) => d.title).join(', ')}.`);
  }
  explanationParts.push(
    `Recall = included relevant weight (${numerator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ` +
      `÷ total relevant weight (${denominator.toLocaleString(undefined, { maximumFractionDigits: 0 })}) = ${(value * 100).toFixed(1)}%.`,
  );

  return {
    value,
    label: 'Context Recall',
    explanation: explanationParts.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(relevantIncluded),
  };
}

// ─── Sufficiency ────────────────────────────────────────────────────────────

/**
 * Requirement-coverage sufficiency: fraction of task requirements covered
 * by included documents. A requirement is covered when at least one
 * included document lists it in its `covers` array.
 *
 *   sufficiency = covered_requirements / total_requirements
 */
function computeSufficiency(task: LabTask, includedDocs: LabDocument[]): MetricResult {
  if (includedDocs.length === 0) {
    return {
      value: 0,
      label: 'Sufficiency',
      explanation: 'No documents are included. No requirements are covered.',
      higherIsBetter: true,
      contributingDocs: [],
    };
  }

  const total = task.requirements.length;
  const covered = task.requirements.filter((req) =>
    includedDocs.some((doc) => doc.covers.includes(req)),
  );
  const coveredCount = covered.length;
  const uncovered = task.requirements.filter(
    (req) => !includedDocs.some((doc) => doc.covers.includes(req)),
  );

  const value = total > 0 ? coveredCount / total : 0;

  const parts: string[] = [
    `How many of the task requirements are addressed by selected documents? ` +
      `${coveredCount} of ${total} requirements are covered. ` +
      `Sufficiency = ${coveredCount} ÷ ${total} = ${(value * 100).toFixed(0)}%.`,
  ];

  if (covered.length > 0) {
    const coveringDocs = covered.map((req) => {
      const doc = includedDocs.find((d) => d.covers.includes(req));
      return `${req.replace(/-/g, ' ')} → ${doc?.title ?? 'unknown'}`;
    });
    parts.push(`Covered: ${coveringDocs.join('; ')}.`);
  }

  if (uncovered.length > 0) {
    parts.push(`Not covered: ${uncovered.map((r) => r.replace(/-/g, ' ')).join(', ')}.`);
  }

  return {
    value,
    label: 'Sufficiency',
    explanation: parts.join(' '),
    higherIsBetter: true,
    contributingDocs: docNames(
      includedDocs.filter((d) => d.covers.some((c) => task.requirements.includes(c))),
    ),
  };
}

// ─── Authority clarity ──────────────────────────────────────────────────────

/**
 * Authority clarity: for covered requirements, what fraction have an
 * unambiguous authoritative source?
 *
 * A covered requirement has clear authority when:
 *   - At least one included document is authoritative for it
 *   - Exactly one included document is authoritative for it, OR all
 *     authoritative sources for it agree (no conflicts among them)
 *   - No included document conflicts with the authoritative source
 *
 *   clarity = requirements_with_clear_authority / covered_requirements
 *
 * Returns null (N/A) when no requirements are covered.
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
    } else {
      // Check whether any two authoritative docs for this requirement conflict.
      const hasConflict = authoritative.some((a) =>
        authoritative.some(
          (b) =>
            b.id !== a.id && (a.conflictsWith.includes(b.id) || b.conflictsWith.includes(a.id)),
        ),
      );

      if (!hasConflict) {
        clearReqs.push(req);
      } else {
        const conflictNames = authoritative.map((d) => d.title).join(', ');
        ambiguousReqs.push({
          req,
          reason: `Multiple authoritative sources (${conflictNames}) provide potentially competing guidance on "${req.replace(/-/g, ' ')}".`,
        });
      }
    }
  }

  const value = covered.length > 0 ? clearReqs.length / covered.length : 0;

  const parts: string[] = [
    `Of ${covered.length} covered requirements, ${clearReqs.length} have clear authority and ${ambiguousReqs.length} are ambiguous or conflicting. ` +
      `Clarity = ${clearReqs.length} ÷ ${covered.length} = ${(value * 100).toFixed(0)}%.`,
  ];

  if (clearReqs.length > 0) {
    parts.push(`Clear: ${clearReqs.map((r) => r.replace(/-/g, ' ')).join(', ')}.`);
  }
  if (ambiguousReqs.length > 0) {
    parts.push(ambiguousReqs.map((a) => a.reason).join(' '));
  }
  if (covered.length - clearReqs.length > 0) {
    parts.push(
      'Adding a single authoritative source or removing conflicting documents would improve clarity.',
    );
  }

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
 * Active context size: total characters and estimated tokens across
 * all included documents.
 *
 * Token estimate uses a simple chars-per-token approximation (4 chars
 * per token for English prose). This is a rough educational estimate,
 * not a real tokenizer.
 */
function computeContextSize(includedDocs: LabDocument[]): ContextSizeResult {
  const chars = includedDocs.reduce((sum, d) => sum + d.length, 0);
  const estimatedTokens = Math.round(chars / CHARS_PER_TOKEN);

  const parts: string[] = [
    `Total size across ${includedDocs.length} document${includedDocs.length !== 1 ? 's' : ''}: ` +
      `${chars.toLocaleString()} characters, approximately ${estimatedTokens.toLocaleString()} tokens ` +
      `(estimated at 1 token ≈ ${CHARS_PER_TOKEN} characters for English prose).`,
    `This metric should be interpreted alongside precision, recall, and sufficiency — ` +
      `a larger context with high precision and recall is better than a small one with low sufficiency.`,
  ];

  return {
    chars,
    estimatedTokens,
    label: 'Active Context Size',
    explanation: parts.join(' '),
    contributingDocs: docNames(includedDocs),
  };
}
