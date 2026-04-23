import { makeFinding, repoLooksLikeSocStack } from '../lib/check-helpers.js';

export const opensearchNetworkBindingCheck = {
  id: 'opensearch-network-binding',
  title: 'OpenSearch network binding exposes cluster',
  category: 'opensearch',
  defaultSeverity: 'critical',
  recommendation: 'Bind OpenSearch to _site_ or a private interface and front it with a gateway or private load balancer.',
  async run(context) {
    if (!repoLooksLikeSocStack(context)) {
      return [];
    }

    const opensearchYml = context.findFirst((file) => /opensearch\.yml$/i.test(file.name));
    if (!opensearchYml) {
      return [];
    }

    const findings = [];
    const bindMatch = opensearchYml.content.match(/^\s*network\.host\s*:\s*(\S+)/mi);

    if (bindMatch) {
      const value = bindMatch[1].replace(/["']/g, '');
      if (value === '0.0.0.0' || /_global_/.test(value)) {
        findings.push(makeFinding(
          opensearchYml.relPath,
          `OpenSearch network.host is set to ${value}, exposing the cluster on all interfaces.`,
          'Use _site_, _local_, or a specific private IP and restrict access at the network layer.',
          bindMatch[0].trim(),
          'critical'
        ));
      }
    }

    return findings;
  }
};
