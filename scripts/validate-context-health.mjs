#!/usr/bin/env node
// Context Health Report — validation script.
// Reads the report JSON, validates its structure, and exits nonzero on failure.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPORT_PATH = resolve(import.meta.dirname, '../src/data/context-health.json');
const VALID_STATUSES = new Set(['healthy', 'needs-attention', 'at-risk']);
const KNOWN_METRIC_IDS = new Set([
  'context-precision',
  'context-recall',
  'sufficiency',
  'authority-clarity',
  'active-context-size',
]);

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

function error(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// Load
if (!existsSync(REPORT_PATH)) {
  error(`Report not found at ${REPORT_PATH}`);
  process.exit(1);
}

/** @type {any} */
let report;
try {
  report = JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
} catch (e) {
  error(`Invalid JSON: ${e.message}`);
  process.exit(1);
}

// Schema fields
const requiredFields = [
  'schemaVersion',
  'generatedAt',
  'repositoryRevision',
  'overallSummary',
  'strengths',
  'priorities',
  'metrics',
  'methodology',
  'limitations',
];
for (const field of requiredFields) {
  if (!(field in report)) error(`Missing required field: ${field}`);
}
if (typeof report.schemaVersion !== 'string' || !report.schemaVersion)
  error('schemaVersion must be a non-empty string');
if (typeof report.overallSummary !== 'string' || report.overallSummary.length < 10)
  error('overallSummary too short or missing');

// Strengths
if (!Array.isArray(report.strengths) || report.strengths.length < 1)
  error('Must have at least 1 strength');
for (const s of report.strengths) {
  if (typeof s !== 'string' || s.length < 5) error(`Strength too short: "${s}"`);
}

// Priorities
if (!Array.isArray(report.priorities) || report.priorities.length < 1)
  error('Must have at least 1 priority');
/** @type {Set<number>} */
const seenPriorityNums = new Set();
for (const p of report.priorities) {
  if (typeof p.priority !== 'number') error('Each priority needs a numeric priority field');
  if (seenPriorityNums.has(p.priority)) error(`Duplicate priority number: ${p.priority}`);
  seenPriorityNums.add(p.priority);
  if (!p.finding || typeof p.finding !== 'string') error('Each priority needs a finding string');
  if (!p.recommendation || typeof p.recommendation !== 'string')
    error('Each priority needs a recommendation string');
}

// Metrics
if (!Array.isArray(report.metrics) || report.metrics.length < 1)
  error('Must have at least 1 metric');
/** @type {Set<string>} */
const seenMetricIds = new Set();
for (const m of report.metrics) {
  if (!m.id || typeof m.id !== 'string') error('Metric missing id');
  if (seenMetricIds.has(m.id)) error(`Duplicate metric id: ${m.id}`);
  seenMetricIds.add(m.id);
  if (!KNOWN_METRIC_IDS.has(m.id)) warn(`Unknown metric id: ${m.id}`);

  if (m.score !== null && (typeof m.score !== 'number' || m.score < 0 || m.score > 1)) {
    error(`Metric ${m.id} score out of range (0-1): ${m.score}`);
  }
  if (!VALID_STATUSES.has(m.status)) error(`Metric ${m.id} has invalid status: ${m.status}`);
  if (!m.interpretation || typeof m.interpretation !== 'string')
    error(`Metric ${m.id} missing interpretation`);
  if (!m.assessmentType || !['deterministic', 'agent-assessed'].includes(m.assessmentType)) {
    error(`Metric ${m.id} has invalid assessmentType: ${m.assessmentType}`);
  }

  if (m.id === 'active-context-size') {
    if (!m.details || typeof m.details.characters !== 'number' || m.details.characters < 0) {
      error('active-context-size missing valid details.characters');
    }
    if (typeof m.details.estimatedTokens !== 'number' || m.details.estimatedTokens < 0) {
      error('active-context-size missing valid details.estimatedTokens');
    }
    if (!m.details.estimationMethod) error('active-context-size missing estimationMethod');
    if (!Array.isArray(m.details.measuredFiles))
      error('active-context-size missing measuredFiles array');
    for (const f of m.details.measuredFiles) {
      if (!f.path || typeof f.bytes !== 'number')
        error(`Invalid measuredFile entry: ${JSON.stringify(f)}`);
    }
  } else {
    if (!Array.isArray(m.checks) || m.checks.length < 1)
      error(`Metric ${m.id} missing checks array`);
    /** @type {Set<string>} */
    const seenCheckIds = new Set();
    let totalWeight = 0;
    for (const c of m.checks) {
      if (seenCheckIds.has(c.id)) error(`Duplicate check id ${c.id} in metric ${m.id}`);
      seenCheckIds.add(c.id);
      if (!['pass', 'partial', 'fail'].includes(c.result))
        error(`Check ${c.id} invalid result: ${c.result}`);
      if (typeof c.weight !== 'number' || c.weight <= 0)
        error(`Check ${c.id} missing or invalid weight`);
      totalWeight += c.weight;
      if (!c.evidence || typeof c.evidence !== 'string') error(`Check ${c.id} missing evidence`);
    }
    if (Math.abs(totalWeight - 1.0) > 0.01)
      warn(`Metric ${m.id} check weights sum to ${totalWeight} (should be ~1.0)`);
  }
}

// Methodology
if (!report.methodology || typeof report.methodology !== 'object')
  error('Missing methodology section');
if (!Array.isArray(report.methodology.deterministicMetrics))
  error('methodology missing deterministicMetrics');
if (!Array.isArray(report.methodology.agentAssessedMetrics))
  error('methodology missing agentAssessedMetrics');

// Limitations
if (!Array.isArray(report.limitations) || report.limitations.length < 1)
  error('Must have at least 1 limitation');

// Summary
console.log(`\nContext Health Report — Validation`);
console.log(`Schema: ${report.schemaVersion}`);
console.log(`Metrics: ${report.metrics.length}`);
console.log(`Priorities: ${report.priorities.length}`);
console.log(`\nScores:`);
for (const m of report.metrics) {
  const scoreStr = m.score !== null ? `${(m.score * 100).toFixed(0)}%` : 'N/A';
  console.log(`  ${m.label}: ${scoreStr} (${m.status}, ${m.assessmentType})`);
}

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.log(`  - ${e}`);
}
if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
}

console.log(`\n${errors.length > 0 ? 'FAILED' : 'PASSED'}`);
process.exit(errors.length > 0 ? 1 : 0);
