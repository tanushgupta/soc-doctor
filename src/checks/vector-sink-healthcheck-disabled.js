import { extractVectorSinkBlocks, makeFinding } from '../lib/check-helpers.js';

export const vectorSinkHealthcheckDisabledCheck = {
  id: 'vector-sink-healthcheck-disabled',
  title: 'Vector sink healthcheck disabled',
  category: 'vector',
  defaultSeverity: 'high',
  recommendation: 'Leave healthcheck enabled so Vector surfaces downstream unavailability at startup and via internal metrics.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      for (const sink of extractVectorSinkBlocks(file.content)) {
        if (/healthcheck(?:\.enabled)?\s*=\s*false/i.test(sink.body)) {
          findings.push(makeFinding(
            file.relPath,
            `Sink ${sink.name} has its healthcheck disabled.`,
            'Remove healthcheck.enabled = false; downstream outages should be visible, not hidden.',
            `sinks.${sink.name}: healthcheck disabled`,
            'high'
          ));
        }
      }
    }

    return findings;
  }
};
