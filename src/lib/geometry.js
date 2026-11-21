// Notch geometry, ported from NotchShape.swift, EdgeBar.swift and NotchController.swift.

export const NOTCH = {
  width: 185,
  height: 32,
  shoulder: 6,
  idleBottomRadius: 10,
  earWidth: 80,
  lineStrip: 8,
};

export const compactWidth = (n = NOTCH) => n.width + 2 * n.shoulder + 2 * n.earWidth;

/** Size and radii of the notch outline for each mode (NotchViewModel.layout). */
export function layoutFor(mode, n = NOTCH) {
  const s = n.shoulder;
  switch (mode) {
    case 'progressOnly':
      return { w: n.width + 2 * s, h: n.height + n.lineStrip, t: s, b: 9 };
    case 'compact':
    case 'filled':
      return { w: compactWidth(n), h: n.height, t: s, b: 10 };
    case 'peek':
      return { w: Math.max(n.width + 2 * s + 120, 340), h: n.height + 46, t: 8, b: 20 };
    case 'expanded':
      return { w: Math.max(n.width + 2 * s + 330, 560), h: n.height + 92, t: 10, b: 26 };
    case 'idle':
    default:
      return { w: n.width + 2 * s, h: n.height, t: s, b: n.idleBottomRadius };
  }
}

const K = 0.552;
const f = (v) => Math.round(v * 100) / 100;

/** The MacBook notch silhouette: concave shoulders at the top, rounded bottom corners. */
export function notchPath(w, h, topRadius, bottomRadius, x0 = 0, y0 = 0) {
  const t = Math.max(0, Math.min(topRadius, w / 4, h / 2));
  const b = Math.max(0, Math.min(bottomRadius, (w - 2 * t) / 2, h - t));
  const minX = x0, maxX = x0 + w, minY = y0, maxY = y0 + h;
  return [
    `M${f(minX)},${f(minY)}`,
    `C${f(minX + t * K)},${f(minY)} ${f(minX + t)},${f(minY + t - t * K)} ${f(minX + t)},${f(minY + t)}`,
    `L${f(minX + t)},${f(maxY - b)}`,
    `C${f(minX + t)},${f(maxY - b + b * K)} ${f(minX + t + b - b * K)},${f(maxY)} ${f(minX + t + b)},${f(maxY)}`,
    `L${f(maxX - t - b)},${f(maxY)}`,
    `C${f(maxX - t - b + b * K)},${f(maxY)} ${f(maxX - t)},${f(maxY - b + b * K)} ${f(maxX - t)},${f(maxY - b)}`,
    `L${f(maxX - t)},${f(minY + t)}`,
    `C${f(maxX - t)},${f(minY + t - t * K)} ${f(maxX - t * K)},${f(minY)} ${f(maxX)},${f(minY)}`,
    'Z',
  ].join(' ');
}

/**
 * Centre line of the screen-edge progress bar: rises out of the top edge, runs along it,
 * wraps tightly around the notch and sinks back into the edge (EdgeBarShape).
 */
export function edgeBarPath({ cx, scale = 1, lineWidth = 1.5, blend = 16, n = NOTCH }) {
  const S = scale;
  const d = (lineWidth * S) / 2;
  const bodyLeft = cx - (n.width * S) / 2;
  const bodyRight = cx + (n.width * S) / 2;
  const t = Math.max(n.shoulder * S, d + 0.5);
  const b = n.idleBottomRadius * S;
  const leftX = bodyLeft - d;
  const rightX = bodyRight + d;
  const bottomY = n.height * S + d;
  const offTop = -lineWidth * S;
  const span = compactWidth(n) * S;
  const startX = cx - span / 2;
  const endX = cx + span / 2;
  const bl = blend * S;
  const half = bl / 2;
  const r1 = t - d;
  const r2 = b + d;
  return [
    `M${f(startX)},${f(offTop)}`,
    `C${f(startX + half)},${f(offTop)} ${f(startX + half)},${f(d)} ${f(startX + bl)},${f(d)}`,
    `L${f(leftX - r1)},${f(d)}`,
    `A${f(r1)},${f(r1)} 0 0 1 ${f(leftX)},${f(d + r1)}`,
    `L${f(leftX)},${f(bottomY - r2)}`,
    `A${f(r2)},${f(r2)} 0 0 0 ${f(leftX + r2)},${f(bottomY)}`,
    `L${f(rightX - r2)},${f(bottomY)}`,
    `A${f(r2)},${f(r2)} 0 0 0 ${f(rightX)},${f(bottomY - r2)}`,
    `L${f(rightX)},${f(d + r1)}`,
    `A${f(r1)},${f(r1)} 0 0 1 ${f(rightX + r1)},${f(d)}`,
    `L${f(endX - bl)},${f(d)}`,
    `C${f(endX - half)},${f(d)} ${f(endX - half)},${f(offTop)} ${f(endX)},${f(offTop)}`,
  ].join(' ');
}

/** Critically-damped-ish spring matching SwiftUI .spring(response:dampingFraction:). */
export class Spring {
  constructor(value, { response = 0.42, damping = 0.8 } = {}) {
    this.value = value;
    this.target = value;
    this.v = 0;
    this.k = (2 * Math.PI / response) ** 2;
    this.c = (4 * Math.PI * damping) / response;
  }
  step(dt) {
    const a = -this.k * (this.value - this.target) - this.c * this.v;
    this.v += a * dt;
    this.value += this.v * dt;
    if (Math.abs(this.value - this.target) < 0.01 && Math.abs(this.v) < 0.01) {
      this.value = this.target;
      this.v = 0;
      return false;
    }
    return true;
  }
}
