import { test } from 'node:test';
import assert from 'node:assert';
import { shadertoy2webgl } from '../src/lib.js';
import fs from 'node:fs';
import path from 'node:path';

const FIXTURE = path.join(process.cwd(), 'test', 'fixtures', 'response.json');
const TEST_SHADER_ID = 'MdX3Rr';

const cleanup = () => {
  if (fs.existsSync(TEST_SHADER_ID)) {
    fs.rmSync(TEST_SHADER_ID, { recursive: true, force: true });
  }
};

test('shadertoy2webgl', async (t) => {
  cleanup();

  await t.test('should process a response file', async () => {
    const results = await shadertoy2webgl(FIXTURE);
    assert.ok(Array.isArray(results), 'Should return array');
    assert.ok(results.length >= 1, 'Should have at least one result');
    const { shaderId, html, js } = results[0];
    assert.strictEqual(shaderId, TEST_SHADER_ID);
    assert.ok(fs.existsSync(html), 'HTML file should exist');
    assert.ok(fs.existsSync(js), 'JS file should exist');
    const htmlContent = fs.readFileSync(html, 'utf8');
    const jsContent = fs.readFileSync(js, 'utf8');
    assert.ok(htmlContent.includes('<!DOCTYPE html>'), 'HTML should be valid');
    assert.ok(jsContent.includes('webgl2'), 'JS should contain webgl2 code');
  });

  await t.test('should reject invalid response file', async () => {
    const invalidPath = path.join(process.cwd(), 'test', 'fixtures', 'invalid.json');
    try {
      await shadertoy2webgl(invalidPath);
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error.message.includes('API response') || error.message.includes('array'), 'Should report invalid data');
    }
  });

  await t.test('should generate valid shader.json', async () => {
    const shaderJson = JSON.parse(fs.readFileSync(path.join(TEST_SHADER_ID, 'shader.json'), 'utf8'));
    assert.ok(shaderJson.id, 'Should have shader ID');
    assert.ok(shaderJson.title, 'Should have shader title');
    assert.ok(shaderJson.code, 'Should have shader code');
    assert.ok(shaderJson.uniforms, 'Should have uniforms');
    const requiredUniforms = ['iResolution', 'iTime', 'iFrame', 'iMouse'];
    requiredUniforms.forEach(u => assert.ok(u in shaderJson.uniforms, `Should have ${u}`));
  });

  cleanup();
});
