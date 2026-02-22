import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CLI_PATH = path.join(process.cwd(), 'src', 'index.js');
const FIXTURE = path.join(process.cwd(), 'test', 'fixtures', 'response.json');
const INVALID = path.join(process.cwd(), 'test', 'fixtures', 'invalid.json');
const TEST_SHADER_ID = 'MdX3Rr';

function cleanup() {
  if (fs.existsSync(TEST_SHADER_ID)) {
    fs.rmSync(TEST_SHADER_ID, { recursive: true, force: true });
  }
}

function runCLI(args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [CLI_PATH, ...args]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => resolve({ code, stdout, stderr }));
    proc.on('error', reject);
  });
}

test('CLI', async (t) => {
  cleanup();

  await t.test('should process a response file', async () => {
    const { code, stdout, stderr } = await runCLI([FIXTURE]);
    assert.strictEqual(code, 0, 'Should exit 0');
    assert.ok(stdout.includes('Processing shader:'), 'Should show processing');
    assert.ok(stdout.includes('Generated'), 'Should show generated files');
    assert.ok(stdout.includes('Done!'), 'Should show Done!');
    assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'index.html')), 'HTML should exist');
    assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'shader.js')), 'JS should exist');
  });

  await t.test('should refuse to overwrite without --force', async () => {
    await runCLI([FIXTURE]);
    const { stderr } = await runCLI([FIXTURE]);
    assert.ok(stderr.includes('exists') || stderr.includes('--force') || stderr.includes('overwrite'), 'Should mention overwrite');
  });

  await t.test('should overwrite with --force', async () => {
    const { code, stdout } = await runCLI([FIXTURE, '--force']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('Processing shader:'));
  });

  await t.test('should require at least one file', async () => {
    const { code, stderr } = await runCLI([]);
    assert.strictEqual(code, 1);
    assert.ok(stderr.includes('response file') || stderr.includes('Provide'), 'Should ask for file');
  });

  await t.test('should report error for invalid file', async () => {
    const { code, stderr } = await runCLI([INVALID]);
    assert.strictEqual(code, 0, 'CLI exits 0 but reports failure in summary');
    assert.ok(stderr.includes('Error') || stderr.includes(INVALID), 'Should show error');
  });

  await t.test('should process multiple files', async () => {
    cleanup();
    const { code, stdout } = await runCLI([FIXTURE, FIXTURE, '--force']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('Processing shader:'));
    assert.ok(stdout.includes('Done!'));
  });

  cleanup();
});
