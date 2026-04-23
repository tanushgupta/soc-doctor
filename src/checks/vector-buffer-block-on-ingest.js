import { makeFinding } from '../lib/check-helpers.js';

export const vectorBufferBlockOnIngestCheck = {
  id: 'vector-buffer-block-on-ingest',
  title: 'Vector buffer set to block on full',
  category: 'vector',
  defaultSeverity: 'high',
  recommendation: 'Use when_full = "drop_newest" with a disk buffer and alert on dropped_events_total; blocking propagates backpressure to the source.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      const matches = [...file.content.matchAll(/when_full\s*=\s*"block"/gi)];
      if (matches.length === 0) {
        continue;
      }
      findings.push(makeFinding(
        file.relPath,
        'Vector buffer uses when_full = "block", which propagates backpressure to the source and can freeze ingestion.',
        'Set when_full = "drop_newest" on a disk buffer and alert on component_sent_events_dropped_total.',
        matches[0][0],
        'high'
      ));
    }

    return findings;
  }
};
