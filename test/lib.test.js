import { test } from 'node:test';
import assert from 'node:assert';
import { shadertoy2webgl } from '../src/lib.js';
import fs from 'node:fs';
import path from 'node:path';

const TEST_SHADER_ID = 'MdX3Rr'; // A known working shader ID

// Clean up before and after tests
function cleanup() {
    if (fs.existsSync(TEST_SHADER_ID)) {
        fs.rmSync(TEST_SHADER_ID, { recursive: true, force: true });
    }
}

test('shadertoy2webgl', async (t) => {
    cleanup();

    await t.test('should fetch and convert a shader', async () => {
        const { html, js } = await shadertoy2webgl(TEST_SHADER_ID);
        
        // Check if files were created
        assert.ok(fs.existsSync(html), 'HTML file should exist');
        assert.ok(fs.existsSync(js), 'JS file should exist');
        
        // Check if files contain expected content
        const htmlContent = fs.readFileSync(html, 'utf8');
        const jsContent = fs.readFileSync(js, 'utf8');
        
        assert.ok(htmlContent.includes('<!DOCTYPE html>'), 'HTML should be valid');
        assert.ok(jsContent.includes('WebGL2'), 'JS should contain WebGL2 code');
    });

    await t.test('should handle invalid shader IDs', async () => {
        try {
            await shadertoy2webgl('invalid-shader-id');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error.message.includes('Failed to process shader'));
        }
    });

    await t.test('should generate valid shader.json', async () => {
        const shaderJson = JSON.parse(fs.readFileSync(path.join(TEST_SHADER_ID, 'shader.json'), 'utf8'));
        
        // Check required fields
        assert.ok(shaderJson.id, 'Should have shader ID');
        assert.ok(shaderJson.title, 'Should have shader title');
        assert.ok(shaderJson.code, 'Should have shader code');
        assert.ok(shaderJson.uniforms, 'Should have uniforms');
        
        // Check uniforms
        const requiredUniforms = ['iResolution', 'iTime', 'iFrame', 'iMouse'];
        for (const uniform of requiredUniforms) {
            assert.ok(uniform in shaderJson.uniforms, `Should have ${uniform} uniform`);
        }
    });

    cleanup();
}); 