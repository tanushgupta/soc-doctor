import { extractVectorSinkBlocks, makeFinding } from '../lib/check-helpers.js';

export const vectorSinkTlsVerifyOffCheck = {
  id: 'vector-sink-tls-verify-off',
  title: 'Vector sink TLS verification disabled',
  category: 'vector',
  defaultSeverity: 'critical',
  recommendation: 'Terminate Vector sinks at endpoints with valid certificates; never disable verification in production.',
  async run(context) {
    const vectorFiles = context.findFiles((file) => /vector/i.test(file.relPath) && file.ext === '.toml');
    const findings = [];

    for (const file of vectorFiles) {
      for (const sink of extractVectorSinkBlocks(file.content)) {
        if (/tls\.verify_certificate\s*=\s*false/i.test(sink.body)) {
          findings.push(makeFinding(
            file.relPath,
            `Sink ${sink.name} has tls.verify_certificate disabled; traffic is cleartext-equivalent to a MITM.`,
            `Issue a valid cert for the downstream endpoint and remove tls.verify_certificate = false from sinks.${sink.name}.`,
            `sinks.${sink.name}: tls.verify_certificate = false`,
            'critical'
          ));
        }
        if (/tls\.verify_hostname\s*=\s*false/i.test(sink.body)) {
          findings.push(makeFinding(
            file.relPath,
            `Sink ${sink.name} has tls.verify_hostname disabled.`,
            `Remove tls.verify_hostname = false from sinks.${sink.name}; use SANs that match your endpoint.`,
            `sinks.${sink.name}: tls.verify_hostname = false`,
            'high'
          ));
        }
      }
    }

    return findings;
  }
};
