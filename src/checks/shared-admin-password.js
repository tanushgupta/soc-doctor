import { makeFinding, maskSecret, parseEnvAssignments } from '../lib/check-helpers.js';

const WEAK_PASSWORDS = new Set([
  'changeme',
  'change-me',
  'password',
  'admin',
  'admin123',
  'secret',
  '123456',
  'ExamplePass@123'
]);

export const sharedAdminPasswordCheck = {
  id: 'shared-admin-password',
  title: 'Shared admin password reuse',
  category: 'secrets',
  defaultSeverity: 'high',
  recommendation: 'Use unique per-service credentials and pull them from Vault or another secret store.',
  async run(context) {
    const envFiles = context.findFiles((file) => file.name === '.env' || file.name.endsWith('.env') || file.name.includes('.env.'));
    const valueToKeys = new Map();
    const findings = [];

    for (const file of envFiles) {
      for (const { key, value } of parseEnvAssignments(file.content)) {
        if (!/PASSWORD|PASS$|SECRET/.test(key) || !value || value.startsWith('${')) {
          continue;
        }

        if (WEAK_PASSWORDS.has(value)) {
          findings.push(makeFinding(
            file.relPath,
            `Weak password detected in ${key}.`,
            'Replace default or guessable secrets immediately and rotate all dependent services.',
            `${key}=${maskSecret(value)}`,
            'critical'
          ));
        }

        if (!valueToKeys.has(value)) {
          valueToKeys.set(value, []);
        }
        valueToKeys.get(value).push(`${file.relPath}:${key}`);
      }
    }

    for (const [value, keys] of valueToKeys.entries()) {
      if (keys.length >= 2) {
        findings.push(makeFinding(
          keys[0].split(':')[0],
          'The same secret is reused across multiple service credentials.',
          'Give every service its own credential and store only references in .env files.',
          `${maskSecret(value)} reused by ${keys.join(', ')}`,
          'high'
        ));
      }
    }

    return findings;
  }
};
