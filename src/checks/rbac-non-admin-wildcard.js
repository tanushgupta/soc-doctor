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

function isAdminRoleName(name) {
  return /admin|superuser|root/i.test(name);
}

function hasWildcardIndexPattern(body) {
  return /index_patterns\s*:[^\n]*\n(?:\s+-[^\n]*\n)*?\s*-\s*["']\*["']/m.test(body)
    || /index_patterns\s*:\s*\[\s*["']\*["']\s*\]/.test(body);
}

export const rbacNonAdminWildcardCheck = {
  id: 'rbac-non-admin-wildcard',
  title: 'Non-admin role has wildcard index access',
  category: 'access-control',
  defaultSeverity: 'high',
  recommendation: 'Scope each service role to the specific index patterns it actually needs.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const roleFiles = context.findFiles((file) => /roles\.yml$/i.test(file.name) && !/roles_mapping/i.test(file.name));
    const findings = [];

    for (const file of roleFiles) {
      const roles = splitRoles(file.content);
      for (const [name, body] of Object.entries(roles)) {
        if (isAdminRoleName(name)) {
          continue;
        }
        if (hasWildcardIndexPattern(body)) {
          findings.push(makeFinding(
            file.relPath,
            `Role ${name} grants access to index pattern "*".`,
            `Replace the wildcard pattern in ${name} with the specific prefixes the service writes to or reads from.`,
            `${name}: index_patterns includes "*"`,
            'high'
          ));
        }
      }
    }

    return findings;
  }
};
