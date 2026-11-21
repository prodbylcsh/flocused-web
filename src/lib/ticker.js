// One shared requestAnimationFrame loop for everything that animates per frame.
const subs = new Set();
let raf = null;
let last = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0.016, 1 / 20);
  last = now;
  subs.forEach((fn) => fn(dt, now));
  raf = subs.size ? requestAnimationFrame(frame) : null;
}

export const ticker = {
  add(fn) {
    subs.add(fn);
    if (raf == null) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    return () => subs.delete(fn);
  },
};

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Calls `cb(visible)` when `el` enters or leaves the viewport (with a margin). */
export function onVisible(el, cb, margin = '120px') {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), {
    rootMargin: margin,
  });
  io.observe(el);
  return io;
}
