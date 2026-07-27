import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const RESULT_SCORES = Object.freeze({
  pass: 1,
  partial: 0.5,
  fail: 0,
});

export const SCORE_THRESHOLDS = Object.freeze({
  healthy: 0.85,
  needsAttention: 0.7,
});

export const TOKEN_ESTIMATE_CHARACTERS = 4;

export function scoreStatus(score) {
  if (score >= SCORE_THRESHOLDS.healthy) return 'healthy';
  if (score >= SCORE_THRESHOLDS.needsAttention) return 'needs-attention';
  return 'at-risk';
}

export function sizeStatus(estimatedTokens) {
  if (estimatedTokens <= 24_000) return 'healthy';
  if (estimatedTokens <= 48_000) return 'needs-attention';
  return 'at-risk';
}

export function calculateMetric(checks) {
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  if (totalWeight <= 0) throw new Error('check weights must total more than zero');

  let weightedScore = 0;
  const generatedChecks = checks.map((check) => {
    const resultScore = RESULT_SCORES[check.result];
    if (resultScore === undefined) throw new Error(`unknown result "${check.result}"`);
    const contribution = (check.weight * resultScore) / totalWeight;
    weightedScore += contribution;
    return { ...check, contribution: round(contribution) };
  });

  return {
    checks: generatedChecks,
    score: round(weightedScore),
    status: scoreStatus(weightedScore),
  };
}

export function measureEffectiveContext(report, repositoryRoot) {
  if (!report.effectiveContext || !Array.isArray(report.effectiveContext.files)) {
    throw new Error('effectiveContext.files must be an explicitly declared array');
  }

  const measuredFiles = report.effectiveContext.files.map((path) => {
    const fullPath = resolve(repositoryRoot, path);
    if (!existsSync(fullPath)) throw new Error(`effective-context file does not exist: ${path}`);
    return { path, characters: readFileSync(fullPath, 'utf8').length };
  });
  const characters = measuredFiles.reduce((sum, file) => sum + file.characters, 0);
  const estimatedTokens = Math.ceil(characters / TOKEN_ESTIMATE_CHARACTERS);

  return { characters, estimatedTokens, measuredFiles };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
