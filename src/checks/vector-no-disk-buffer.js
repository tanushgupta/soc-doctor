import { extractVectorSinkBlocks, makeFinding } from '../lib/check-helpers.js';

export const vectorNoDiskBufferCheck = {
  id: 'vector-no-disk-buffer',
  title: 'Vector critical sink has no disk buffer',
  category: 'vector',
  defaultSeverity: 'medium',
  recommendation: 'Attach a disk buffer to sinks feeding durable storage so Vector restarts or short downstream outages do not lose events.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      for (const sink of extractVectorSinkBlocks(file.content)) {
        const isDurableTarget = /type\s*=\s*"(elasticsearch|opensearch|kafka|loki|s3)"/i.test(sink.body);
        if (!isDurableTarget) {
          continue;
        }
        const hasDiskBuffer = /buffer\.type\s*=\s*"disk"/i.test(sink.body)
          || /\[sinks\.[A-Za-z0-9_-]+\.buffer\]\s*\n[^[]*?type\s*=\s*"disk"/i.test(sink.body);
        if (!hasDiskBuffer) {
          findings.push(makeFinding(
            file.relPath,
            `Sink ${sink.name} writes to durable storage without a disk buffer; events in flight are lost on Vector restart.`,
            `Add buffer.type = "disk" with an explicit max_size to sinks.${sink.name}.`,
            `sinks.${sink.name}: no disk buffer`,
            'medium'
          ));
        }
      }
    }

    return findings;
  }
};
