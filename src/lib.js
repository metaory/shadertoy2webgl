import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const CURL_LOCATIONS = [
  process.env.SHADERTOY_CURL,
  ".shadertoy.curl",
  path.join(os.homedir(), ".shadertoy.curl"),
].filter(Boolean);

const findCurlFile = () => CURL_LOCATIONS.find(f => fs.existsSync(f));

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

const buildCurlCmd = (curlFile, shaderId) => {
  const curl = fs.readFileSync(curlFile, "utf8");
  const body = `s=${encodeURIComponent(`{ "shaders" : ["${shaderId}"] }`)}&nt=1&nl=1&np=1`;
  return curl
    .replace(/^curl\s+/, "curl -s ")
    .replace(/--data-raw\s+'[^']*'/, `--data-raw '${body}'`)
    .replace(/--data-raw\s+"[^"]*"/, `--data-raw '${body}'`)
    .replace(/\\\n\s*/g, " ")
    .trim();
};

const validateShaderData = (shaderData, shaderId) => {
  const renderpass = shaderData?.[0]?.renderpass;
  const code = renderpass?.[0]?.code;
  if (!code) throw new Error(`Invalid shader data for '${shaderId}'`);
  return code.trim();
};

const extractTitle = (shaderData) => shaderData?.[0]?.info?.name || "";

export const fetchShader = async (shaderId, options = {}) => {
  const { force = false, debug = false } = options;
  const curlFile = findCurlFile();

  if (!curlFile) {
    throw new Error("Curl file not found. Create .shadertoy.curl with a copied curl command");
  }

  debugLog(debug, "Using curl file", curlFile);

  if (fs.existsSync(shaderId)) {
    if (!force) throw new Error(`Directory '${shaderId}' exists. Use --force to overwrite.`);
    fs.rmSync(shaderId, { recursive: true, force: true });
  }

  fs.mkdirSync(shaderId, { recursive: true });

  const cmd = buildCurlCmd(curlFile, shaderId);
  debugLog(debug, "Curl command (truncated)", cmd.slice(0, 300) + "...");

  const output = execSync(cmd, { encoding: "utf8", shell: "/bin/bash", maxBuffer: 10 * 1024 * 1024 });
  debugLog(debug, "Response length", output.length);

  const shaderData = JSON.parse(output);
  debugLog(debug, "Shader info", shaderData?.[0]?.info);

  const shaderCode = validateShaderData(shaderData, shaderId);
  const title = extractTitle(shaderData);
  const finalJson = { ...createInitialJson(shaderId, title), code: shaderCode };

  fs.writeFileSync(path.join(shaderId, "shader.json"), JSON.stringify(finalJson, null, 2));
  return finalJson;
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

export const shadertoy2webgl = async (shaderId, options = {}) => {
  const shader = await fetchShader(shaderId, options);
  return convertShader(shader);
};
