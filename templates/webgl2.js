const gl = canvas.getContext('webgl2');
const vs = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const fs = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec3 iResolution;
uniform float iTime;
uniform float iFrame;
uniform vec4 iMouse;

${shaderCode}

void main() {
    mainImage(fragColor,gl_FragCoord.xy);
}`;

const program = gl.createProgram();
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vertexShader,vs);
gl.shaderSource(fragmentShader,fs);
gl.compileShader(vertexShader);
gl.compileShader(fragmentShader);
gl.attachShader(program,vertexShader);
gl.attachShader(program,fragmentShader);
gl.linkProgram(program);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program,'position');
const iResolutionLocation = gl.getUniformLocation(program,'iResolution');
const iTimeLocation = gl.getUniformLocation(program,'iTime');
const iFrameLocation = gl.getUniformLocation(program,'iFrame');
const iMouseLocation = gl.getUniformLocation(program,'iMouse');

gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation,2,gl.FLOAT,false,0,0);

const mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => Object.assign(mouse, { x: e.clientX, y: e.clientY }));

const render = () => {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if(canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    gl.viewport(0,0,canvas.width,canvas.height);
    
    gl.uniform3f(iResolutionLocation,canvas.width,canvas.height,1.0);
    gl.uniform1f(iTimeLocation,(Date.now()-performance.now())/1000);
    gl.uniform1f(iFrameLocation,Math.floor((Date.now()-performance.now())/16.67));
    gl.uniform4f(iMouseLocation,mouse.x,mouse.y,0,0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    requestAnimationFrame(render);
};
render(); 