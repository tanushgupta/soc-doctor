import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const tenantRbacCheck = {
  id: 'tenant-rbac',
  title: 'Tenant RBAC configuration present',
  category: 'access-control',
  defaultSeverity: 'medium',
  recommendation: 'Version both roles.yml and roles_mapping.yml so tenant access and subject assignment are auditable.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const rolesFile = context.findFirst((file) => /(^|\/)roles\.yml$/i.test(file.relPath));
    const mappingFile = context.findFirst((file) => /roles_mapping\.yml$/i.test(file.name));

    const findings = [];

    if (!rolesFile) {
      findings.push(makeFinding(
        null,
        'No OpenSearch roles.yml was found.',
        'Version your role definitions so tenant access can be audited and reviewed.',
        'Expected a file like configs/opensearch/security/roles.yml.',
        'high'
      ));
    }

    if (rolesFile && !mappingFile) {
      findings.push(makeFinding(
        rolesFile.relPath,
        'roles.yml is present but no roles_mapping.yml was found.',
        'Add roles_mapping.yml so it is explicit which subjects, users, or backend roles can assume each role.',
        'Expected a sibling file roles_mapping.yml.',
        'high'
      ));
    }

    return findings;
  }
};
