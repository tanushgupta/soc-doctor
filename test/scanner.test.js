import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { scanPath } from '../src/scanner.js';
import { buildReport } from '../src/report.js';

test('broken fixture triggers the expected high-signal checks', async () => {
  const findings = await scanPath(resolve('examples/broken-stack'));
  const ids = new Set(findings.map((finding) => finding.checkId));

  assert.ok(ids.has('shared-admin-password'));
  assert.ok(ids.has('opensearch-audit-logging'));
  assert.ok(ids.has('ism-retention'));
  assert.ok(ids.has('vector-dangerous-patterns'));
  assert.ok(ids.has('vector-dlq'));
  assert.ok(ids.has('hardcoded-hostnames-and-timezones'));
  assert.ok(ids.has('wazuh-reingestion-risk'));
  assert.ok(ids.has('tenant-rbac'));
  assert.ok(ids.has('alerting-placeholders'));
  assert.ok(ids.has('snapshot-restore-evidence'));

  const report = buildReport({ target: 'examples/broken-stack', findings });
  assert.ok(report.summary.total >= 10);
  assert.ok(report.summary.counts.critical >= 1);
  assert.ok(report.summary.counts.high >= 5);
});

test('healthy fixture stays clean on high and critical findings', async () => {
  const findings = await scanPath(resolve('examples/healthy-stack'));
  const dangerousFindings = findings.filter((finding) => ['critical', 'high'].includes(finding.severity));

  assert.equal(dangerousFindings.length, 0);
});
