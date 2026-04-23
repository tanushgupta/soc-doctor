import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const ismRetentionCheck = {
  id: 'ism-retention',
  title: 'Index lifecycle retention coverage',
  category: 'opensearch',
  defaultSeverity: 'high',
  recommendation: 'Add ISM policies and attach them through templates so hot data does not grow forever.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const ismFiles = context.findFiles((file) => /\/ism\/|ism_template|_plugins\/_ism|retention|lifecycle/i.test(file.relPath) || /ism_template|_plugins\/_ism|rollover|delete/i.test(file.content));
    if (ismFiles.length === 0) {
      return [
        makeFinding(
          null,
          'No ISM policy or retention configuration was found.',
          'Create index lifecycle policies for alerts, audit logs, and DLQ indices.',
          'No files matched ISM lifecycle patterns.',
          'high'
        )
      ];
    }

    const hasDeleteTransition = ismFiles.some((file) => /delete/i.test(file.content));
    if (!hasDeleteTransition) {
      return [
        makeFinding(
          ismFiles[0].relPath,
          'ISM files exist, but no delete transition or retention window was found.',
          'Add explicit retention windows so old indices are deleted on schedule.',
          'No delete phase detected in ISM-related files.',
          'medium'
        )
      ];
    }

    return [];
  }
};
