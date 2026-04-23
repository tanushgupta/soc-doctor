import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const tenantRbacCheck = {
  id: 'tenant-rbac',
  title: 'Tenant RBAC scope',
  category: 'access-control',
  defaultSeverity: 'high',
  recommendation: 'Prefer specific index patterns and service roles over broad wildcard access.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const roleFiles = context.findFiles((file) => /roles\.yml$|roles_mapping\.yml$/i.test(file.name));
    if (roleFiles.length === 0) {
      return [
        makeFinding(
          null,
          'No OpenSearch roles.yml or roles_mapping.yml files were found.',
          'Version your role definitions so tenant access can be audited and reviewed.',
          'Expected role files under configs/opensearch/security.',
          'medium'
        )
      ];
    }

    const findings = [];
    for (const file of roleFiles) {
      const wildcardPattern = file.content.match(/["']\*["']/);
      if (wildcardPattern) {
        findings.push(makeFinding(
          file.relPath,
          'RBAC config uses a global wildcard index pattern.',
          'Replace wildcard index access with narrow patterns per service or tenant.',
          wildcardPattern[0],
          'high'
        ));
      }
    }

    return findings;
  }
};
