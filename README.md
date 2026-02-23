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

1. Open a shader on [shadertoy.com](https://www.shadertoy.com). DevTools (F12) → Network, reload.
2. In the list: **shadertoy** `https://www.shadertoy.com/shadertoy` (POST)
 Copy its Response (JSON), save as `shader.json`.
3. Run:

```bash
shadertoy2webgl shader.json
shadertoy2webgl a.json b.json
shadertoy2webgl --force shader.json   # overwrite
```

Options: `--force`, `--debug`, `--help`, `--version`. Output: one directory per shader (id as name) with `index.html`, `shader.js`, `shader.json`.

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
