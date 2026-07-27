/** Types for the Context Lab analysis engine. Educational model. */

export type AuthorityLevel = 'high' | 'medium' | 'low';

export interface LabDocument {
  id: string;
  title: string;
  description: string;
  authority: AuthorityLevel;
  /** Simulated character count representing document size. */
  length: number;
  /** Relevance scores (0–1) for each task. Key is a task ID. */
  relevanceByTask: Record<string, number>;
  /** Requirement IDs this document can satisfy. */
  covers: string[];
  /** Requirements this document is the canonical/authoritative source for. */
  authoritativeFor: string[];
  /** IDs of documents that provide competing or conflicting guidance. */
  conflictsWith: string[];
}

export interface LabTask {
  id: string;
  title: string;
  description: string;
  /** Requirement IDs the task needs. */
  requirements: string[];
}

export interface LabPreset {
  id: string;
  label: string;
  description: string;
  /** IDs of documents included by default for each task. */
  docIdsByTask: Record<string, string[]>;
}

export interface AnalysisInput {
  task: LabTask;
  includedDocs: LabDocument[];
  availableDocs: LabDocument[];
  charsPerToken?: number;
}

export interface MetricResult {
  value: number | null;
  label: string;
  explanation: string;
  higherIsBetter: boolean;
  contributingDocs: string[];
  notApplicableReason?: string;
}

export interface ContextSizeResult {
  chars: number;
  estimatedTokens: number;
  label: string;
  explanation: string;
  contributingDocs: string[];
}

export interface AnalysisResult {
  precision: MetricResult;
  recall: MetricResult;
  sufficiency: MetricResult;
  authorityClarity: MetricResult;
  contextSize: ContextSizeResult;
}

export interface LabState {
  selectedTaskId: string;
  selectedPresetId: string;
  includedDocIds: Set<string>;
  expandedMetrics: Set<string>;
}
