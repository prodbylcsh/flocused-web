// 5×7 dot-matrix font, ported from the app (DotMatrix.swift).
export const ROWS = 7;

export const GLYPHS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00', '11', '11', '00', '11', '11', '00'],
  '-': ['000', '000', '000', '111', '000', '000', '000'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '10001', '01010', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

export function glyph(ch) {
  return GLYPHS[ch.toUpperCase()] ?? GLYPHS[' '];
}

/** Number of dot columns for `text` (one empty column between characters). */
export function columns(text) {
  const widths = [...text].map((c) => glyph(c)[0].length);
  return widths.reduce((a, b) => a + b, 0) + Math.max(widths.length - 1, 0);
}

/** Lit/unlit grid for `text`: array of rows, each an array of booleans. */
export function bitmap(text) {
  const cols = columns(text);
  const grid = Array.from({ length: ROWS }, () => new Array(cols).fill(false));
  let x = 0;
  for (const ch of text) {
    const g = glyph(ch);
    const w = g[0].length;
    g.forEach((row, r) => {
      for (let c = 0; c < w; c++) if (row[c] === '1') grid[r][x + c] = true;
    });
    x += w + 1;
  }
  return grid;
}

/** Text drawn as round LED dots on a canvas, like `DotMatrixText`. */
export class DotMatrix {
  constructor(canvas, { pitch = 4, dotScale = 0.74, color = '255,255,255', alpha = 1, unlit = 0.07 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = { pitch, dotScale, color, alpha, unlit };
    this.text = null;
  }

  set(text, patch) {
    if (patch) Object.assign(this.opts, patch);
    if (text === this.text && !patch) return;
    this.text = text;
    this.draw();
  }

  draw() {
    const { pitch, dotScale, color, alpha, unlit } = this.opts;
    const text = this.text ?? '';
    const grid = bitmap(text);
    const cols = columns(text);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = cols * pitch;
    const h = ROWS * pitch;
    const c = this.canvas;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const d = pitch * dotScale;
    const off = (pitch - d) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < cols; col++) {
        const lit = grid[r][col];
        if (!lit && unlit <= 0) continue;
        ctx.fillStyle = `rgba(${color},${lit ? alpha : alpha * unlit})`;
        ctx.beginPath();
        ctx.arc(col * pitch + off + d / 2, r * pitch + off + d / 2, d / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
