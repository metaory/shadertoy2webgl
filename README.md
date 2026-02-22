<div align="center">
    <img src=".github/assets/logo.svg" alt="demo" height="60" />
    <h3><kbd>ShaderToy</kbd> ❯❯ <kbd>WebGL2</kbd></h3>
    <img src="demo/DdcfzH.png" alt="demo" height="200" />
</div>

## Install

```bash
npm install -g shadertoy2webgl
# or
npx shadertoy2webgl <response.json>
```

## Usage

**One flow:**

1. Open a shader on [shadertoy.com](https://www.shadertoy.com) in your browser.
2. Open DevTools (`F12`) → **Network**.
3. Reload or open the shader so the **shadertoy** (POST) request appears.
4. Click it → **Response** tab → copy the response body (the JSON) or right‑click → Save as.
5. Save to a file (e.g. `shader.json`).
6. Run:

```bash
shadertoy2webgl shader.json
# or multiple files
shadertoy2webgl a.json b.json
# overwrite existing dirs
shadertoy2webgl --force shader.json
```

**Options:** `--force` (overwrite), `--debug`, `--help`, `--version`.

Output: a directory per shader (named by shader id) with `index.html`, `shader.js`, `shader.json`.

## Library

```javascript
import { shadertoy2webgl } from 'shadertoy2webgl';

const results = await shadertoy2webgl('shader.json', { force: true });
// results = [{ shaderId, html, js }, ...]
```

## Features

- Converts ShaderToy shaders to WebGL2
- Handles ShaderToy uniforms (iResolution, iTime, iFrame, iMouse)
- Zero dependencies, Node.js >= 18, ESM

## Demos

<table><tr>
<td><img src="demo/wdyczG.png" alt="Plasma" height="90" /></td>
<td>
<code>st2webgl response.json</code> (after saving that shader’s API response)<br/>
<a href="demo/wdyczG/index.html">demo/wdyczG/index.html</a><br/>
<i><a href="https://www.shadertoy.com/view/wdyczG">shadertoy.com/view/wdyczG</a></i>
</td>
</tr></table>

<table><tr>
<td><img src="demo/DdcfzH.png" alt="Waves" height="90" /></td>
<td>
<a href="demo/DdcfzH/index.html">demo/DdcfzH/index.html</a><br/>
<i><a href="https://www.shadertoy.com/view/DdcfzH">shadertoy.com/view/DdcfzH</a></i>
</td>
</tr></table>

## Testing

```bash
npm test
```

## License

[MIT](LICENSE)
