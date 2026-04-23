export function buildReport({ target, findings }) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  const score = Math.max(
    0,
    100 - (
      counts.critical * 25 +
      counts.high * 15 +
      counts.medium * 8 +
      counts.low * 3 +
      counts.info * 1
    )
  );

  return {
    tool: 'soc-doctor',
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    target,
    summary: {
      total: findings.length,
      score,
      counts
    },
    findings
  };
}
