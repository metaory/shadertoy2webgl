#!/usr/bin/env node

import { shadertoy2webgl } from './lib.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const shaderId = args.find(arg => !arg.startsWith('--'));

if (!shaderId) {
    console.error('Please provide a shader ID');
    process.exit(1);
}

try {
    console.log(`Processing shader: ${shaderId}`);
    const { html, js } = await shadertoy2webgl(shaderId, { force });
    console.log(`Generated ${html} and ${js}`);
    console.log('Done!');
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
} 