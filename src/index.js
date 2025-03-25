#!/usr/bin/env node

import { shadertoy2webgl } from './lib.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const shaderIds = args.filter(arg => !arg.startsWith('--'));

if (shaderIds.length === 0) {
    console.error('Please provide at least one shader ID');
    process.exit(1);
}

const processShader = async shaderId => {
    try {
        console.log(`Processing shader: ${shaderId}`);
        const { html, js } = await shadertoy2webgl(shaderId, { force });
        console.log(`Generated ${html} and ${js}`);
        return { success: true, shaderId };
    } catch (error) {
        console.error(`Error processing shader ${shaderId}:`, error.message);
        return { success: false, shaderId };
    }
};

const formatSummary = ({ success, failed }) => [
    '\nSummary:',
    `✓ Successfully processed: ${success.length} shader${success.length !== 1 ? 's' : ''}`,
    ...(failed.length > 0 ? [
        `✗ Failed to process: ${failed.length} shader${failed.length !== 1 ? 's' : ''}`,
        `Failed shaders: ${failed.join(', ')}`
    ] : []),
    'Done!'
].join('\n');

const processShaders = async () => {
    const results = await Promise.all(shaderIds.map(processShader));
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