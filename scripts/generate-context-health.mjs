#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateMetric,
  measureEffectiveContext,
  TOKEN_ESTIMATE_CHARACTERS,
} from './context-health-core.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const reportPath = process.env.CONTEXT_HEALTH_REPORT_PATH
  ? resolve(process.env.CONTEXT_HEALTH_REPORT_PATH)
  : resolve(repositoryRoot, 'src/data/context-health.json');
const validatorExecutable = process.env.CONTEXT_HEALTH_VALIDATOR_EXECUTABLE ?? process.execPath;

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
  fail(`Cannot read report: ${error.message}`);
}

try {
  for (const metric of report.metrics ?? []) {
    if (!metric.assessed?.checks) continue;
    const generated = calculateMetric(metric.assessed.checks);
    metric.assessed.checks = generated.checks;
    metric.assessed.score = generated.score;
    metric.assessed.status = generated.status;
  }

  const sizeMetric = report.metrics?.find((metric) => metric.id === 'active-context-size');
  if (!sizeMetric) throw new Error('active-context-size metric is missing');
  const measurement = measureEffectiveContext(report, repositoryRoot);
  sizeMetric.assessed.details = {
    ...measurement,
    estimationMethod:
      `Estimated tokens = ceil(UTF-16 code units / ${TOKEN_ESTIMATE_CHARACTERS}). ` +
      'This is an approximation, not a tokenizer result.',
  };
  sizeMetric.assessed.status = 'declared-estimate';
  sizeMetric.assessed.interpretation =
    `The declared full-file context contains ${measurement.characters.toLocaleString('en-US')} ` +
    `characters (~${measurement.estimatedTokens.toLocaleString('en-US')} estimated tokens).`;

  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  fail(error.message);
}

const validation = spawnSync(
  validatorExecutable,
  [resolve(scriptDirectory, 'validate-context-health.mjs')],
  {
    encoding: 'utf8',
    env: { ...process.env, CONTEXT_HEALTH_REPORT_PATH: reportPath },
  },
);
if (validation.error) {
  fail(`cannot run validator: ${validation.error.message}`);
}
if (validation.status === null) {
  fail(
    validation.stderr?.trim() ||
      validation.stdout?.trim() ||
      'validator process ended without an exit status',
  );
}
if (validation.status !== 0) {
  fail(validation.stderr?.trim() || validation.stdout?.trim() || 'generated report is invalid');
}

console.log('Context Health report generated');
console.log(`Audit revision: ${report.repositoryRevision}`);
console.log(`Effective-context files: ${report.effectiveContext.files.length}`);
const sizeMetric = report.metrics.find((metric) => metric.id === 'active-context-size');
console.log(
  `Active context: ${sizeMetric.assessed.details.characters.toLocaleString('en-US')} chars / ` +
    `~${sizeMetric.assessed.details.estimatedTokens.toLocaleString('en-US')} tokens`,
);
for (const metric of report.metrics) {
  const score =
    metric.assessed.score === null ? 'not scored' : `${Math.round(metric.assessed.score * 100)}%`;
  console.log(
    `- ${metric.label}: assessed ${score} (${metric.assessed.status}); ` +
      `observed ${metric.observed.status}`,
  );
}

function fail(message) {
  console.error(`Context Health generation failed: ${message}`);
  process.exit(1);
}
