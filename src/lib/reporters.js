function summaryLine(report) {
  const { counts, total, score } = report.summary;
  return `Score ${score}/100 | ${total} finding(s) | critical ${counts.critical}, high ${counts.high}, medium ${counts.medium}, low ${counts.low}, info ${counts.info}`;
}

export function renderTextReport(report) {
  const lines = [];
  lines.push(`soc-doctor scan for ${report.target}`);
  lines.push(summaryLine(report));
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings. This pass is clean.');
    return lines.join('\n');
  }

  for (const [index, finding] of report.findings.entries()) {
    lines.push(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.checkId} — ${finding.message}`);
    if (finding.file) {
      lines.push(`   file: ${finding.file}`);
    }
    if (finding.evidence) {
      lines.push(`   evidence: ${finding.evidence}`);
    }
    if (finding.recommendation) {
      lines.push(`   fix: ${finding.recommendation}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function renderMarkdownReport(report) {
  const lines = [];
  lines.push('# soc-doctor report');
  lines.push('');
  lines.push(`- **Target:** \`${report.target}\``);
  lines.push(`- **Generated:** \`${report.generatedAt}\``);
  lines.push(`- **Summary:** ${summaryLine(report)}`);
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings. This pass is clean.');
    return lines.join('\n');
  }

  lines.push('| Severity | Check | File | Message |');
  lines.push('| --- | --- | --- | --- |');

  for (const finding of report.findings) {
    lines.push(`| ${finding.severity} | ${finding.checkId} | ${finding.file ?? '-'} | ${finding.message.replaceAll('|', '\\|')} |`);
  }

  lines.push('');
  lines.push('## Details');
  lines.push('');

  for (const finding of report.findings) {
    lines.push(`### ${finding.checkId}`);
    lines.push('');
    lines.push(`- **Severity:** ${finding.severity}`);
    if (finding.file) {
      lines.push(`- **File:** \`${finding.file}\``);
    }
    lines.push(`- **Message:** ${finding.message}`);
    if (finding.evidence) {
      lines.push(`- **Evidence:** \`${finding.evidence}\``);
    }
    if (finding.recommendation) {
      lines.push(`- **Recommendation:** ${finding.recommendation}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
