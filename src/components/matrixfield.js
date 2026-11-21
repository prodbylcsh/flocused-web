// A field of LED dots behind the Controls section. It shows the live countdown in giant
// dot-matrix digits (and the interval announcement when it changes); the pointer lights
// up the dots around it like a torch.
import { bitmap, columns, ROWS } from '../lib/dotmatrix.js';
import { PHASES } from '../lib/timer.js';
import { ticker, onVisible, reducedMotion } from '../lib/ticker.js';

export function matrixField(canvas, timer) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, pitch = 16, cols = 0, rows = 0, dpr = 1;
  let cur = new Float32Array(0);
  let tgt = new Float32Array(0);
  let text = timer.timeString;
  let peekUntil = 0;
  let visible = false;
  const mouse = { x: -9999, y: -9999, a: 0, ta: 0 };
  let dirty = true;
  let rgb = PHASES[timer.phase].rgb;

  const sprite = document.createElement('canvas');
  const tinted = document.createElement('canvas');

  function paintTinted() {
    tinted.width = tinted.height = sprite.width;
    const t = tinted.getContext('2d');
    t.drawImage(sprite, 0, 0);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = `rgb(${rgb})`;
    t.fillRect(0, 0, tinted.width, tinted.height);
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    pitch = W < 700 ? 11 : W < 1200 ? 14 : 16;
    cols = Math.ceil(W / pitch) + 1;
    rows = Math.ceil(H / pitch) + 1;
    cur = new Float32Array(cols * rows);
    tgt = new Float32Array(cols * rows);
    const d = pitch * 0.62;
    sprite.width = sprite.height = Math.ceil(d * dpr) + 2;
    const s = sprite.getContext('2d');
    s.clearRect(0, 0, sprite.width, sprite.height);
    s.fillStyle = '#fff';
    s.beginPath();
    s.arc(sprite.width / 2, sprite.height / 2, (d * dpr) / 2, 0, Math.PI * 2);
    s.fill();
    paintTinted();
    compose(true);
  }

  function compose(instant) {
    tgt.fill(0);
    const grid = bitmap(text);
    const c = columns(text);
    // Scale each font dot to a block of field dots so the text spans ~78% of the width.
    // ...and sits in the empty band at the top of the section.
    const band = canvas.parentElement.querySelector('.controls__marquee');
    const cr = canvas.getBoundingClientRect();
    const br = band ? band.getBoundingClientRect() : { top: cr.top, height: H * 0.4 };
    const r0 = Math.floor((br.top - cr.top) / pitch);
    const rh = Math.max(ROWS, Math.floor(br.height / pitch));
    const k = Math.max(1, Math.min(Math.floor((cols * 0.84) / c), Math.floor(rh / ROWS)));
    const tw = c * k;
    const th = ROWS * k;
    const ox = Math.floor((cols - tw) / 2);
    const oy = r0 + Math.floor((rh - th) / 2);
    for (let r = 0; r < ROWS; r++)
      for (let x = 0; x < c; x++) {
        if (!grid[r][x]) continue;
        for (let i = 0; i < k; i++)
          for (let j = 0; j < k; j++) {
            const X = ox + x * k + j, Y = oy + r * k + i;
            if (X >= 0 && X < cols && Y >= 0 && Y < rows) tgt[Y * cols + X] = 1;
          }
      }
    if (instant) cur.set(tgt);
    dirty = true;
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sw = sprite.width;
    const half = sw / 2;
    const R = 220;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const px = x * pitch + pitch / 2;
        const py = y * pitch + pitch / 2;
        const dx = px - mouse.x, dy = py - mouse.y;
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / R) * mouse.a;
        const lit = cur[i];
        const n2 = near * near;
        ctx.globalAlpha = 0.05 + n2 * 0.25;
        ctx.drawImage(sprite, px * dpr - half, py * dpr - half);
        if (lit > 0.01) {
          // Lit dots glow in the colour of the current interval.
          ctx.globalAlpha = Math.min(lit * (0.26 + n2 * 0.6), 1);
          ctx.drawImage(tinted, px * dpr - half, py * dpr - half);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  const setText = (t) => {
    if (t === text) return;
    text = t;
    compose(reducedMotion());
  };

  timer.addEventListener('second', () => performance.now() > peekUntil && setText(timer.timeString));
  timer.addEventListener('change', () => performance.now() > peekUntil && setText(timer.timeString));
  timer.addEventListener('phase', () => {
    rgb = PHASES[timer.phase].rgb;
    paintTinted();
    peekUntil = performance.now() + 2200;
    setText(PHASES[timer.phase].matrix);
    setTimeout(() => setText(timer.timeString), 2250);
  });

  const section = canvas.parentElement;
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.ta = e.pointerType === 'mouse' ? 1 : 0;
    dirty = true;
  });
  section.addEventListener('pointerleave', () => {
    mouse.ta = 0;
    dirty = true;
  });

  new ResizeObserver(layout).observe(canvas);
  onVisible(canvas, (v) => {
    visible = v;
    dirty = true;
  }, '0px');

  ticker.add(() => {
    if (!visible) return;
    let moving = false;
    for (let i = 0; i < cur.length; i++) {
      const d = tgt[i] - cur[i];
      if (Math.abs(d) > 0.004) {
        // Each dot settles at its own pace, so changes ripple instead of snapping.
        cur[i] += d * (0.08 + ((i * 7919) % 13) / 100);
        moving = true;
      } else cur[i] = tgt[i];
    }
    const da = mouse.ta - mouse.a;
    if (Math.abs(da) > 0.01) {
      mouse.a += da * 0.12;
      moving = true;
    }
    if (moving || dirty) {
      draw();
      dirty = false;
    }
  });
}
