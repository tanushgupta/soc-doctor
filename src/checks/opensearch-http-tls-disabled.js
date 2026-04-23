import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const opensearchHttpTlsDisabledCheck = {
  id: 'opensearch-http-tls-disabled',
  title: 'OpenSearch HTTP TLS disabled',
  category: 'opensearch',
  defaultSeverity: 'critical',
  recommendation: 'Enable plugins.security.ssl.http.enabled and terminate TLS at the OpenSearch node rather than trusting the network.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const opensearchYml = context.findFirst((file) => /opensearch\.yml$/i.test(file.name));
    if (!opensearchYml) {
      return [];
    }

    if (/plugins\.security\.ssl\.http\.enabled\s*:\s*false/i.test(opensearchYml.content)) {
      return [
        makeFinding(
          opensearchYml.relPath,
          'HTTP layer TLS is disabled on OpenSearch; API traffic is cleartext.',
          'Set plugins.security.ssl.http.enabled: true and issue valid certs.',
          'plugins.security.ssl.http.enabled: false',
          'critical'
        )
      ];
    }

    return [];
  }
};
