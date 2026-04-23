import { loadContext } from './lib/load-context.js';
import { allChecks } from './checks/index.js';

export async function scanPath(targetPath) {
  const context = await loadContext(targetPath);
  const findings = [];

  for (const check of allChecks) {
    try {
      const results = await check.run(context);
      for (const result of results) {
        findings.push({
          checkId: check.id,
          title: check.title,
          category: check.category,
          severity: result.severity ?? check.defaultSeverity ?? 'medium',
          file: result.file ?? null,
          message: result.message,
          evidence: result.evidence ?? null,
          recommendation: result.recommendation ?? check.recommendation ?? null
        });
      }
    } catch (error) {
      findings.push({
        checkId: check.id,
        title: check.title,
        category: check.category,
        severity: 'medium',
        file: null,
        message: `Check execution failed: ${error instanceof Error ? error.message : String(error)}`,
        evidence: null,
        recommendation: 'Fix the check implementation before trusting this result.'
      });
    }
  }

  return findings.sort((left, right) => {
    if (left.severity === right.severity) {
      return left.checkId.localeCompare(right.checkId);
    }

    const order = ['critical', 'high', 'medium', 'low', 'info'];
    return order.indexOf(left.severity) - order.indexOf(right.severity);
  });
}
