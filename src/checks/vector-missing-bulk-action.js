import { extractVectorSinkBlocks, makeFinding } from '../lib/check-helpers.js';

export const vectorMissingBulkActionCheck = {
  id: 'vector-missing-bulk-action',
  title: 'Vector elasticsearch sink uses unsafe bulk.action',
  category: 'vector',
  defaultSeverity: 'medium',
  recommendation: 'Use bulk.action = "create" with an id_key so duplicate deliveries surface as 409s instead of silently overwriting events.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      for (const sink of extractVectorSinkBlocks(file.content)) {
        if (!/type\s*=\s*"elasticsearch"/i.test(sink.body)) {
          continue;
        }

        const actionMatch = sink.body.match(/bulk\.action\s*=\s*"([^"]+)"/i);
        if (!actionMatch) {
          findings.push(makeFinding(
            file.relPath,
            `Elasticsearch sink ${sink.name} does not set bulk.action; Vector defaults silently overwrite on _id collision.`,
            `Set bulk.action = "create" and an id_key on sinks.${sink.name}.`,
            `sinks.${sink.name}: bulk.action unset`,
            'medium'
          ));
          continue;
        }

        if (actionMatch[1].toLowerCase() === 'index') {
          findings.push(makeFinding(
            file.relPath,
            `Elasticsearch sink ${sink.name} uses bulk.action = "index", which silently overwrites duplicates.`,
            `Switch sinks.${sink.name} to bulk.action = "create" so re-delivery surfaces as 409 rather than clobbering existing docs.`,
            `sinks.${sink.name}: bulk.action = "index"`,
            'medium'
          ));
        }
      }
    }

    return findings;
  }
};
