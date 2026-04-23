import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

function splitRoles(content) {
  const roles = {};
  let current = null;
  let buf = [];

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][\w]*)\s*:\s*$/);
    if (match) {
      if (current) {
        roles[current] = buf.join('\n');
      }
      current = match[1];
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) {
    roles[current] = buf.join('\n');
  }
  return roles;
}

function hasClusterAll(body) {
  return /cluster_permissions\s*:[^\n]*\n(?:\s+-[^\n]*\n)*?\s*-\s*["']?cluster_all["']?/m.test(body)
    || /cluster_permissions\s*:\s*\[[^\]]*["']?cluster_all["']?/m.test(body);
}

export const rbacClusterAllSprawlCheck = {
  id: 'rbac-cluster-all-sprawl',
  title: 'cluster_all granted to more than one role',
  category: 'access-control',
  defaultSeverity: 'medium',
  recommendation: 'Reserve cluster_all for a single break-glass role and use scoped cluster permissions elsewhere.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const roleFiles = context.findFiles((file) => /roles\.yml$/i.test(file.name) && !/roles_mapping/i.test(file.name));
    const findings = [];

    for (const file of roleFiles) {
      const roles = splitRoles(file.content);
      const offenders = Object.entries(roles)
        .filter(([, body]) => hasClusterAll(body))
        .map(([name]) => name);

      if (offenders.length > 1) {
        findings.push(makeFinding(
          file.relPath,
          'cluster_all is granted to multiple roles, widening the blast radius of any single token compromise.',
          'Keep cluster_all on one break-glass role; downgrade others to cluster_monitor or more specific permissions.',
          `Roles with cluster_all: ${offenders.join(', ')}`,
          'medium'
        ));
      }
    }

    return findings;
  }
};
