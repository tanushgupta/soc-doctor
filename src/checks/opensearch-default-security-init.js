import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const opensearchDefaultSecurityInitCheck = {
  id: 'opensearch-default-security-init',
  title: 'OpenSearch allow_default_init_securityindex enabled',
  category: 'opensearch',
  defaultSeverity: 'medium',
  recommendation: 'Remove allow_default_init_securityindex after first bootstrap; never leave it on in running clusters.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const opensearchYml = context.findFirst((file) => /opensearch\.yml$/i.test(file.name));
    if (!opensearchYml) {
      return [];
    }

    if (/plugins\.security\.allow_default_init_securityindex\s*:\s*true/i.test(opensearchYml.content)) {
      return [
        makeFinding(
          opensearchYml.relPath,
          'allow_default_init_securityindex is true, so a restart can reseed the security index to defaults.',
          'Set the flag to false once the cluster is initialized; initialize the security index explicitly in CI.',
          'plugins.security.allow_default_init_securityindex: true',
          'medium'
        )
      ];
    }

    return [];
  }
};
