// The default "Edge bar" style: a hairline of progress along the top edge of the screen,
// wrapping tightly around the notch.
import { edgeBarPath } from '../lib/geometry.js';
import { PHASES } from '../lib/timer.js';
import { ticker, onVisible } from '../lib/ticker.js';

export class EdgeBar {
  constructor(host, { timer, scale = () => 1, when = () => true, lineWidth = 1.5 }) {
    this.timer = timer;
    this.scale = scale;
    this.when = when;
    this.lineWidth = lineWidth;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('edgebar');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<path class="edgebar__track" pathLength="1"/><path class="edgebar__fill" pathLength="1"/>`;
    host.appendChild(svg);
    this.svg = svg;
    this.track = svg.querySelector('.edgebar__track');
    this.fill = svg.querySelector('.edgebar__fill');
    this.host = host;
    this.visible = true;

    new ResizeObserver(() => this.layout()).observe(host);
    this.layout();
    this.sync();
    timer.addEventListener('change', () => this.sync());
    timer.addEventListener('phase', () => this.sync());
    onVisible(host, (v) => (this.visible = v));
    ticker.add(() => this.frame());
  }

  layout() {
    const w = this.host.clientWidth;
    const s = this.scale();
    const d = edgeBarPath({ cx: w / 2, scale: s, lineWidth: this.lineWidth });
    this.svg.setAttribute('viewBox', `0 0 ${w} ${Math.ceil(60 * s)}`);
    this.svg.style.height = `${Math.ceil(60 * s)}px`;
    this.track.setAttribute('d', d);
    this.fill.setAttribute('d', d);
    this.svg.style.setProperty('--lw', `${this.lineWidth * s}px`);
  }

  sync() {
    const t = this.timer;
    this.svg.style.setProperty('--tint', PHASES[t.phase].tint);
    this.svg.classList.toggle('is-on', this.when() && t.state !== 'idle');
    this.svg.classList.toggle('is-paused', t.state === 'paused');
  }

  frame() {
    if (!this.visible) return;
    const p = this.timer.progress;
    if (p === this._p) return;
    this._p = p;
    this.fill.style.strokeDasharray = `${p} 1`;
  }
}
