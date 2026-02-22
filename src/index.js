#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { shadertoy2webgl } from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const SETUP = `
  1. Open a shader on shadertoy.com
  2. DevTools (F12) > Network > click the "shadertoy" request
  3. Copy the response body (or Save as) into a .json file
  4. Run: shadertoy2webgl thatfile.json
`;

const args = process.argv.slice(2);
const force = args.includes('--force');
const debug = args.includes('--debug');
const help = args.includes('--help') || args.includes('-h');
const showVersion = args.includes('--version') || args.includes('-v');
const filePaths = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));

if (showVersion) {
  console.log(version);
  process.exit(0);
}

if (help) {
  console.log(`Usage: shadertoy2webgl <response.json> [response.json ...]

Options:
  --force   Overwrite existing directories
  --debug   Debug output
  --help    This help
${SETUP}`);
  process.exit(0);
}

if (filePaths.length === 0) {
  console.error('Provide at least one response file (.json from Shadertoy API).');
  console.log(SETUP);
  process.exit(1);
}

const processFile = async (filePath) => {
  const results = await shadertoy2webgl(filePath, { force, debug });
  return results.map(({ shaderId, html, js }) => {
    console.log(`Processing shader: ${shaderId}`);
    console.log(`Generated ${html} and ${js}`);
    return { success: true, shaderId };
  });
};

const formatSummary = ({ success, failed }) => [
  '\nSummary:',
  `✓ Processed: ${success.length}`,
  ...(failed.length > 0 ? [`✗ Failed: ${failed.length} (${failed.join(', ')})`] : []),
  'Done!'
].join('\n');

const run = async () => {
  const allSuccess = [];
  const allFailed = [];
  for (const filePath of filePaths) {
    try {
      const results = await processFile(filePath);
      for (const r of results) allSuccess.push(r.shaderId);
    } catch (error) {
      console.error(`Error [${filePath}]:`, error.message);
      allFailed.push(filePath);
    }
  }
  console.log(formatSummary({ success: allSuccess, failed: allFailed }));
};

run().catch(error => {
  console.error('Fatal:', error.message);
  process.exit(1);
});
