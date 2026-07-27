#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateMetric,
  measureEffectiveContext,
  RESULT_SCORES,
  sizeStatus,
  TOKEN_ESTIMATE_CHARACTERS,
} from './context-health-core.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const reportPath = process.env.CONTEXT_HEALTH_REPORT_PATH
  ? resolve(process.env.CONTEXT_HEALTH_REPORT_PATH)
  : resolve(repositoryRoot, 'src/data/context-health.json');
const metricIds = new Set([
  'context-precision',
  'context-recall',
  'sufficiency',
  'authority-clarity',
  'active-context-size',
]);
const errors = [];

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
  fail(`Cannot read report: ${error.message}`);
}

for (const field of [
  'schemaVersion',
  'auditedAt',
  'repositoryRevision',
  'effectiveContext',
  'overallSummary',
  'strengths',
  'priorities',
  'metrics',
  'methodology',
  'limitations',
]) {
  if (!(field in report)) errors.push(`missing required field: ${field}`);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(report.auditedAt ?? '')) {
  errors.push('auditedAt must use YYYY-MM-DD');
}
if (!/^[0-9a-f]{7,40}$/.test(report.repositoryRevision ?? '')) {
  errors.push('repositoryRevision must identify the audited Git revision');
}
if (!report.overallSummary || report.overallSummary.length < 20) {
  errors.push('overallSummary is too short');
}
if (!Array.isArray(report.strengths) || report.strengths.length === 0) {
  errors.push('strengths must contain at least one item');
}
if (!Array.isArray(report.priorities) || report.priorities.length === 0) {
  errors.push('priorities must contain at least one item');
} else if (report.priorities.length > 3) {
  errors.push('priorities must contain no more than three items');
}

const priorityNumbers = new Set();
for (const priority of report.priorities ?? []) {
  if (!Number.isInteger(priority.priority) || priority.priority < 1) {
    errors.push('each priority needs a positive integer priority');
  }
  if (priorityNumbers.has(priority.priority)) {
    errors.push(`duplicate priority number: ${priority.priority}`);
  }
  priorityNumbers.add(priority.priority);
  if (!priority.finding || !priority.recommendation) {
    errors.push(`priority ${priority.priority} needs a finding and recommendation`);
  }
}

try {
  const paths = report.effectiveContext.files;
  if (new Set(paths).size !== paths.length)
    errors.push('effectiveContext.files contains duplicates');
  const expected = measureEffectiveContext(report, repositoryRoot);
  const sizeMetric = report.metrics?.find((metric) => metric.id === 'active-context-size');
  if (!sizeMetric) {
    errors.push('active-context-size metric is missing');
  } else {
    if (
      JSON.stringify(sizeMetric.details?.measuredFiles) !== JSON.stringify(expected.measuredFiles)
    ) {
      errors.push('active-context-size measuredFiles are stale; run pnpm context:health');
    }
    if (sizeMetric.details?.characters !== expected.characters) {
      errors.push('active-context-size characters are stale; run pnpm context:health');
    }
    if (sizeMetric.details?.estimatedTokens !== expected.estimatedTokens) {
      errors.push('active-context-size estimatedTokens are stale; run pnpm context:health');
    }
    if (sizeMetric.status !== sizeStatus(expected.estimatedTokens)) {
      errors.push('active-context-size status is stale; run pnpm context:health');
    }
    const expectedInterpretation =
      `The declared effective context contains ${expected.characters.toLocaleString('en-US')} ` +
      `characters (~${expected.estimatedTokens.toLocaleString('en-US')} estimated tokens).`;
    if (sizeMetric.interpretation !== expectedInterpretation) {
      errors.push('active-context-size interpretation is stale; run pnpm context:health');
    }
  }
} catch (error) {
  errors.push(error.message);
}

if (!Array.isArray(report.metrics) || report.metrics.length !== metricIds.size) {
  errors.push(`metrics must contain exactly ${metricIds.size} entries`);
}
const seenMetricIds = new Set();
for (const metric of report.metrics ?? []) {
  if (!metricIds.has(metric.id)) errors.push(`unknown metric: ${metric.id}`);
  if (seenMetricIds.has(metric.id)) errors.push(`duplicate metric: ${metric.id}`);
  seenMetricIds.add(metric.id);
  if (!['deterministic', 'agent-assessed'].includes(metric.assessmentType)) {
    errors.push(`invalid assessmentType for ${metric.id}`);
  }

  if (metric.assessmentType !== 'agent-assessed') continue;
  if (!Array.isArray(metric.checks) || metric.checks.length === 0) {
    errors.push(`${metric.id} needs structured checks`);
    continue;
  }
  const totalWeight = metric.checks.reduce((sum, check) => sum + check.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.0001) {
    errors.push(`${metric.id} weights must total 1 (found ${totalWeight})`);
  }

  const checkIds = new Set();
  for (const check of metric.checks) {
    if (!check.id || checkIds.has(check.id))
      errors.push(`${metric.id} has a missing or duplicate check id`);
    checkIds.add(check.id);
    if (!Object.hasOwn(RESULT_SCORES, check.result))
      errors.push(`${check.id} has invalid result ${check.result}`);
    if (!['positive', 'negative'].includes(check.impact)) {
      errors.push(`${check.id} must classify impact as positive or negative`);
    }
    if (check.result === 'pass' && check.impact !== 'positive') {
      errors.push(`${check.id} pass results must be positive contributors`);
    }
    if (check.result !== 'pass' && check.impact !== 'negative') {
      errors.push(`${check.id} partial/fail results must be negative contributors`);
    }
    if (!(check.weight > 0 && check.weight <= 1)) errors.push(`${check.id} has invalid weight`);
    if (!check.interpretation || !check.evidence?.observation) {
      errors.push(`${check.id} must separate interpretation from observable evidence`);
    }
    if (!Array.isArray(check.evidence?.citations) || check.evidence.citations.length === 0) {
      errors.push(`${check.id} needs at least one evidence citation`);
    }
    for (const citation of check.evidence?.citations ?? []) validateCitation(citation, check.id);
  }

  try {
    const expected = calculateMetric(metric.checks);
    if (metric.score !== expected.score || metric.status !== expected.status) {
      errors.push(`${metric.id} score or status is stale; run pnpm context:health`);
    }
    if (
      metric.checks.some(
        (check, index) => check.contribution !== expected.checks[index].contribution,
      )
    ) {
      errors.push(`${metric.id} contributions are stale; run pnpm context:health`);
    }
  } catch (error) {
    errors.push(`${metric.id}: ${error.message}`);
  }
}

if (
  Object.entries(RESULT_SCORES).some(
    ([result, score]) => report.methodology?.resultScores?.[result] !== score,
  )
) {
  errors.push('methodology.resultScores does not match generator rules');
}
if (report.methodology?.tokenEstimation?.charactersPerToken !== TOKEN_ESTIMATE_CHARACTERS) {
  errors.push('methodology.tokenEstimation does not match generator rules');
}
if (!Array.isArray(report.limitations) || report.limitations.length === 0) {
  errors.push('limitations must contain at least one item');
}

if (errors.length > 0) {
  console.error(`Context Health validation failed (${errors.length})`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Context Health report valid');
console.log(`Audit revision: ${report.repositoryRevision}`);
console.log(`Metrics: ${report.metrics.length}; priorities: ${report.priorities.length}`);

function validateCitation(citation, checkId) {
  if (!citation?.path || !citation?.section) {
    errors.push(`${checkId} citation needs path and section`);
    return;
  }
  const path = resolve(repositoryRoot, citation.path);
  if (!existsSync(path)) {
    errors.push(`${checkId} evidence path does not exist: ${citation.path}`);
    return;
  }
  const source = readFileSync(path, 'utf8');
  if (!source.includes(citation.section)) {
    errors.push(`${checkId} evidence section not found in ${citation.path}: ${citation.section}`);
  }
}

function fail(message) {
  console.error(`Context Health validation failed: ${message}`);
  process.exit(1);
}
