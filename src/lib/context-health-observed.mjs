export function buildObservedPresentation(observed) {
  if (observed.status === 'not-measured') {
    return {
      lead: 'No agent task results yet.',
      metadata: [
        `Tasks ${observed.taskCount}`,
        `Runs ${observed.runCount}`,
        `Agent configurations ${observed.agentConfigurationCount}`,
        'Suite not assigned',
      ],
    };
  }

  const metadata = [];
  if (observed.score !== null) metadata.push(`Score ${Math.round(observed.score * 100)}%`);
  if (observed.numerator !== null) metadata.push(`Numerator ${observed.numerator}`);
  if (observed.denominator !== null) metadata.push(`Denominator ${observed.denominator}`);
  metadata.push(
    `Tasks ${observed.taskCount}`,
    `Runs ${observed.runCount}`,
    `Agent configurations ${observed.agentConfigurationCount}`,
  );
  if (observed.evaluationSuiteVersion !== null) {
    metadata.push(`Suite ${observed.evaluationSuiteVersion}`);
  }
  if (observed.variation !== null) metadata.push(`Variation ${observed.variation}`);
  if (observed.confidence !== null) metadata.push(`Confidence ${observed.confidence}`);

  return { lead: null, metadata };
}
