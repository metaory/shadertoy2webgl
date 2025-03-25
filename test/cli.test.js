import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CLI_PATH = path.join(process.cwd(), 'src', 'index.js');
const TEST_SHADER_ID = 'MdX3Rr';

function cleanup() {
    const dirs = [TEST_SHADER_ID, 'wdyczG'];
    for (const dir of dirs) {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
}

function runCLI(args = []) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', [CLI_PATH, ...args]);
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        process.on('error', reject);
    });
}

test('CLI', async (t) => {
    cleanup();

    await t.test('should process a valid shader ID', async () => {
        const { code, stdout, stderr } = await runCLI([TEST_SHADER_ID]);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stdout.includes('Processing shader:'), 'Should show processing message');
        assert.ok(stdout.includes('Generated'), 'Should show generated files');
        assert.ok(stdout.includes('Done!'), 'Should show completion message');
        assert.strictEqual(stderr, '', 'Should not have errors');
        
        // Verify files were created
        assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'index.html')), 'HTML file should exist');
        assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'shader.js')), 'JS file should exist');
    });

    await t.test('should handle existing directory without force flag', async () => {
        // First run to create directory
        await runCLI([TEST_SHADER_ID]);
        
        // Second run without force
        const { code, stderr } = await runCLI([TEST_SHADER_ID, 'wdyczG']);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stderr.includes('already exists'), 'Should show directory exists error');
        assert.ok(stderr.includes('--force'), 'Should suggest using --force flag');
        assert.ok(fs.existsSync(path.join('wdyczG', 'index.html')), 'Should still process second shader');
    });

    await t.test('should overwrite existing directory with force flag', async () => {
        // First run to create directory
        await runCLI([TEST_SHADER_ID]);
        
        // Second run with force
        const { code, stdout, stderr } = await runCLI([TEST_SHADER_ID, '--force']);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stdout.includes('Processing shader:'), 'Should show processing message');
        assert.ok(stdout.includes('Generated'), 'Should show generated files');
        assert.ok(stdout.includes('Done!'), 'Should show completion message');
        assert.strictEqual(stderr, '', 'Should not have errors');
    });

    await t.test('should handle missing shader ID', async () => {
        const { code, stdout, stderr } = await runCLI([]);
        
        assert.strictEqual(code, 1, 'Should exit with code 1');
        assert.ok(stderr.includes('Please provide a shader ID'), 'Should show error message');
        assert.strictEqual(stdout, '', 'Should not have output');
    });

    await t.test('should handle invalid shader ID', async () => {
        const { code, stdout, stderr } = await runCLI(['invalid-shader-id']);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stdout.includes('Processing shader: invalid-shader-id'), 'Should show processing message');
        assert.ok(stdout.includes('Done!'), 'Should show completion message');
        assert.ok(stderr.includes('Error processing shader invalid-shader-id'), 'Should show error message');
    });

    await t.test('should process multiple valid shader IDs', async () => {
        const { code, stdout, stderr } = await runCLI([TEST_SHADER_ID, 'wdyczG']);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stdout.includes(`Processing shader: ${TEST_SHADER_ID}`), 'Should show first shader processing');
        assert.ok(stdout.includes('Processing shader: wdyczG'), 'Should show second shader processing');
        assert.ok(stdout.includes('Done!'), 'Should show completion message');
        assert.strictEqual(stderr, '', 'Should not have errors');
        
        // Verify files were created for both shaders
        assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'index.html')), 'First HTML file should exist');
        assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'shader.js')), 'First JS file should exist');
        assert.ok(fs.existsSync(path.join('wdyczG', 'index.html')), 'Second HTML file should exist');
        assert.ok(fs.existsSync(path.join('wdyczG', 'shader.js')), 'Second JS file should exist');
    });

    await t.test('should continue processing after one shader fails', async () => {
        const { code, stdout, stderr } = await runCLI([TEST_SHADER_ID, 'invalid-shader-id', 'wdyczG']);
        
        assert.strictEqual(code, 0, 'Should exit with code 0');
        assert.ok(stdout.includes(`Processing shader: ${TEST_SHADER_ID}`), 'Should show first shader processing');
        assert.ok(stdout.includes('Processing shader: invalid-shader-id'), 'Should show second shader processing');
        assert.ok(stdout.includes('Processing shader: wdyczG'), 'Should show third shader processing');
        assert.ok(stdout.includes('Done!'), 'Should show completion message');
        assert.ok(stderr.includes('Error processing shader invalid-shader-id'), 'Should show error for invalid shader');
        
        // Verify files were created for valid shaders
        assert.ok(fs.existsSync(path.join(TEST_SHADER_ID, 'index.html')), 'First HTML file should exist');
        assert.ok(fs.existsSync(path.join('wdyczG', 'index.html')), 'Third HTML file should exist');
    });

    cleanup();
}); 