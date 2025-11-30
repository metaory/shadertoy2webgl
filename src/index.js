#!/usr/bin/env node

import { shadertoy2webgl } from './lib.js';

const SETUP_INSTRUCTIONS = `
To fetch shaders, create .shadertoy.curl:

  1. Open shadertoy.com in browser
  2. Open DevTools (F12) > Network tab
  3. Click any shader to load it
  4. Right-click "shadertoy" request > Copy > Copy as cURL
  5. Save to .shadertoy.curl (or ~/.shadertoy.curl)

Example: pbpaste > .shadertoy.curl
`;

const args = process.argv.slice(2);
const force = args.includes('--force');
const debug = args.includes('--debug');
const help = args.includes('--help') || args.includes('-h');
const shaderIds = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

if (help) {
    console.log(`Usage: shadertoy2webgl <shader-id> [options]

Options:
  --force   Overwrite existing directory
  --debug   Show debug output
  --help    Show this help
${SETUP_INSTRUCTIONS}`);
    process.exit(0);
}

if (shaderIds.length === 0) {
    console.error('Please provide at least one shader ID');
    console.log(SETUP_INSTRUCTIONS);
    process.exit(1);
}

const processShader = async shaderId => {
    console.log(`Processing shader: ${shaderId}`);
    const { html, js } = await shadertoy2webgl(shaderId, { force, debug });
    console.log(`Generated ${html} and ${js}`);
    return { success: true, shaderId };
};

const formatSummary = ({ success, failed }) => [
    '\nSummary:',
    `✓ Processed: ${success.length}`,
    ...(failed.length > 0 ? [`✗ Failed: ${failed.length} (${failed.join(', ')})`] : []),
    'Done!'
].join('\n');

const processShaders = async () => {
    const results = await Promise.all(shaderIds.map(async shaderId => {
        try {
            return await processShader(shaderId);
        } catch (error) {
            console.error(`Error [${shaderId}]:`, error.message);
            return { success: false, shaderId };
        }
    }));
    const summary = results.reduce((acc, { success, shaderId }) => ({
        success: success ? [...acc.success, shaderId] : acc.success,
        failed: !success ? [...acc.failed, shaderId] : acc.failed
    }), { success: [], failed: [] });
    
    console.log(formatSummary(summary));
};

processShaders().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});
