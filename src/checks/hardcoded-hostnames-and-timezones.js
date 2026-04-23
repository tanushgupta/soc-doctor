import { makeFinding } from '../lib/check-helpers.js';

export const hardcodedHostnamesAndTimezonesCheck = {
  id: 'hardcoded-hostnames-and-timezones',
  title: 'Hardcoded hostnames and timezone assumptions',
  category: 'ingestion',
  defaultSeverity: 'medium',
  recommendation: 'Use environment-driven host metadata and device timezone offsets instead of literals.',
  async run(context) {
    const relevantFiles = context.findFiles((file) => /\.(toml|ya?ml|conf|env|md)$/i.test(file.name) || /vector|fortigate|zeek|wazuh|opensearch/i.test(file.relPath));
    const findings = [];

    for (const file of relevantFiles) {
      const hardcodedHostMatch = file.content.match(/\.host\.(?:name|hostname)\s*=\s*"([^"$][^"]+)"/);
      if (hardcodedHostMatch) {
        findings.push(makeFinding(
          file.relPath,
          'Host metadata is hardcoded in the pipeline configuration.',
          'Replace hardcoded host values with HOSTNAME or HOST_FQDN environment lookups.',
          hardcodedHostMatch[0],
          'high'
        ));
      }

      const zSuffixTimestamp = file.content.match(/timestamp_str\s*=.*\+\s*"Z"/);
      if (zSuffixTimestamp || /%Y-%m-%dT%H:%M:%SZ/.test(file.content)) {
        findings.push(makeFinding(
          file.relPath,
          'Timestamp parsing appears to assume UTC with a hardcoded Z suffix.',
          'Use a device-specific timezone offset env var and parse with %:z when the source log lacks timezone data.',
          zSuffixTimestamp?.[0] ?? '%Y-%m-%dT%H:%M:%SZ',
          'medium'
        ));
      }
    }

    return findings;
  }
};
