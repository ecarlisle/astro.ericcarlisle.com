/**
 * Fixture-backed analysis adapter.
 *
 * Loads tasks and documents from fixture data, then delegates to
 * the fixture-independent `analyzeContext` engine.
 */
import { analyzeContext } from './engine';
import { DOCUMENTS, TASKS } from './fixtures';
import type { AnalysisResult } from './types';

/**
 * Run a context-quality analysis using the built-in fixture data.
 */
export function runFixtureAnalysis(taskId: string, includedDocIds: Set<string>): AnalysisResult {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Unknown task: ${taskId}`);

  const includedDocs = DOCUMENTS.filter((d) => includedDocIds.has(d.id));
  const availableDocs = DOCUMENTS;

  return analyzeContext({ task, includedDocs, availableDocs });
}
