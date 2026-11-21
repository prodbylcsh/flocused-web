import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/main.css';
import './styles/notch.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { Timer, PHASES } from './lib/timer.js';
import { store } from './lib/store.js';
import { reducedMotion } from './lib/ticker.js';
import { DotMatrix } from './lib/dotmatrix.js';
import { NOTCH, notchPath, layoutFor } from './lib/geometry.js';
import { Notch } from './components/notch.js';
import { EdgeBar } from './components/edgebar.js';
import { heroShader } from './components/shader.js';
import { matrixField } from './components/matrixfield.js';
import { initStyles, initControls, initFinishes, initRhythm, initDetails, initMenubarLabel, fillIcons } from './sections.js';

gsap.registerPlugin(ScrollTrigger);
const RM = reducedMotion();
const root = document.documentElement;
if (RM) root.classList.add('reduced');
root.classList.add('is-loading');

fillIcons();
document.querySelector('#year').textContent = new Date().getFullYear();

/* ── Smooth scroll ───────────────────────────────────────────────────────── */
let lenis = null;
if (!RM) {
  lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = (target) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
};
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault();
    scrollTo(id === '#top' ? document.body : id);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  })
);

/* ── The live notch at the top of the page ───────────────────────────────── */
const s0 = store.all();
const live = new Timer({
  speed: 60,
  settings: {
    focus: s0.focus,
    shortBreak: s0.shortBreak,
    longBreak: s0.longBreak,
    sets: s0.sets,
    autoBreaks: s0.autoBreaks,
    autoFocus: s0.autoFocus,
    countSkipped: s0.countSkipped,
  },
});

const goSettings = () => scrollTo('#styles');
const liveHost = document.querySelector('#live-notch');
const liveScale = () => Math.min(1, (window.innerWidth - 20) / 560);
const setLiveScale = () => root.style.setProperty('--live-scale', liveScale().toFixed(3));
setLiveScale();

const liveNotch = new Notch(liveHost, {
  timer: live,
  style: () => store.get('style'),
  surface: () => store.get('surface'),
  onSettings: goSettings,
});
const liveEdge = new EdgeBar(document.querySelector('#edge-host'), {
  timer: live,
  scale: liveScale,
  when: () => store.get('style') === 'screenEdge',
});
window.addEventListener('resize', () => {
  setLiveScale();
  liveEdge.layout();
});
store.subscribe((p) => {
  if ('style' in p || 'surface' in p) {
    liveNotch.sync();
    liveEdge.sync();
  }
});
liveHost.addEventListener('notch:expand', (e) => root.classList.toggle('notch-open', e.detail));

initMenubarLabel(live);

/* ── Sections ────────────────────────────────────────────────────────────── */
heroShader(document.querySelector('.hero__gl'), () => PHASES[live.phase].tint);
matrixField(document.querySelector('.controls__field'), live);
initStyles({ gsap, ScrollTrigger });
initControls(live, { onSettings: goSettings });
initFinishes(live, { onSettings: goSettings });
initRhythm(live);
initDetails(live);

/* ── Theme follows the section in view ───────────────────────────────────── */
const meta = document.querySelector('meta[name="theme-color"]');
document.querySelectorAll('[data-theme]:not(html)').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle(self) {
      if (!self.isActive) return;
      root.dataset.theme = sec.dataset.theme;
      meta.setAttribute('content', sec.dataset.theme === 'light' ? '#efebe4' : '#0b0b0c');
    },
  });
});
const menubar = document.querySelector('.menubar');
const onScroll = () => menubar.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Scroll choreography ─────────────────────────────────────────────────── */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  return el.querySelectorAll('.w');
}

if (!RM) {
  // Manifesto: words light up as you read.
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.to(words, {
      opacity: 1,
      ease: 'none',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
    });
  });

  // Section headings rise in.
  gsap.utils.toArray('.section-head').forEach((head) => {
    gsap.from(head.children, {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: head, start: 'top 85%' },
    });
  });

  gsap.utils.toArray('.bento .card, .facts li, .steps li').forEach((el, i) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      delay: (i % 3) * 0.06,
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  });

  // Stages scale up slightly as they arrive.
  gsap.utils.toArray('.finishes__stage, .rhythm__panel, .device__screen').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 80, scale: 0.94, opacity: 0.4 },
      { y: 0, scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 55%', scrub: 0.5 } }
    );
  });

  gsap.from('.controls__stage', {
    y: 60,
    opacity: 0,
    duration: 1.3,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.controls__stage', start: 'top 85%' },
  });

  // The hero content drifts away as you scroll.
  gsap.to('.hero__content', {
    yPercent: -12,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true },
  });

  // Footer wordmark rises.
  gsap.from('.footer__word', {
    yPercent: 40,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top 95%', end: 'bottom bottom', scrub: 0.6 },
  });

  // Download icon floats.
  gsap.to('.download__icon', { y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

/* ── Magnetic buttons ────────────────────────────────────────────────────── */
if (!RM && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ── Copy buttons ────────────────────────────────────────────────────────── */
document.querySelectorAll('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      const icon = b.querySelector('[data-icon]');
      icon.innerHTML = '';
      icon.dataset.icon = 'check';
      fillIcons(b);
      setTimeout(() => {
        icon.innerHTML = '';
        icon.dataset.icon = 'copy';
        fillIcons(b);
      }, 1600);
    } catch {
      /* clipboard unavailable */
    }
  })
);

/* ── Intro: a black screen that folds itself into the notch ──────────────── */
function startDemo() {
  if (live.state === 'idle') live.start();
  liveNotch.peek(PHASES[live.phase].matrix, live.phase);
}

function heroIn() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__title .word', { yPercent: 110, rotate: 3, duration: 1.4, stagger: 0.1 }, 0)
    .from('.hero .reveal-up', { y: 24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.35)
    .from('.hero__hint-line', { scaleY: 0, duration: 1.2 }, 0.9)
    .from('.hero__hint-text', { opacity: 0, y: -6, duration: 1 }, 1.1)
    .from('.hero__foot', { opacity: 0, duration: 1 }, 1)
    .add(startDemo, 0.9);
  return tl;
}

function finishLoading() {
  root.classList.remove('is-loading');
  lenis?.start();
  ScrollTrigger.refresh();
}

function intro() {
  const loader = document.querySelector('.loader');
  if (RM || sessionStorageGet('flocused-intro')) {
    finishLoading();
    if (RM) startDemo();
    else heroIn();
    return;
  }
  sessionStorageSet('flocused-intro', '1');
  const canvas = loader.querySelector('.loader__matrix');
  const pitch = window.innerWidth < 640 ? 7 : 10;
  const mx = new DotMatrix(canvas, { pitch, unlit: 0.07, alpha: 0 });
  mx.set(live.timeString);

  const lit = { a: 0 };
  const s = liveScale();
  const target = layoutFor('idle');
  const shape = { w: window.innerWidth, h: window.innerHeight, t: 0, b: 40 };
  const applyClip = () => {
    const x0 = (window.innerWidth - shape.w) / 2;
    loader.style.clipPath = `path('${notchPath(shape.w, shape.h, shape.t, shape.b, x0, 0)}')`;
  };
  applyClip();

  gsap
    .timeline()
    .to(lit, { a: 0.95, duration: 0.9, ease: 'power2.inOut', onUpdate: () => mx.set(live.timeString, { alpha: lit.a }) })
    .to(canvas, { opacity: 0, scale: 0.9, duration: 0.45, ease: 'power2.in' }, '+=0.35')
    .to(
      shape,
      {
        w: target.w * s,
        h: NOTCH.height * s,
        t: target.t * s,
        b: target.b * s,
        duration: 1.15,
        ease: 'expo.inOut',
        onUpdate: applyClip,
      },
      '-=0.1'
    )
    .add(() => {
      finishLoading();
      heroIn();
    }, '-=0.35');
}

function sessionStorageGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionStorageSet(k, v) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

// Start once fonts are in, so nothing jumps.
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(intro);
