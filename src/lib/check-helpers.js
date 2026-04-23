function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function maskSecret(secret) {
  if (!secret || secret.length < 4) {
    return '***';
  }

  return `${secret.slice(0, 2)}***${secret.slice(-2)} (${secret.length} chars)`;
}

export function parseEnvAssignments(content) {
  const entries = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, '').trim();
    entries.push({ key, value });
  }

  return entries;
}

export function collectMatches(content, pattern) {
  const matches = [];
  const regex = pattern instanceof RegExp
    ? new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
    : new RegExp(escapeRegExp(pattern), 'g');

  for (const match of content.matchAll(regex)) {
    matches.push(match[0]);
  }

  return matches;
}

export function repoLooksLikeSocStack(context) {
  return context.files.some((file) => /(wazuh|vector|opensearch|alertmanager)/i.test(file.relPath) || /(wazuh|vector|opensearch|alertmanager)/i.test(file.content));
}

export function unique(items) {
  return [...new Set(items)];
}

export function makeFinding(file, message, recommendation, evidence, severity = undefined) {
  return { file, message, recommendation, evidence, severity };
}

export function extractVectorSinkBlocks(content) {
  const blocks = [];
  const headerRegex = /^\[sinks\.([A-Za-z0-9_-]+)\]\s*$/gm;
  const headers = [...content.matchAll(headerRegex)];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const start = header.index + header[0].length;
    const end = i + 1 < headers.length ? headers[i + 1].index : content.length;
    const rawBody = content.slice(start, end);

    const nextTopLevel = rawBody.match(/^\[(?!sinks\.[A-Za-z0-9_-]+\.)[^\]]+\]/m);
    const body = nextTopLevel ? rawBody.slice(0, nextTopLevel.index) : rawBody;

    blocks.push({ name: header[1], body });
  }

  return blocks;
}
