import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BASE = 'https://www.shadertoy.com';

function readTemplate(name) {
    return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
}

export async function fetchShader(shaderId, options = { force: false }) {
    const shaderDir = shaderId;
    
    if (fs.existsSync(shaderDir)) {
        if (!options.force) {
            throw new Error(`Directory '${shaderId}' already exists. Use --force to overwrite.`);
        }
        fs.rmSync(shaderDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(shaderDir, { recursive: true });
    const shaderFile = path.join(shaderDir, 'shader.json');
    
    // Fetch shader page
    const response = await fetch(`${BASE}/view/${shaderId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Shader '${shaderId}' does not exist on ShaderToy`);
        }
        throw new Error(`Failed to fetch shader: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract title using regex - looking for content between <span> tags inside #editorHeaderText
    const titleMatch = html.match(/<div[^>]*id="editorHeaderText"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const initialJson = {
        id: shaderId,
        title,
        uniforms: {
            iResolution: "vec3",
            iTime: "float",
            iFrame: "float",
            iMouse: "vec4"
        }
    };
    
    // Fetch shader code
    const formData = new FormData();
    formData.append('s', JSON.stringify({ shaders: [shaderId] }));
    formData.append('nt', '1');
    formData.append('nl', '1');
    formData.append('np', '1');
    
    const shaderResponse = await fetch(`${BASE}/shadertoy`, {
        method: 'POST',
        headers: {
            'origin': BASE,
            'referer': `${BASE}/view/${shaderId}`,
            'user-agent': 'Mozilla/5.0'
        },
        body: formData
    });
    
    if (!shaderResponse.ok) {
        throw new Error(`Failed to fetch shader code: ${shaderResponse.statusText}`);
    }
    
    const shaderData = await shaderResponse.json();
    
    if (!Array.isArray(shaderData) || !shaderData[0]?.renderpass?.[0]?.code) {
        throw new Error(`Invalid shader data received for '${shaderId}'`);
    }
    
    const shaderCode = shaderData[0].renderpass[0].code.trim();
    
    if (!shaderCode) {
        throw new Error(`Shader '${shaderId}' has no code`);
    }
    
    const finalJson = {
        ...initialJson,
        code: shaderCode
    };
    
    fs.writeFileSync(shaderFile, JSON.stringify(finalJson, null, 2));
    
    return finalJson;
}

export async function convertShader(shader) {
    const shaderDir = shader.id;
    const htmlFile = path.join(shaderDir, 'index.html');
    const jsFile = path.join(shaderDir, 'shader.js');
    
    let htmlTemplate = readTemplate('webgl2.html');
    htmlTemplate = htmlTemplate
        .replace('${shaderTitle}', shader.title || 'Untitled Shader')
        .replace('${shaderCode}', shader.code);
    fs.writeFileSync(htmlFile, htmlTemplate);
    
    let jsTemplate = readTemplate('webgl2.js');
    jsTemplate = jsTemplate.replace('${shaderCode}', shader.code);
    fs.writeFileSync(jsFile, jsTemplate);
    
    return { html: htmlFile, js: jsFile };
}

export async function shadertoy2webgl(shaderId, options = { force: false }) {
    try {
        const shader = await fetchShader(shaderId, options);
        return await convertShader(shader);
    } catch (error) {
        throw new Error(`Failed to process shader: ${error.message}`);
    }
} 