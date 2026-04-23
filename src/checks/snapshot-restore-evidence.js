import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const snapshotRestoreEvidenceCheck = {
  id: 'snapshot-restore-evidence',
  title: 'Snapshot and restore evidence',
  category: 'resilience',
  defaultSeverity: 'medium',
  recommendation: 'Version a restore drill runbook or weekly report that proves snapshots can be restored.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const snapshotFiles = context.findFiles((file) => /snapshot|restore|drill|backup/i.test(file.relPath) || /snapshot|restore|drill|backup/i.test(file.content));
    const hasRestoreEvidence = snapshotFiles.some((file) => /restore/i.test(file.content) && /snapshot/i.test(file.content));

    if (hasRestoreEvidence) {
      return [];
    }

    return [
      makeFinding(
        null,
        'No obvious snapshot restore drill evidence was found in the repository.',
        'Add a restore-drill report, test script, or runbook so backup claims are auditable.',
        'This is heuristic: no file mentioned both snapshot and restore.',
        'medium'
      )
    ];
  }
};
