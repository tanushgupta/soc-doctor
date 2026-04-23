import { alertingPlaceholdersCheck } from './alerting-placeholders.js';
import { hardcodedHostnamesAndTimezonesCheck } from './hardcoded-hostnames-and-timezones.js';
import { ismRetentionCheck } from './ism-retention.js';
import { opensearchAuditDisabledCheck } from './opensearch-audit-disabled.js';
import { opensearchAuditLoggingCheck } from './opensearch-audit-logging.js';
import { opensearchDefaultSecurityInitCheck } from './opensearch-default-security-init.js';
import { opensearchHttpTlsDisabledCheck } from './opensearch-http-tls-disabled.js';
import { opensearchNetworkBindingCheck } from './opensearch-network-binding.js';
import { rbacClusterAllSprawlCheck } from './rbac-cluster-all-sprawl.js';
import { rbacNonAdminWildcardCheck } from './rbac-non-admin-wildcard.js';
import { sharedAdminPasswordCheck } from './shared-admin-password.js';
import { snapshotRestoreEvidenceCheck } from './snapshot-restore-evidence.js';
import { tenantRbacCheck } from './tenant-rbac.js';
import { vectorBufferBlockOnIngestCheck } from './vector-buffer-block-on-ingest.js';
import { vectorDangerousPatternsCheck } from './vector-dangerous-patterns.js';
import { vectorDlqCheck } from './vector-dlq.js';
import { vectorInternalLogsMissingCheck } from './vector-internal-logs-missing.js';
import { vectorMissingBulkActionCheck } from './vector-missing-bulk-action.js';
import { vectorNoDiskBufferCheck } from './vector-no-disk-buffer.js';
import { vectorSinkHealthcheckDisabledCheck } from './vector-sink-healthcheck-disabled.js';
import { vectorSinkTlsVerifyOffCheck } from './vector-sink-tls-verify-off.js';
import { wazuhReingestionRiskCheck } from './wazuh-reingestion-risk.js';

export const allChecks = [
  sharedAdminPasswordCheck,
  opensearchAuditLoggingCheck,
  opensearchAuditDisabledCheck,
  opensearchNetworkBindingCheck,
  opensearchHttpTlsDisabledCheck,
  opensearchDefaultSecurityInitCheck,
  snapshotRestoreEvidenceCheck,
  ismRetentionCheck,
  vectorDangerousPatternsCheck,
  vectorDlqCheck,
  vectorSinkHealthcheckDisabledCheck,
  vectorSinkTlsVerifyOffCheck,
  vectorBufferBlockOnIngestCheck,
  vectorNoDiskBufferCheck,
  vectorMissingBulkActionCheck,
  vectorInternalLogsMissingCheck,
  hardcodedHostnamesAndTimezonesCheck,
  wazuhReingestionRiskCheck,
  tenantRbacCheck,
  rbacNonAdminWildcardCheck,
  rbacClusterAllSprawlCheck,
  alertingPlaceholdersCheck
];
