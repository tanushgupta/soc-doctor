import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const opensearchAuditLoggingCheck = {
  id: 'opensearch-audit-logging',
  title: 'OpenSearch audit logging coverage',
  category: 'opensearch',
  defaultSeverity: 'high',
  recommendation: 'Enable REST and TRANSPORT audit logging and keep the audit config in version control.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const opensearchFiles = context.findFiles((file) => /opensearch/i.test(file.relPath));
    if (opensearchFiles.length === 0) {
      return [];
    }

    const findings = [];
    const opensearchYml = opensearchFiles.find((file) => /opensearch\.yml$/i.test(file.name));
    const auditFile = opensearchFiles.find((file) => /audit\.yml$/i.test(file.name));

    if (!auditFile) {
      findings.push(makeFinding(
        opensearchYml?.relPath ?? null,
        'No dedicated OpenSearch audit.yml configuration was found.',
        'Add audit.yml and version it alongside the main OpenSearch config.',
        'Expected a file like configs/opensearch/security-config/audit.yml.',
        'high'
      ));
      return findings;
    }

    if (!/enable_transport\s*:\s*true/i.test(auditFile.content)) {
      findings.push(makeFinding(
        auditFile.relPath,
        'Audit logging exists but TRANSPORT layer logging is not enabled.',
        'Set enable_transport: true so cluster-level admin operations are visible.',
        'Missing enable_transport: true.',
        'high'
      ));
    }

    if (!/enable_rest\s*:\s*true/i.test(auditFile.content)) {
      findings.push(makeFinding(
        auditFile.relPath,
        'Audit logging exists but REST layer logging is not enabled.',
        'Set enable_rest: true to record inbound API activity.',
        'Missing enable_rest: true.',
        'medium'
      ));
    }

    if (opensearchYml && !/plugins\.security\.audit\./i.test(opensearchYml.content)) {
      findings.push(makeFinding(
        opensearchYml.relPath,
        'OpenSearch config does not reference audit logging settings.',
        'Set plugins.security.audit settings and route audit logs into a dedicated index family.',
        'No plugins.security.audit.* keys found.',
        'medium'
      ));
    }

    return findings;
  }
};
