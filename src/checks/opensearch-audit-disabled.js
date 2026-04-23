import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const opensearchAuditDisabledCheck = {
  id: 'opensearch-audit-disabled',
  title: 'OpenSearch audit plugin disabled',
  category: 'opensearch',
  defaultSeverity: 'high',
  recommendation: 'Set config.enabled and audit.enable_rest/enable_transport to true so the audit plugin actually emits events.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const auditFile = context.findFirst((file) => /audit\.yml$/i.test(file.name));
    if (!auditFile) {
      return [];
    }

    const findings = [];

    if (/^\s*enabled\s*:\s*false/mi.test(auditFile.content)) {
      findings.push(makeFinding(
        auditFile.relPath,
        'audit.yml has config.enabled: false so the audit plugin does not run.',
        'Flip config.enabled to true and deploy the updated audit.yml.',
        'enabled: false',
        'high'
      ));
    }

    if (/enable_rest\s*:\s*false/i.test(auditFile.content)) {
      findings.push(makeFinding(
        auditFile.relPath,
        'Audit plugin is configured with enable_rest: false.',
        'Set enable_rest: true to capture inbound API activity.',
        'enable_rest: false',
        'high'
      ));
    }

    if (/enable_transport\s*:\s*false/i.test(auditFile.content)) {
      findings.push(makeFinding(
        auditFile.relPath,
        'Audit plugin is configured with enable_transport: false.',
        'Set enable_transport: true to capture cluster-level admin operations.',
        'enable_transport: false',
        'high'
      ));
    }

    return findings;
  }
};
