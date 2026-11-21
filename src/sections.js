import { Notch } from './components/notch.js';
import { EdgeBar } from './components/edgebar.js';
import { Timer, LIMITS, PHASES } from './lib/timer.js';
import { DotMatrix } from './lib/dotmatrix.js';
import { compactWidth } from './lib/geometry.js';
import { store } from './lib/store.js';
import { icons } from './lib/icons.js';
import { onVisible } from './lib/ticker.js';

const STYLE_NAMES = {
  screenEdge: 'Edge bar',
  timeAndProgress: 'Time and ring',
  filledNotch: 'Progress fill',
  progressOnly: 'Thin line',
};

/* ── 02 · Four ways to show time ─────────────────────────────────────────── */
export function initStyles({ gsap, ScrollTrigger }) {
  const section = document.querySelector('.styles');
  const screen = section.querySelector('.device__screen');
  const items = [...section.querySelectorAll('.style-item')];
  const caption = section.querySelector('#style-caption');
  const order = items.map((b) => b.dataset.style);

  // Its own demo session, so the showcase always has something to show.
  const timer = new Timer({ speed: 150, settings: { focus: 25, shortBreak: 5, longBreak: 15, sets: 4 } });
  let shown = 'screenEdge';
  let ds = 1.6;

  const fit = () => {
    ds = Math.min(Math.max((screen.clientWidth * 0.52) / compactWidth(), 1), 2.6);
    screen.style.setProperty('--ds', ds.toFixed(3));
  };
  fit();
  const notch = new Notch(section.querySelector('#device-notch'), {
    timer,
    style: () => shown,
    surface: () => store.get('surface'),
    peeks: true,
    onSettings: () => {},
  });
  const edge = new EdgeBar(section.querySelector('#device-edge'), {
    timer,
    scale: () => ds,
    when: () => shown === 'screenEdge',
  });
  new ResizeObserver(() => {
    fit();
    edge.layout();
  }).observe(screen);

  let started = false;
  onVisible(screen, (v) => {
    if (v && !started) {
      started = true;
      timer.stored = timer.totalMs * 0.62;
      timer.start();
    }
  });

  const show = (style) => {
    if (style === shown) return;
    shown = style;
    caption.textContent = STYLE_NAMES[style];
    items.forEach((b) => b.classList.toggle('is-active', b.dataset.style === style));
    notch.sync();
    edge.sync();
  };
  items.forEach((b) => b.classList.toggle('is-active', b.dataset.style === shown));

  const markUsed = () => items.forEach((b) => b.classList.toggle('is-used', b.dataset.style === store.get('style')));
  markUsed();
  store.subscribe((p) => 'style' in p && markUsed());

  items.forEach((b) =>
    b.addEventListener('click', () => {
      store.set({ style: b.dataset.style });
      show(b.dataset.style);
      auto?.stop();
    })
  );

  // Desktop: pinned, scroll walks through the four styles. Smaller screens: auto-cycle.
  let auto = null;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1101px) and (min-height: 680px)', () => {
    const st = ScrollTrigger.create({
      trigger: section,
      pin: section.querySelector('.styles__pin'),
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.4}`,
      scrub: true,
      onUpdate(self) {
        const p = self.progress * order.length;
        const i = Math.min(Math.floor(p), order.length - 1);
        show(order[i]);
        items.forEach((b, j) => b.style.setProperty('--p', j < i ? 1 : j === i ? Math.min(p - i, 1) : 0));
      },
    });
    return () => st.kill();
  });
  mm.add('(max-width: 1100px), (max-height: 679px)', () => {
    let i = 0;
    let id = null;
    const io = onVisible(section, (v) => {
      clearInterval(id);
      if (v && auto) id = setInterval(() => show(order[(i = (i + 1) % order.length)]), 4200);
    });
    auto = { stop: () => (clearInterval(id), (auto = null)) };
    return () => {
      clearInterval(id);
      io.disconnect();
      auto = null;
    };
  });

  // Fake menu bar clock on the device.
  const clock = section.querySelector('#device-clock');
  const tick = () => {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 15_000);
}

/* ── 03 · Controls on demand ─────────────────────────────────────────────── */
export function initControls(liveTimer, { onSettings }) {
  const stage = document.querySelector('.controls__stage');
  const fit = () => stage.style.setProperty('--cs', Math.min(1.5, stage.clientWidth / 560).toFixed(3));
  new ResizeObserver(fit).observe(stage);
  fit();
  new Notch(stage.querySelector('#controls-notch'), {
    timer: liveTimer,
    lock: 'expanded',
    surface: () => store.get('surface'),
    onSettings,
  });
}

/* ── 04 · Five finishes ──────────────────────────────────────────────────── */
const FINISH_COPY = {
  classic: 'The original look. A black panel, with dark buttons set in a black ring.',
  graphite: 'Smooth charcoal, light at the top and darker below, with recessed-face buttons.',
  matte: 'A grainy, soft-touch surface with raised, analog buttons.',
  glossy: 'A lacquered surface with shiny, domed buttons.',
  glass: 'Apple’s Liquid Glass on macOS 26, and a live blurred glass look on earlier versions.',
};

export function initFinishes(liveTimer, { onSettings }) {
  const stage = document.querySelector('.finishes__stage');
  const desc = document.querySelector('#finish-desc');
  const tabs = [...document.querySelectorAll('.finishes__tabs button')];
  const fit = () => stage.style.setProperty('--fs', Math.min(1.45, (stage.clientWidth - 24) / 560).toFixed(3));
  new ResizeObserver(fit).observe(stage);
  fit();
  const notch = new Notch(stage.querySelector('#finish-notch'), {
    timer: liveTimer,
    lock: 'expanded',
    surface: () => store.get('surface'),
    onSettings,
  });
  const render = () => {
    const s = store.get('surface');
    tabs.forEach((t) => {
      t.setAttribute('aria-checked', String(t.dataset.surface === s));
      t.tabIndex = t.dataset.surface === s ? 0 : -1;
    });
    desc.textContent = FINISH_COPY[s];
    notch.sync();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => store.set({ surface: t.dataset.surface }));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      store.set({ surface: n.dataset.surface });
      n.focus();
    });
  });
  store.subscribe((p) => 'surface' in p && render());
  render();
}

/* ── 05 · Your rhythm ────────────────────────────────────────────────────── */
const fmtDuration = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
};

export function initRhythm(liveTimer) {
  const root = document.querySelector('.rhythm');
  const cycle = root.querySelector('#cycle');
  const total = root.querySelector('#cycle-total');
  const fields = [...root.querySelectorAll('.field')];

  fields.forEach((f) => {
    const key = f.dataset.key;
    const lim = LIMITS[key];
    const chips = f.querySelector('.chips');
    chips.innerHTML = lim.presets.map((v) => `<button type="button" data-v="${v}">${v}</button>`).join('');
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) apply({ [key]: Number(b.dataset.v) });
    });
    f.querySelectorAll('.stepper button').forEach((b) =>
      b.addEventListener('click', () => {
        const v = store.get(key) + Number(b.dataset.d);
        apply({ [key]: Math.min(Math.max(v, lim.range[0]), lim.range[1]) });
      })
    );
  });
  root.querySelectorAll('.toggles input').forEach((i) =>
    i.addEventListener('change', () => apply({ [i.dataset.key]: i.checked }))
  );
  root.querySelector('#rhythm-reset').addEventListener('click', () => {
    const d = store.defaults;
    apply({ focus: d.focus, shortBreak: d.shortBreak, longBreak: d.longBreak, sets: d.sets, autoBreaks: d.autoBreaks, autoFocus: d.autoFocus, countSkipped: d.countSkipped });
  });

  function apply(patch) {
    store.set(patch);
    liveTimer.set(patch);
    render();
  }

  let builtSets = 0;
  function render() {
    const s = store.all();
    fields.forEach((f) => {
      const key = f.dataset.key;
      const v = s[key];
      f.querySelector('output').textContent = key === 'sets' ? `${v}` : `${v} min`;
      f.querySelectorAll('.chips button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)));
    });
    root.querySelectorAll('.toggles input').forEach((i) => (i.checked = !!s[i.dataset.key]));

    const sum = s.sets * s.focus + (s.sets - 1) * s.shortBreak + s.longBreak;
    total.textContent = fmtDuration(sum);

    if (builtSets !== s.sets) {
      builtSets = s.sets;
      let html = '<div class="cycle__track">';
      for (let i = 0; i < s.sets; i++) {
        html += `<div class="seg seg--focus" style="--c:var(--focus);animation-delay:${i * 60}ms"><span></span></div>`;
        html += i < s.sets - 1
          ? `<div class="seg seg--break" style="--c:var(--mint);animation-delay:${i * 60 + 30}ms"><span></span></div>`
          : `<div class="seg seg--long" style="--c:var(--iris);animation-delay:${i * 60 + 30}ms"><span></span></div>`;
      }
      html += '</div><div class="cycle__axis"><span>0</span><span class="cycle__end"></span></div>';
      cycle.innerHTML = html;
    }
    cycle.querySelectorAll('.seg').forEach((seg) => {
      const min = seg.classList.contains('seg--focus') ? s.focus : seg.classList.contains('seg--break') ? s.shortBreak : s.longBreak;
      seg.style.flexGrow = min;
      seg.style.flexBasis = '0';
      seg.querySelector('span').textContent = min / sum > 0.07 ? `${min}′` : '';
    });
    cycle.querySelector('.cycle__end').textContent = fmtDuration(sum);
  }
  render();
}

/* ── 06 · Details ────────────────────────────────────────────────────────── */
export function initDetails(liveTimer) {
  // A real clock in dot-matrix digits.
  const precise = new DotMatrix(document.querySelector('#precise-matrix'), { pitch: window.innerWidth < 640 ? 4.2 : 6, unlit: 0.08 });
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    precise.set(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
  };
  tick();
  setInterval(tick, 1000);

  const mini = document.querySelector('#menubar-mini-time');
  const upd = () => (mini.textContent = liveTimer.timeString);
  liveTimer.addEventListener('second', upd);
  liveTimer.addEventListener('change', upd);
  upd();

  document.querySelectorAll('.card').forEach((c) =>
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    })
  );
}

/* ── Menu bar label, like the app's: phase symbol + remaining time ───────── */
export function initMenubarLabel(liveTimer) {
  const el = document.querySelector('#menubar-clock');
  const status = document.querySelector('#hero-status');
  const hero = document.querySelector('.hero');
  const upd = () => {
    const t = liveTimer;
    el.textContent = t.state === 'idle' ? '' : `${t.state === 'paused' ? 'Paused' : PHASES[t.phase].title} · ${t.timeString}`;
    const sets = t.settings.sets;
    const label = t.phase === 'focus' ? `Focus ${Math.min(t.completed + 1, sets)} of ${sets}` : PHASES[t.phase].title;
    status.textContent = `${label} · ${t.timeString} · Demo at ${t.speed}× speed`;
    hero.style.setProperty('--status', PHASES[t.phase].tint);
  };
  liveTimer.addEventListener('second', upd);
  liveTimer.addEventListener('change', upd);
  upd();
}

export function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (!el.firstElementChild) el.innerHTML = icons[el.dataset.icon] ?? '';
  });
}
