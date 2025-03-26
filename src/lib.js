import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BASE = 'https://www.shadertoy.com';

const readTemplate = name => fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');

const extractTitle = html => {
    const titleMatch = html.match(/<div[^>]*id="editorHeaderText"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    return titleMatch ? titleMatch[1].trim() : '';
};

const createInitialJson = (shaderId, title) => ({
    id: shaderId,
    title,
    uniforms: {
        iResolution: "vec3",
        iTime: "float",
        iFrame: "float",
        iMouse: "vec4"
    }
});

const createFormData = shaderId => {
    const formData = new FormData();
    formData.append('s', JSON.stringify({ shaders: [shaderId] }));
    formData.append('nt', '1');
    formData.append('nl', '1');
    formData.append('np', '1');
    return formData;
};

const validateShaderData = (shaderData, shaderId) => {
    const [{ renderpass: [{ code }] }] = shaderData;
    if (!code) {
        throw new Error(`Invalid shader data received for '${shaderId}'`);
    }
    const shaderCode = code.trim();
    if (!shaderCode) {
        throw new Error(`Shader '${shaderId}' has no code`);
    }
    return shaderCode;
};

export const fetchShader = async (shaderId, options = { force: false }) => {
    if (fs.existsSync(shaderId)) {
        if (!options.force) {
            throw new Error(`Directory '${shaderId}' already exists. Use --force to overwrite.`);
        }
        fs.rmSync(shaderId, { recursive: true, force: true });
    }
    
    fs.mkdirSync(shaderId, { recursive: true });
    const shaderFile = path.join(shaderId, 'shader.json');
    
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
    const title = extractTitle(html);
    const initialJson = createInitialJson(shaderId, title);
    
    const shaderResponse = await fetch(`${BASE}/shadertoy`, {
        method: 'POST',
        headers: {
            'origin': BASE,
            'referer': `${BASE}/view/${shaderId}`,
            'user-agent': 'Mozilla/5.0'
        },
        body: createFormData(shaderId)
    });
    
    if (!shaderResponse.ok) {
        throw new Error(`Failed to fetch shader code: ${shaderResponse.statusText}`);
    }
    
    const shaderData = await shaderResponse.json();
    const shaderCode = validateShaderData(shaderData, shaderId);
    
    const finalJson = { ...initialJson, code: shaderCode };
    fs.writeFileSync(shaderFile, JSON.stringify(finalJson, null, 2));
    
    return finalJson;
};

export const convertShader = async shader => {
    const shaderDir = shader.id;
    const htmlFile = path.join(shaderDir, 'index.html');
    const jsFile = path.join(shaderDir, 'shader.js');
    
    const webglCode = readTemplate('webgl2.js')
        .replace('${shaderCode}', shader.code);
    
    const htmlTemplate = readTemplate('webgl2.html')
        .replace('${shaderTitle}', shader.title || 'Untitled Shader')
        .replace('${webglCode}', webglCode);
    
    fs.writeFileSync(htmlFile, htmlTemplate);
    fs.writeFileSync(jsFile, webglCode);
    
    return { html: htmlFile, js: jsFile };
};

export const shadertoy2webgl = async (shaderId, options = { force: false }) => {
    try {
        const shader = await fetchShader(shaderId, options);
        return await convertShader(shader);
    } catch (error) {
        throw new Error(`Failed to process shader: ${error.message}`);
    }
}; 