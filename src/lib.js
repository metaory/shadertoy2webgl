import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

const readTemplate = (name) =>
  fs.readFileSync(path.join(TEMPLATES_DIR, name), "utf8");

const createInitialJson = (shaderId, title) => ({
  id: shaderId,
  title,
  uniforms: {
    iResolution: "vec3",
    iTime: "float",
    iFrame: "float",
    iMouse: "vec4",
  },
});

const debugLog = (debug, label, data) => {
  if (!debug) return;
  console.log(`[DEBUG] ${label}:`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
};

const validateShaderData = (shaderData, shaderId) => {
  const renderpass = shaderData?.[0]?.renderpass;
  const code = renderpass?.[0]?.code;
  if (!code) throw new Error(`Invalid shader data for '${shaderId}'`);
  return code.trim();
};

const extractTitle = (shaderData) => shaderData?.[0]?.info?.name || "";

const readResponseFile = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (raw.startsWith("<")) {
    throw new Error(`File '${filePath}' contains HTML. Save the response body from DevTools > Network > shadertoy request.`);
  }
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || !data[0]) {
    throw new Error(`File '${filePath}' should be the Shadertoy API response (JSON array of shader objects).`);
  }
  return data;
};

export const convertShader = async (shader) => {
  const shaderDir = shader.id;
  const htmlFile = path.join(shaderDir, "index.html");
  const jsFile = path.join(shaderDir, "shader.js");

  const webglCode = readTemplate("webgl2.js").replace("${shaderCode}", shader.code);
  const htmlTemplate = readTemplate("webgl2.html")
    .replace("${shaderTitle}", shader.title || "Untitled Shader")
    .replace("${webglCode}", webglCode);

  fs.writeFileSync(htmlFile, htmlTemplate);
  fs.writeFileSync(jsFile, webglCode);

  return { html: htmlFile, js: jsFile };
};

/** Process a Shadertoy API response file. Returns array of { shaderId, html, js } per shader in the file. */
export const shadertoy2webgl = async (filePath, options = {}) => {
  const { force = false, debug = false } = options;
  const items = readResponseFile(filePath);
  debugLog(debug, "Shaders in file", items.length);

  const results = [];
  for (const item of items) {
    const shaderId = item?.info?.id;
    if (!shaderId) throw new Error(`Missing shader id in response from '${filePath}'`);

    if (fs.existsSync(shaderId) && !force) {
      throw new Error(`Directory '${shaderId}' exists. Use --force to overwrite.`);
    }
    fs.rmSync(shaderId, { recursive: true, force: true });
    fs.mkdirSync(shaderId, { recursive: true });

    const code = validateShaderData([item], shaderId);
    const title = extractTitle([item]);
    const finalJson = { ...createInitialJson(shaderId, title), code };
    fs.writeFileSync(path.join(shaderId, "shader.json"), JSON.stringify(finalJson, null, 2));

    const { html, js } = await convertShader(finalJson);
    results.push({ shaderId, html, js });
  }
  return results;
};
