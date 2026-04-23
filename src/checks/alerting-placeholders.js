import { makeFinding } from '../lib/check-helpers.js';

const PLACEHOLDER_PATTERNS = [
  /YOUR_WEBHOOK_URL/g,
  /REPLACE_WITH_[A-Z0-9_]+/g,
  /<WEBHOOK[^>]*>/g,
  /<SLACK_[A-Z0-9_]+>/g,
  /hooks\.slack\.com\/services\/T\.\.\./g
];

export const alertingPlaceholdersCheck = {
  id: 'alerting-placeholders',
  title: 'Alerting placeholder secrets',
  category: 'alerting',
  defaultSeverity: 'high',
  recommendation: 'Replace placeholders with secret references and test delivery through a real receiver.',
  async run(context) {
    const relevantFiles = context.findFiles((file) => /alertmanager|notification|slack|webhook|\.env/i.test(file.relPath));
    const findings = [];

    for (const file of relevantFiles) {
      for (const pattern of PLACEHOLDER_PATTERNS) {
        const match = file.content.match(pattern);
        if (match) {
          findings.push(makeFinding(
            file.relPath,
            'Alerting config still contains placeholder webhook material.',
            'Wire real webhook values through Vault or another secret source and add a synthetic test alert.',
            match[0],
            'high'
          ));
          break;
        }
      }
    }

    return findings;
  }
};
