// Small inline icons in the spirit of the SF Symbols the app uses.
const svg = (inner, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;

function gear() {
  const teeth = 8;
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 4 === 1 || i % 4 === 2 ? 10.4 : 8.2;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)},${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return svg(
    `<path fill-rule="evenodd" fill="currentColor" d="M${pts.join(' L')} Z M12,8.6 a3.4,3.4 0 1,0 0.01,0 Z"/>`
  );
}

export const icons = {
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2.4" fill="currentColor"/>'),
  play: svg('<path fill="currentColor" d="M8 5.2v13.6c0 .8.9 1.3 1.6.9l10.6-6.8a1 1 0 0 0 0-1.8L9.6 4.3C8.9 3.9 8 4.4 8 5.2z"/>'),
  pause: svg('<rect x="6.2" y="5" width="4.2" height="14" rx="1.3" fill="currentColor"/><rect x="13.6" y="5" width="4.2" height="14" rx="1.3" fill="currentColor"/>'),
  cup: svg(
    '<path fill="currentColor" d="M4 7.5h12.2v5.3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16.2 9h1.3a2.6 2.6 0 0 1 0 5.2h-1.6v-1.6h1.6a1 1 0 0 0 0-2h-1.3z"/><rect x="3" y="19.2" width="15" height="1.8" rx=".9" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M8 2.6c-.8.9.8 1.6 0 2.6M11.6 2.6c-.8.9.8 1.6 0 2.6"/>'
  ),
  focus: svg(
    '<circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.4" fill="currentColor"/>'
  ),
  gear: gear(),
  timer: svg(
    '<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 13V8.6M9.5 2.8h5"/>'
  ),
  leaf: svg(
    '<path fill="currentColor" d="M20 4c-8.5 0-14 3.6-14 10a5.6 5.6 0 0 0 .6 2.6L4 19.2l1.2 1.2 2.6-2.6A5.6 5.6 0 0 0 10.4 18C16.8 18 20 12.5 20 4zm-9.4 9.4 4.6-4.6"/>'
  ),
  apple: svg(
    '<path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5a4.3 4.3 0 0 0-3.4-1.8c-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8a4.5 4.5 0 0 0-3.8 2.3c-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.3a10 10 0 0 0 1.3-2.6 4 4 0 0 1-2.5-3.7zM14.1 5.8A4 4 0 0 0 15 2.9a4.2 4.2 0 0 0-2.7 1.4 3.9 3.9 0 0 0-1 2.8 3.5 3.5 0 0 0 2.8-1.3z"/>'
  ),
  arrow: svg('<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowUp: svg('<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 19V5M6 11l6-6 6 6"/>'),
  download: svg('<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>'),
  github: svg(
    '<path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>'
  ),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>'),
  check: svg('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/>'),
};

export const phaseIcon = { focus: icons.timer, shortBreak: icons.cup, longBreak: icons.leaf };
