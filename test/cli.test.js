import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

async function readExpectedVersion() {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  return packageJson.version;
}

function runCli(args) {
  return spawnSync(process.execPath, [fileURLToPath(new URL('../bin/soc-doctor.js', import.meta.url)), ...args], {
    encoding: 'utf8'
  });
}

test('prints package version with --version', async () => {
  const expectedVersion = await readExpectedVersion();
  const result = runCli(['--version']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${expectedVersion}\n`);
  assert.equal(result.stderr, '');
});

test('prints package version with -v', async () => {
  const expectedVersion = await readExpectedVersion();
  const result = runCli(['-v']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${expectedVersion}\n`);
  assert.equal(result.stderr, '');
});
