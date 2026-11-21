// Shared site settings (notch style, finish, rhythm). Like the app, whatever you choose
// becomes the new default: it is remembered in this browser when storage is available.

const KEY = 'flocused-site-v1';

const defaults = {
  style: 'screenEdge',
  surface: 'classic',
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  sets: 4,
  autoBreaks: true,
  autoFocus: true,
  countSkipped: true,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

const state = load();
const listeners = new Set();

export const store = {
  get: (k) => state[k],
  all: () => ({ ...state }),
  set(patch) {
    Object.assign(state, patch);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: settings last for this visit */
    }
    listeners.forEach((fn) => fn(patch, state));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  defaults,
};
