import { collectMatches, makeFinding } from '../lib/check-helpers.js';

export const vectorDangerousPatternsCheck = {
  id: 'vector-dangerous-patterns',
  title: 'Vector config footguns',
  category: 'vector',
  defaultSeverity: 'high',
  recommendation: 'Use fallible parsing and validate Vector configs in CI before merge.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      const parseBangMatches = collectMatches(file.content, /parse_json!\(/g);
      if (parseBangMatches.length > 0) {
        findings.push(makeFinding(
          file.relPath,
          'Vector config still uses parse_json!(), which can abort transforms on malformed input.',
          'Switch to fallible parsing and route dropped events into a DLQ.',
          parseBangMatches[0],
          'high'
        ));
      }

      const invalidStringFallbackMatches = collectMatches(file.content, /string!\([^)]+\)\s*\?\?/g);
      if (invalidStringFallbackMatches.length > 0) {
        findings.push(makeFinding(
          file.relPath,
          'Vector config combines string!() with ?? fallback, which is an unreachable fallback pattern.',
          'Use string() instead of string!() when you need a fallback.',
          invalidStringFallbackMatches[0],
          'high'
        ));
      }

      const invalidPrometheusBuffer = /type\s*=\s*"prometheus_exporter"[\s\S]{0,400}?\n\s*when_full\s*=/.test(file.content);
      if (invalidPrometheusBuffer) {
        findings.push(makeFinding(
          file.relPath,
          'prometheus_exporter sink appears to include when_full, which is not valid on that sink type.',
          'Remove when_full from prometheus_exporter sections and validate config with vector validate.',
          'Found when_full near a prometheus_exporter sink.',
          'high'
        ));
      }

      const unsafeCoercionMatches = collectMatches(file.content, /to_(?:int|float|bool|timestamp)!\(/g);
      if (unsafeCoercionMatches.length > 0) {
        findings.push(makeFinding(
          file.relPath,
          'VRL uses non-fallible type coercion (to_int!, to_float!, to_bool!, to_timestamp!); one malformed field aborts the transform.',
          'Use the fallible form with a fallback, e.g. `count = to_int(.count) ?? 0`, and route errors through reroute_dropped.',
          unsafeCoercionMatches[0],
          'high'
        ));
      }

      const timestampOverwrite = collectMatches(file.content, /\.(?:@?timestamp|event_timestamp)\s*=\s*now\(\)/g);
      if (timestampOverwrite.length > 0) {
        findings.push(makeFinding(
          file.relPath,
          'VRL overwrites the event timestamp with now(), destroying the source-provided time and breaking incident timelines.',
          'Preserve the source timestamp when available; only set now() as a fallback when the source has no time field.',
          timestampOverwrite[0],
          'medium'
        ));
      }
    }

    return findings;
  }
};
