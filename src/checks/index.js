import { alertingPlaceholdersCheck } from './alerting-placeholders.js';
import { hardcodedHostnamesAndTimezonesCheck } from './hardcoded-hostnames-and-timezones.js';
import { ismRetentionCheck } from './ism-retention.js';
import { opensearchAuditLoggingCheck } from './opensearch-audit-logging.js';
import { sharedAdminPasswordCheck } from './shared-admin-password.js';
import { snapshotRestoreEvidenceCheck } from './snapshot-restore-evidence.js';
import { tenantRbacCheck } from './tenant-rbac.js';
import { vectorDangerousPatternsCheck } from './vector-dangerous-patterns.js';
import { vectorDlqCheck } from './vector-dlq.js';
import { wazuhReingestionRiskCheck } from './wazuh-reingestion-risk.js';

export const allChecks = [
  sharedAdminPasswordCheck,
  opensearchAuditLoggingCheck,
  snapshotRestoreEvidenceCheck,
  ismRetentionCheck,
  vectorDangerousPatternsCheck,
  vectorDlqCheck,
  hardcodedHostnamesAndTimezonesCheck,
  wazuhReingestionRiskCheck,
  tenantRbacCheck,
  alertingPlaceholdersCheck
];
