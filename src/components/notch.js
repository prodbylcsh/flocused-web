// A web port of NotchView: one black notch shape that morphs between
// idle → compact / filled / thin line → peek → expanded with a single spring.
import { DotMatrix } from '../lib/dotmatrix.js';
import { NOTCH, layoutFor, notchPath, compactWidth, Spring } from '../lib/geometry.js';
import { PHASES } from '../lib/timer.js';
import { icons, phaseIcon } from '../lib/icons.js';
import { ticker, onVisible } from '../lib/ticker.js';

const STYLE_MODE = {
  timeAndProgress: 'compact',
  progressOnly: 'progressOnly',
  filledNotch: 'filled',
  screenEdge: 'idle',
};

export class Notch {
  /**
   * @param {HTMLElement} host
   * @param {object} o
   * @param {import('../lib/timer.js').Timer} o.timer
   * @param {() => string} o.style    notch style while running
   * @param {() => string} o.surface  finish of the opened panel
   * @param {string|null} o.lock      force a mode (e.g. 'expanded')
   * @param {boolean} o.hover         open on hover / focus / tap
   * @param {() => void} o.onSettings gear button
   */
  constructor(host, o) {
    this.o = { style: () => 'screenEdge', surface: () => 'classic', lock: null, hover: true, peeks: true, ...o };
    this.timer = o.timer;
    this.expanded = false;
    this.peekTitle = null;
    this.peekPhase = 'focus';
    this.visible = true;
    this.build(host);

    const l = layoutFor(this.mode());
    this.springs = { w: new Spring(l.w), h: new Spring(l.h), t: new Spring(l.t), b: new Spring(l.b) };
    this.applyShape();
    this.sync();

    this.timer.addEventListener('change', () => this.sync());
    this.timer.addEventListener('second', () => this.renderTime());
    if (this.o.peeks) {
      this.timer.addEventListener('phase', () => this.peek(PHASES[this.timer.phase].matrix, this.timer.phase));
    }
    onVisible(this.el, (v) => (this.visible = v));
    ticker.add((dt) => this.frame(dt));
  }

  build(host) {
    const el = document.createElement('div');
    el.className = 'notch';
    el.innerHTML = `
      <div class="notch__shadow"></div>
      <div class="notch__surface"><div class="grain"></div></div>
      <div class="notch__body">
        <div class="notch__base"></div>
        <div class="nl nl--compact" style="width:${compactWidth()}px;height:${NOTCH.height}px">
          <div class="nl-ear nl-ear--l"><svg class="ring" viewBox="0 0 16 16"><circle class="ring__track" cx="8" cy="8" r="6.3"/><circle class="ring__fill" cx="8" cy="8" r="6.3" pathLength="1"/></svg></div>
          <div class="nl-ear nl-ear--r"><canvas class="mx-compact"></canvas></div>
        </div>
        <div class="nl nl--filled" style="width:${compactWidth()}px;height:${NOTCH.height}px">
          <div class="fill__bar"></div><div class="fill__now"></div>
          <svg class="fill__mask" width="${NOTCH.width + 2 * NOTCH.shoulder}" height="${NOTCH.height}"><path d="${notchPath(NOTCH.width + 2 * NOTCH.shoulder, NOTCH.height, NOTCH.shoulder, NOTCH.idleBottomRadius)}"/></svg>
        </div>
        <div class="nl nl--line" style="width:${NOTCH.width + 2 * NOTCH.shoulder}px;height:${NOTCH.height + NOTCH.lineStrip}px">
          <div class="line__track"><div class="line__fill"></div></div>
        </div>
        <div class="nl nl--peek" style="width:340px;height:${NOTCH.height + 46}px">
          <div class="peek__row"><span class="peek__icon"></span><canvas class="mx-peek"></canvas></div>
        </div>
        <div class="nl nl--expanded" style="width:560px;height:${NOTCH.height + 92}px">
          <div class="nx-head">
            <div class="phase-label"><i></i><span></span></div>
            <div class="session-dots"></div>
          </div>
          <div class="nx-bar">
            <button class="orb" data-act="reset" aria-label="Restart this interval" title="Restart this interval">${icons.stop}</button>
            <button class="orb orb--tint orb--lg" data-act="toggle" aria-label="Start">${icons.play}</button>
            <div class="screen"><div class="screen__fill"></div><div class="screen__now"></div><canvas class="mx-screen"></canvas></div>
            <button class="orb" data-act="skip" aria-label="Skip">${icons.cup}</button>
            <span class="nx-div"></span>
            <button class="orb" data-act="settings" aria-label="Settings" title="Settings">${icons.gear}</button>
          </div>
        </div>
      </div>`;
    host.appendChild(el);
    this.el = el;
    this.body = el.querySelector('.notch__body');
    this.shadow = el.querySelector('.notch__shadow');
    this.surface = el.querySelector('.notch__surface');
    this.layers = {
      compact: el.querySelector('.nl--compact'),
      filled: el.querySelector('.nl--filled'),
      progressOnly: el.querySelector('.nl--line'),
      peek: el.querySelector('.nl--peek'),
      expanded: el.querySelector('.nl--expanded'),
    };
    this.$ = {
      ring: el.querySelector('.ring__fill'),
      fillBar: el.querySelector('.fill__bar'),
      fillNow: el.querySelector('.fill__now'),
      lineFill: el.querySelector('.line__fill'),
      screenFill: el.querySelector('.screen__fill'),
      screenNow: el.querySelector('.screen__now'),
      peekIcon: el.querySelector('.peek__icon'),
      phaseText: el.querySelector('.phase-label span'),
      dots: el.querySelector('.session-dots'),
      toggle: el.querySelector('[data-act="toggle"]'),
      skip: el.querySelector('[data-act="skip"]'),
    };
    this.mx = {
      compact: new DotMatrix(el.querySelector('.mx-compact'), { pitch: 2.1, dotScale: 0.8, alpha: 0.85, unlit: 0 }),
      peek: new DotMatrix(el.querySelector('.mx-peek'), { pitch: 3, unlit: 0.06 }),
      screen: new DotMatrix(el.querySelector('.mx-screen'), { pitch: 4.2, alpha: 0.95 }),
    };

    el.querySelectorAll('.orb').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = b.dataset.act;
        if (act === 'settings') return this.o.onSettings?.();
        this.timer[act]();
      })
    );

    if (this.o.hover && !this.o.lock) {
      el.tabIndex = 0;
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', 'Flocused notch. Focus or point at it to open the controls.');
      let enter, exit;
      const set = (inside) => {
        clearTimeout(inside ? exit : enter);
        if (inside && !this.expanded) enter = setTimeout(() => this.setExpanded(true), 120);
        if (!inside && this.expanded) exit = setTimeout(() => this.setExpanded(false), 350);
      };
      el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && set(true));
      el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && set(false));
      el.addEventListener('click', (e) => {
        if (!this.expanded) {
          e.preventDefault();
          clearTimeout(exit);
          this.setExpanded(true);
        }
      });
      el.addEventListener('focusin', () => set(true));
      el.addEventListener('focusout', (e) => !el.contains(e.relatedTarget) && set(false));
      document.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' && this.expanded && !el.contains(e.target)) this.setExpanded(false);
      });
      // Opened by touch or keyboard: scrolling away folds it, like moving the pointer off.
      let y0 = window.scrollY;
      window.addEventListener('scroll', () => {
        if (!this.expanded) return (y0 = window.scrollY);
        if (Math.abs(window.scrollY - y0) > 60 && !el.matches(':hover')) {
          this.setExpanded(false);
          if (el.contains(document.activeElement)) document.activeElement.blur();
        }
      }, { passive: true });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.setExpanded(false);
          el.blur();
        }
      });
    }
  }

  setExpanded(v) {
    if (this.expanded === v) return;
    this.expanded = v;
    this.sync();
    this.el.dispatchEvent(new CustomEvent('notch:expand', { detail: v, bubbles: true }));
  }

  peek(title, phase) {
    this.peekTitle = title;
    this.peekPhase = phase;
    this.mx.peek.set(title);
    this.$.peekIcon.innerHTML = phaseIcon[phase];
    this.sync();
    clearTimeout(this._peek);
    this._peek = setTimeout(() => {
      this.peekTitle = null;
      this.sync();
    }, 2200);
  }

  mode() {
    if (this.o.lock) return this.o.lock;
    if (this.expanded) return 'expanded';
    if (this.peekTitle) return 'peek';
    if (this.timer.state === 'idle') return 'idle';
    return STYLE_MODE[this.o.style()] ?? 'idle';
  }

  /** Re-evaluates mode, finish and static content. */
  sync() {
    const mode = this.mode();
    const t = this.timer;
    const l = layoutFor(mode);
    if (this.springs) {
      this.springs.w.target = l.w;
      this.springs.h.target = l.h;
      this.springs.t.target = l.t;
      this.springs.b.target = l.b;
    }
    for (const [k, layer] of Object.entries(this.layers)) layer.classList.toggle('is-on', k === mode);
    this.el.dataset.mode = mode;
    this.el.dataset.state = t.state;
    if (this.el.dataset.surface !== this.o.surface()) {
      this.el.dataset.surface = this.o.surface();
      if (this.springs) this.applyShape();
    }
    this.el.classList.toggle('is-raised', mode === 'expanded' || mode === 'peek');
    const ph = PHASES[t.phase];
    this.el.style.setProperty('--tint', ph.tint);
    this.el.style.setProperty('--tint-rgb', ph.rgb);
    this.$.phaseText.textContent = ph.title.toUpperCase();

    const running = t.state === 'running';
    this.$.toggle.innerHTML = running ? icons.pause : icons.play;
    this.$.toggle.setAttribute('aria-label', running ? 'Pause' : 'Start');
    this.$.toggle.title = running ? 'Pause' : 'Start';
    const toFocus = t.nextPhase === 'focus';
    this.$.skip.innerHTML = toFocus ? icons.focus : icons.cup;
    this.$.skip.setAttribute('aria-label', toFocus ? 'Skip to focus' : 'Skip to break');
    this.$.skip.title = toFocus ? 'Skip to focus' : 'Skip to break';

    const sets = t.settings.sets;
    if (this.$.dots.childElementCount !== sets) {
      this.$.dots.innerHTML = '<i></i>'.repeat(sets);
    }
    [...this.$.dots.children].forEach((d, i) => {
      d.className = i < t.completed ? 'done' : t.phase === 'focus' && i === t.completed ? 'current' : '';
    });
    this.$.dots.title = t.phase === 'focus' ? `Focus ${Math.min(t.completed + 1, sets)} of ${sets}` : `${Math.min(t.completed, sets)} of ${sets} focus intervals done`;
    this.renderTime();
  }

  renderTime() {
    const s = this.timer.timeString;
    const paused = this.timer.state === 'paused';
    this.mx.compact.set(s, { alpha: paused ? 0.45 : 0.85 });
    this.mx.screen.set(s, { alpha: paused ? 0.5 : 0.95 });
  }

  applyShape() {
    const { w, h, t, b } = this.springs;
    const W = w.value, H = h.value;
    this.body.style.width = `${W}px`;
    this.body.style.height = `${H}px`;
    const clip = `path('${notchPath(W, H, t.value, b.value)}')`;
    this.body.style.clipPath = clip;
    const su = this.surface.style;
    su.height = `${H}px`;
    if (this.o.surface() === 'glass') {
      // Chrome does not clip backdrop-filter to a clip-path, so the glass is shaped with
      // border-radius instead (the tiny concave shoulders are left out).
      su.clipPath = 'none';
      su.left = `${t.value}px`;
      su.width = `${Math.max(W - 2 * t.value, 0)}px`;
      su.borderRadius = `0 0 ${b.value}px ${b.value}px`;
    } else {
      su.clipPath = clip;
      su.left = '0px';
      su.width = `${W}px`;
      su.borderRadius = '0';
    }
    this.el.style.width = `${W}px`;
    this.el.style.height = `${H}px`;
    const sh = this.shadow.style;
    sh.left = `${t.value}px`;
    sh.width = `${Math.max(W - 2 * t.value, 0)}px`;
    sh.height = `${H}px`;
    sh.borderRadius = `0 0 ${b.value}px ${b.value}px`;
  }

  frame(dt) {
    if (!this.visible) return;
    let moving = false;
    for (const s of Object.values(this.springs)) moving = s.step(dt) || moving;
    if (moving || !this._shaped) {
      this.applyShape();
      this._shaped = !moving;
    }
    const p = this.timer.progress;
    if (p === this._p) return;
    this._p = p;
    this.$.ring.style.strokeDashoffset = `${1 - p}`;
    const cw = compactWidth();
    this.$.fillBar.style.width = `${cw * p}px`;
    this.$.fillNow.style.transform = `translateX(${Math.max(cw * p - 2, 0)}px)`;
    this.$.fillNow.style.opacity = p > 0 ? 1 : 0;
    this.$.lineFill.style.transform = `scaleX(${p})`;
    this.$.screenFill.style.width = `${p * 100}%`;
    this.$.screenNow.style.left = `calc(${p * 100}% - 1px)`;
    this.$.screenNow.style.opacity = p > 0 ? 1 : 0;
  }
}
