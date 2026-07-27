#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEvidenceUrl,
  githubHeadingAnchor,
  validateCitationShape,
} from '../src/lib/context-health-evidence.mjs';
import {
  calculateMetric,
  measureEffectiveContext,
  RESULT_SCORES,
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
const maturityLevels = new Set([
  'declared',
  'structurally-verified',
  'observed',
  'repeated',
  'resilient',
]);
const observedStatuses = new Set(['not-measured', 'measured', 'insufficient-evidence']);
const profileIds = new Set([
  'significant-astro-ui',
  'content-editorial',
  'deployment-ci-diagnosis',
  'contact-worker',
  'pr-review',
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
  'profileCoverage',
  'overallSummary',
  'strengths',
  'priorities',
  'metrics',
  'methodology',
  'limitations',
]) {
  if (!(field in report)) errors.push(`missing required field: ${field}`);
}

if (report.schemaVersion !== '3.0.0') errors.push('schemaVersion must be 3.0.0');
if (!/^\d{4}-\d{2}-\d{2}$/.test(report.auditedAt ?? '')) {
  errors.push('auditedAt must use YYYY-MM-DD');
}
if (!isRevision(report.repositoryRevision)) {
  errors.push('repositoryRevision must identify the audited Git revision');
}
if (!report.overallSummary || report.overallSummary.length < 20) {
  errors.push('overallSummary is too short');
}
if (!Array.isArray(report.strengths) || report.strengths.length === 0) {
  errors.push('strengths must contain at least one item');
}
validatePriorities();
validateProfiles();
validateMethodology();
validateMetrics();
validateEffectiveContextMeasurement();

if (!Array.isArray(report.limitations) || report.limitations.length === 0) {
  errors.push('limitations must contain at least one item');
}
if ('score' in report || 'aggregateScore' in report || 'overallScore' in report) {
  errors.push('the report must not contain an aggregate score');
}
const methodologyText = JSON.stringify(report.methodology ?? {}).toLowerCase();
if (
  'activeContextThresholds' in (report.methodology ?? {}) ||
  /healthy at|at risk (?:above|below)|\d[\d,]* (?:estimated )?tokens or fewer/.test(methodologyText)
) {
  errors.push('portable methodology must not define universal token or health thresholds');
}

if (errors.length > 0) {
  console.error(`Context Health validation failed (${errors.length})`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Context Health report valid');
console.log(`Audit revision: ${report.repositoryRevision}`);
console.log(
  `Methodology: ${report.methodology.id} ${report.methodology.version} (${report.methodology.status})`,
);
console.log(`Metrics: ${report.metrics.length}; priorities: ${report.priorities.length}`);

function validatePriorities() {
  if (!Array.isArray(report.priorities) || report.priorities.length === 0) {
    errors.push('priorities must contain at least one item');
    return;
  }
  if (report.priorities.length > 3) errors.push('priorities must contain no more than three items');
  const priorityNumbers = new Set();
  for (const priority of report.priorities) {
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
}

function validateProfiles() {
  if (!Array.isArray(report.profileCoverage) || report.profileCoverage.length !== profileIds.size) {
    errors.push(`profileCoverage must contain exactly ${profileIds.size} entries`);
    return;
  }
  const seen = new Set();
  for (const profile of report.profileCoverage) {
    if (!profileIds.has(profile.id)) errors.push(`unknown profile: ${profile.id}`);
    if (seen.has(profile.id)) errors.push(`duplicate profile: ${profile.id}`);
    seen.add(profile.id);
    if (!profile.label || !profile.note) errors.push(`${profile.id} needs a label and note`);
    if (profile.id === 'significant-astro-ui') {
      if (profile.version !== '2.0.0' || profile.status !== 'static-assessed') {
        errors.push('significant-astro-ui must preserve profile v2 as static-assessed');
      }
    } else if (profile.version !== null || profile.status !== 'not-evaluated') {
      errors.push(`${profile.id} must remain unversioned and not-evaluated`);
    }
    if ('score' in profile) errors.push(`${profile.id} must not have a profile score`);
  }
  if (
    report.effectiveContext?.id !== 'significant-astro-ui' ||
    report.effectiveContext?.version !== '2.0.0' ||
    report.effectiveContext?.status !== 'static-assessed'
  ) {
    errors.push('effectiveContext must identify significant-astro-ui profile v2');
  }
  if (
    !Array.isArray(report.effectiveContext?.files) ||
    report.effectiveContext.files.length === 0
  ) {
    errors.push('effectiveContext.files must be an explicitly declared non-empty array');
  } else if (new Set(report.effectiveContext.files).size !== report.effectiveContext.files.length) {
    errors.push('effectiveContext.files contains duplicates');
  }
}

function validateMethodology() {
  if (
    report.methodology?.id !== 'context-health-core' ||
    report.methodology?.version !== '0.1.0' ||
    report.methodology?.status !== 'experimental'
  ) {
    errors.push('methodology must identify experimental context-health-core 0.1.0');
  }
  if (report.methodology?.evidenceMaturityVersion !== '1.0.0') {
    errors.push('evidence maturity model version must be 1.0.0');
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
  if (!report.methodology?.tokenEstimation?.note?.includes('JavaScript string length')) {
    errors.push('tokenEstimation must identify JavaScript string length');
  }
  if (
    !Array.isArray(report.methodology?.observedSizeMeasures) ||
    report.methodology.observedSizeMeasures.length < 6
  ) {
    errors.push('methodology must declare future observed size measures');
  }
  const maturityDefinitions = report.methodology?.evidenceMaturityLevels;
  if (
    !Array.isArray(maturityDefinitions) ||
    maturityDefinitions.length !== maturityLevels.size ||
    maturityDefinitions.some((level) => !maturityLevels.has(level.id) || !level.definition)
  ) {
    errors.push('methodology must define every evidence maturity level');
  }
  if (
    !Array.isArray(report.methodology?.scenarioTaxonomy) ||
    report.methodology.scenarioTaxonomy.length !== 8
  ) {
    errors.push('methodology must document all eight future scenario categories');
  }
  if (
    !Array.isArray(report.methodology?.foundations) ||
    report.methodology.foundations.length < 7
  ) {
    errors.push('methodology must cite its external foundations');
  } else {
    for (const foundation of report.methodology.foundations) {
      try {
        const url = new URL(foundation.url);
        if (url.protocol !== 'https:' || !foundation.label || !foundation.adaptation) {
          errors.push('each external foundation needs a safe HTTPS URL, label, and adaptation');
        }
      } catch {
        errors.push('each external foundation needs a valid URL');
      }
    }
  }
}

function validateMetrics() {
  if (!Array.isArray(report.metrics) || report.metrics.length !== metricIds.size) {
    errors.push(`metrics must contain exactly ${metricIds.size} entries`);
    return;
  }
  const seen = new Set();
  for (const metric of report.metrics) {
    if (!metricIds.has(metric.id)) errors.push(`unknown metric: ${metric.id}`);
    if (seen.has(metric.id)) errors.push(`duplicate metric: ${metric.id}`);
    seen.add(metric.id);
    if (!metric.label || !metric.assessed || !metric.observed) {
      errors.push(`${metric.id} needs label, assessed, and observed sections`);
      continue;
    }
    validateAssessed(metric);
    validateObserved(metric);
  }
}

function validateAssessed(metric) {
  const assessed = metric.assessed;
  if (!maturityLevels.has(assessed.evidenceMaturity)) {
    errors.push(`${metric.id} has invalid evidence maturity`);
  }
  if (!assessed.evidenceMaturityReason || !assessed.interpretation) {
    errors.push(`${metric.id} needs maturity reasoning and assessed interpretation`);
  }
  if (!Array.isArray(assessed.limitations) || assessed.limitations.length === 0) {
    errors.push(`${metric.id} needs assessed limitations`);
  }

  if (metric.id === 'active-context-size') {
    if (
      assessed.score !== null ||
      assessed.status !== 'declared-estimate' ||
      assessed.checks !== undefined
    ) {
      errors.push('active-context-size assessed result must be an unscored declared-estimate');
    }
    return;
  }
  if (!Array.isArray(assessed.checks) || assessed.checks.length === 0) {
    errors.push(`${metric.id} needs structured assessed checks`);
    return;
  }
  const totalWeight = assessed.checks.reduce((sum, check) => sum + check.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.0001) {
    errors.push(`${metric.id} weights must total 1 (found ${totalWeight})`);
  }
  const checkIds = new Set();
  for (const check of assessed.checks) {
    if (!check.id || checkIds.has(check.id)) {
      errors.push(`${metric.id} has a missing or duplicate check id`);
    }
    checkIds.add(check.id);
    if (!Object.hasOwn(RESULT_SCORES, check.result)) {
      errors.push(`${check.id} has invalid result ${check.result}`);
    }
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
    for (const citation of check.evidence?.citations ?? []) {
      validateCitation(citation, check.id, report.repositoryRevision);
    }
  }
  try {
    const expected = calculateMetric(assessed.checks);
    if (assessed.score !== expected.score || assessed.status !== expected.status) {
      errors.push(`${metric.id} assessed score or status is stale; run pnpm context:health`);
    }
    if (
      assessed.checks.some(
        (check, index) => check.contribution !== expected.checks[index].contribution,
      )
    ) {
      errors.push(`${metric.id} contributions are stale; run pnpm context:health`);
    }
  } catch (error) {
    errors.push(`${metric.id}: ${error.message}`);
  }
}

function validateObserved(metric) {
  const observed = metric.observed;
  if (!observedStatuses.has(observed.status)) {
    errors.push(`${metric.id} has invalid observed status`);
    return;
  }
  for (const field of ['interpretation', 'limitations']) {
    if (!observed[field] || (Array.isArray(observed[field]) && observed[field].length === 0)) {
      errors.push(`${metric.id} observed ${field} is required`);
    }
  }
  if (observed.status === 'not-measured') {
    for (const field of [
      'score',
      'numerator',
      'denominator',
      'repositoryRevision',
      'evaluationSuiteVersion',
      'variation',
      'confidence',
    ]) {
      if (observed[field] !== null) errors.push(`${metric.id} not-measured ${field} must be null`);
    }
    for (const field of ['taskCount', 'runCount', 'agentConfigurationCount']) {
      if (observed[field] !== 0) errors.push(`${metric.id} not-measured ${field} must be zero`);
    }
    if (metric.id === 'authority-clarity') {
      const diagnostics = observed.authorityDiagnostics;
      if (
        !diagnostics ||
        diagnostics.unresolvedConflictCount !== null ||
        diagnostics.ambiguousAreas?.length !== 0 ||
        diagnostics.expectedControllingSources?.length !== 0 ||
        diagnostics.decisionEvidence?.length !== 0
      ) {
        errors.push('not-measured authority diagnostics must remain null and empty');
      }
    } else if (observed.authorityDiagnostics !== null) {
      errors.push(`${metric.id} must not contain authority diagnostics`);
    }
    return;
  }
  if (observed.status === 'measured') {
    if (
      typeof observed.score !== 'number' ||
      typeof observed.numerator !== 'number' ||
      !(observed.denominator > 0)
    ) {
      errors.push(`${metric.id} measured results need score, numerator, and positive denominator`);
    } else if (
      observed.score < 0 ||
      observed.score > 1 ||
      Math.abs(observed.score - observed.numerator / observed.denominator) > 0.001
    ) {
      errors.push(`${metric.id} measured score must match numerator divided by denominator`);
    }
    for (const field of ['taskCount', 'runCount', 'agentConfigurationCount']) {
      if (!Number.isInteger(observed[field]) || observed[field] <= 0) {
        errors.push(`${metric.id} measured ${field} must be a positive integer`);
      }
    }
    if (!isRevision(observed.repositoryRevision) || !observed.evaluationSuiteVersion) {
      errors.push(`${metric.id} measured results need revision and evaluation suite version`);
    }
    if (
      metric.id === 'authority-clarity' &&
      (!observed.authorityDiagnostics ||
        !Number.isInteger(observed.authorityDiagnostics.unresolvedConflictCount) ||
        observed.authorityDiagnostics.unresolvedConflictCount < 0)
    ) {
      errors.push('measured authority results need conflict diagnostics');
    }
  }
  if (
    observed.status === 'insufficient-evidence' &&
    observed.score !== null &&
    !(observed.denominator > 0)
  ) {
    errors.push(`${metric.id} observed score requires a valid denominator`);
  }
}

function validateEffectiveContextMeasurement() {
  try {
    const expected = measureEffectiveContext(report, repositoryRoot);
    const size = report.metrics?.find((metric) => metric.id === 'active-context-size')?.assessed;
    if (!size) return;
    if (JSON.stringify(size.details?.measuredFiles) !== JSON.stringify(expected.measuredFiles)) {
      errors.push('active-context-size measuredFiles are stale; run pnpm context:health');
    }
    if (size.details?.characters !== expected.characters) {
      errors.push('active-context-size characters are stale; run pnpm context:health');
    }
    if (size.details?.estimatedTokens !== expected.estimatedTokens) {
      errors.push('active-context-size estimatedTokens are stale; run pnpm context:health');
    }
    const interpretation =
      `The declared full-file context contains ${expected.characters.toLocaleString('en-US')} ` +
      `characters (~${expected.estimatedTokens.toLocaleString('en-US')} estimated tokens).`;
    if (size.interpretation !== interpretation) {
      errors.push('active-context-size assessed interpretation is stale; run pnpm context:health');
    }
    const estimationMethod =
      `Estimated tokens = ceil(UTF-16 code units / ${TOKEN_ESTIMATE_CHARACTERS}). ` +
      'This is an approximation, not a tokenizer result.';
    if (size.details?.estimationMethod !== estimationMethod) {
      errors.push('active-context-size estimation method is stale; run pnpm context:health');
    }
  } catch (error) {
    errors.push(error.message);
  }
}

function validateCitation(citation, checkId, repositoryRevision) {
  try {
    validateCitationShape(citation);
    buildEvidenceUrl(repositoryRevision, citation);
  } catch (error) {
    errors.push(`${checkId} invalid evidence citation: ${error.message}`);
    return;
  }

  let source;
  try {
    source = execFileSync('git', ['show', `${repositoryRevision}:${citation.path}`], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    errors.push(`${checkId} evidence path does not exist at audited revision: ${citation.path}`);
    return;
  }
  if (citation.startLine === undefined) {
    if (citation.section === undefined) return;
    const expectedAnchor = githubHeadingAnchor(citation.section);
    const matches = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^#{1,6}\s+\S/.test(line))
      .filter((line) => {
        try {
          return githubHeadingAnchor(line) === expectedAnchor;
        } catch {
          return false;
        }
      });
    if (!matches.includes(citation.section.trim())) {
      errors.push(
        `${checkId} evidence section heading not found in ${citation.path}: ${citation.section}`,
      );
    } else if (matches.length > 1) {
      errors.push(
        `${checkId} evidence section heading does not have a stable unique anchor in ${citation.path}: ${citation.section}`,
      );
    }
    return;
  }
  const lines = source.split(/\r?\n/);
  const endLine = citation.endLine ?? citation.startLine;
  if (endLine > lines.length) {
    errors.push(`${checkId} evidence line range exceeds ${citation.path} (${lines.length} lines)`);
    return;
  }
  const citedSource = lines.slice(citation.startLine - 1, endLine).join('\n');
  if (citation.section !== undefined && !citedSource.includes(citation.section)) {
    errors.push(`${checkId} evidence section not found in ${citation.path}: ${citation.section}`);
  }
}

function isRevision(value) {
  return /^[0-9a-f]{7,40}$/.test(value ?? '');
}

function fail(message) {
  console.error(`Context Health validation failed: ${message}`);
  process.exit(1);
}
