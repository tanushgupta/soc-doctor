import { makeFinding } from '../lib/check-helpers.js';

export const vectorInternalLogsMissingCheck = {
  id: 'vector-internal-logs-missing',
  title: 'Vector emits no internal telemetry',
  category: 'vector',
  defaultSeverity: 'medium',
  recommendation: 'Add an internal_logs or internal_metrics source so pipeline health is observable and alertable.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    if (vectorFiles.length === 0) {
      return [];
    }

    const anyInternal = vectorFiles.some((file) =>
      /\[sources\.[A-Za-z0-9_-]+\]\s*\n[^[]*?type\s*=\s*"internal_(?:logs|metrics)"/i.test(file.content)
    );

    if (anyInternal) {
      return [];
    }

    return [
      makeFinding(
        null,
        'No Vector config declares an internal_logs or internal_metrics source.',
        'Add [sources.vector_internal] with type = "internal_metrics" and route it to Prometheus so you can alert on the pipeline itself.',
        'No internal_logs or internal_metrics source found in any vector .toml.',
        'medium'
      )
    ];
  }
};
