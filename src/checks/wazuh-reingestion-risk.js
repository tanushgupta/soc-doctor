import { makeFinding } from '../lib/check-helpers.js';

export const wazuhReingestionRiskCheck = {
  id: 'wazuh-reingestion-risk',
  title: 'Wazuh re-ingestion and dedup risk',
  category: 'wazuh',
  defaultSeverity: 'high',
  recommendation: 'Use read_from = "end", content-based fingerprints, and deterministic id_key values.',
  async run(context) {
    const file = context.findFirst((candidate) => /vector-wazuh\.toml$/i.test(candidate.name));
    if (!file) {
      return [];
    }

    const problems = [];
    if (/read_from\s*=\s*"beginning"/i.test(file.content)) {
      problems.push('read_from = "beginning"');
    }

    if (/fingerprint\.strategy\s*=\s*"device_and_inode"/i.test(file.content)) {
      problems.push('fingerprint.strategy = "device_and_inode"');
    }

    if (!/id_key\s*=/.test(file.content)) {
      problems.push('missing id_key');
    }

    if (problems.length === 0) {
      return [];
    }

    return [
      makeFinding(
        file.relPath,
        'Wazuh source config is vulnerable to duplicate replay after checkpoint loss or rotation.',
        'Tail from end, switch to checksum fingerprints, and set id_key to a deterministic alert identifier.',
        problems.join(', '),
        'high'
      )
    ];
  }
};
