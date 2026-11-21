// Hero background: slow, silky folds of light in a dark room. The glow under the notch
// takes on the colour of the current interval.
import { ticker, onVisible, reducedMotion } from '../lib/ticker.js';

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uTint;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= .5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uTime * .035;
  vec2 q = vec2(fbm(p * 1.3 + vec2(t, -t * .6)), fbm(p * 1.3 + vec2(-t * .8, t) + 3.1));
  vec2 r = vec2(fbm(p * 1.5 + 2.1 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.5 + 2.1 * q + vec2(8.3, 2.8) - t));
  r += (uMouse - p) * .06;
  float f = fbm(p * 1.1 + 2.3 * r);

  float folds = smoothstep(.32, .95, f);
  vec3 col = vec3(.043, .043, .047);
  col = mix(col, vec3(.15, .095, .07), folds * .85);
  col += uTint * pow(folds, 3.2) * .38;

  float ridge = max(1. - abs(f - .62) * 3.2, 0.);
  col += vec3(1., .86, .76) * pow(ridge, 7.) * .07;

  // Light falling from the notch, and a little from the pointer.
  vec2 top = (p - vec2(0., .62)) * vec2(.8, 1.7);
  col += uTint * exp(-length(top) * 2.4) * .26;
  col += uTint * exp(-length(p - uMouse) * 3.) * .07 * (.4 + folds);

  col *= 1. - .45 * pow(length(uv - vec2(.5, .55)), 1.6);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) * .012;
  gl_FragColor = vec4(col, 1.);
}`;

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function heroShader(canvas, getTint) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.style.background = 'radial-gradient(80% 60% at 50% 0%, rgba(245,107,43,.22), transparent 70%), #0b0b0c';
    return;
  }
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    tint: gl.getUniformLocation(prog, 'uTint'),
  };

  const resize = () => {
    const q = Math.min(window.devicePixelRatio || 1, 2) * 0.55;
    const w = Math.max(1, Math.round(canvas.clientWidth * q));
    const h = Math.max(1, Math.round(canvas.clientHeight * q));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const mouse = { x: 0, y: 0.2, tx: 0, ty: 0.2 };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left - r.width / 2) / r.height;
    mouse.ty = -(e.clientY - r.top - r.height / 2) / r.height;
  });

  let tint = hexToRgb(getTint());
  let visible = true;
  let time = 12;
  onVisible(canvas, (v) => (visible = v), '0px');

  const draw = () => {
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.mouse, mouse.x, mouse.y);
    gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (reducedMotion()) {
    draw();
    return;
  }
  ticker.add((dt) => {
    if (!visible) return;
    time += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const target = hexToRgb(getTint());
    tint = tint.map((c, i) => c + (target[i] - c) * 0.03);
    draw();
  });
}
