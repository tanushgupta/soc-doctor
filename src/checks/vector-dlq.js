import { makeFinding } from '../lib/check-helpers.js';

export const vectorDlqCheck = {
  id: 'vector-dlq',
  title: 'Vector DLQ coverage',
  category: 'vector',
  defaultSeverity: 'medium',
  recommendation: 'Add reroute_dropped, DLQ transforms, and durable sinks for parse failures.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      const looksLikeParser = /parse_json|parse_syslog|parse_timestamp|^\[transforms\.parse_/m.test(file.content);
      if (!looksLikeParser) {
        continue;
      }

      const hasReroute = /reroute_dropped\s*=\s*true/i.test(file.content);
      const hasDlq = /dlq|\.dropped|dead\s*letter/i.test(file.content);

      if (!hasReroute || !hasDlq) {
        findings.push(makeFinding(
          file.relPath,
          'Vector parser config does not show a complete DLQ path for bad events.',
          'Enable reroute_dropped = true and add a DLQ transform/sink for parse failures.',
          `reroute_dropped=${hasReroute}; dlq_artifacts=${hasDlq}`,
          'medium'
        ));
      }
    }

    return findings;
  }
};
