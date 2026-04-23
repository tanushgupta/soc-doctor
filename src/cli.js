import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scanPath } from './scanner.js';
import { buildReport } from './report.js';
import { renderMarkdownReport, renderTextReport } from './lib/reporters.js';
import { severityPassesThreshold, VALID_SEVERITIES } from './lib/severity.js';

function printHelp() {
  console.log(`soc-doctor

Usage:
  soc-doctor scan <path> [--format text|json|markdown] [--fail-on low|medium|high|critical|none] [--output <file>] [--quiet]
  soc-doctor --help
  soc-doctor --version

Examples:
  soc-doctor scan .
  soc-doctor scan ./stack --format json --fail-on medium
  soc-doctor scan ./stack --format markdown --output report.md
`);
}

async function readPackageVersion() {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  return packageJson.version;
}

function parseArgs(argv) {
  const [command, maybeTarget, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    return { help: true };
  }

  if (command === '--version' || command === '-v') {
    return { version: true };
  }

  if (command !== 'scan') {
    throw new Error(`Unknown command "${command}". Only "scan" is supported right now.`);
  }

  const options = {
    command,
    target: maybeTarget ?? '.',
    format: 'text',
    failOn: 'high',
    output: null,
    quiet: false
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === '--format') {
      options.format = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--fail-on') {
      options.failOn = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--output') {
      options.output = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--quiet') {
      options.quiet = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return options;
    }

    if (arg === '--version' || arg === '-v') {
      options.version = true;
      return options;
    }

    throw new Error(`Unknown flag "${arg}".`);
  }

  if (!['text', 'json', 'markdown'].includes(options.format)) {
    throw new Error(`Unsupported format "${options.format}". Use text, json, or markdown.`);
  }

  if (!VALID_SEVERITIES.includes(options.failOn)) {
    throw new Error(`Unsupported fail-on severity "${options.failOn}". Use ${VALID_SEVERITIES.join(', ')}.`);
  }

  return options;
}

async function writeOutputFile(outputPath, contents) {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, 'utf8');
}

export async function runCli(argv) {
  const options = parseArgs(argv);

  if (options.version) {
    console.log(await readPackageVersion());
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  const target = resolve(process.cwd(), options.target);
  const findings = await scanPath(target);
  const report = buildReport({ target, findings });

  let rendered;
  if (options.format === 'json') {
    rendered = `${JSON.stringify(report, null, 2)}\n`;
  } else if (options.format === 'markdown') {
    rendered = `${renderMarkdownReport(report)}\n`;
  } else {
    rendered = `${renderTextReport(report)}\n`;
  }

  if (options.output) {
    await writeOutputFile(resolve(process.cwd(), options.output), rendered);
  }

  if (!options.quiet) {
    process.stdout.write(rendered);
  }

  const shouldFail = report.findings.some((finding) => severityPassesThreshold(finding.severity, options.failOn));
  if (shouldFail) {
    process.exitCode = 1;
  }
}
