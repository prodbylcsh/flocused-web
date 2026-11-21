// The pomodoro engine, modelled on TimerModel.swift. Time runs off a monotonic clock
// (performance.now), optionally sped up for the demo. Remaining time is always derived
// from the deadline, so a late frame can never make the timer drift.

export const PHASES = {
  focus: { title: 'Focus', matrix: 'FOCUS', tint: '#f56b2b', rgb: '245,107,43' },
  shortBreak: { title: 'Short Break', matrix: 'BREAK', tint: '#3dcc9e', rgb: '61,204,158' },
  longBreak: { title: 'Long Break', matrix: 'LONG BREAK', tint: '#8094ff', rgb: '128,148,255' },
};

export const LIMITS = {
  focus: { presets: [15, 25, 50, 75, 90], range: [1, 180], def: 25 },
  shortBreak: { presets: [3, 5, 10, 15, 18, 20], range: [1, 36], def: 5 },
  longBreak: { presets: [9, 15, 30, 45, 54, 60], range: [1, 108], def: 15 },
  sets: { presets: [1, 2, 3, 4, 5, 6, 7, 8], range: [1, 8], def: 4 },
};

export const format = (s) => {
  s = Math.max(s, 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export class Timer extends EventTarget {
  constructor({ speed = 1, settings = {} } = {}) {
    super();
    this.speed = speed;
    this.settings = {
      focus: 25,
      shortBreak: 5,
      longBreak: 15,
      sets: 4,
      autoBreaks: true,
      autoFocus: true,
      countSkipped: true,
      ...settings,
    };
    this.phase = 'focus';
    this.state = 'idle';
    this.completed = 0;
    this.stored = this.totalMs; // remaining (simulated ms) while idle/paused
    this.deadline = null; // real ms
    this.lastSecs = this.remainingSeconds;
    this._loop = this._loop.bind(this);
    this._raf = null;
  }

  get totalMs() {
    return this.settings[this.phase] * 60_000;
  }

  get remainingMs() {
    if (this.state === 'running' && this.deadline != null) {
      return Math.max((this.deadline - performance.now()) * this.speed, 0);
    }
    return this.stored;
  }

  get remainingSeconds() {
    return Math.ceil(this.remainingMs / 1000 - 1e-9);
  }

  /** Continuous 0…1 progress (smooth for animation). */
  get progress() {
    const t = this.totalMs;
    return t > 0 ? Math.min(Math.max(1 - this.remainingMs / t, 0), 1) : 0;
  }

  get timeString() {
    return format(this.remainingSeconds);
  }

  get nextPhase() {
    if (this.phase === 'focus') return this.completed + 1 >= this.settings.sets ? 'longBreak' : 'shortBreak';
    return 'focus';
  }

  get tint() {
    return PHASES[this.phase].tint;
  }

  toggle() {
    this.state === 'running' ? this.pause() : this.start();
  }

  start() {
    if (this.state === 'running') return;
    this._begin();
    this._emit('change');
  }

  pause() {
    if (this.state !== 'running') return;
    this.stored = this.remainingMs;
    this.deadline = null;
    this.state = 'paused';
    this._stop();
    this._emit('change');
  }

  reset() {
    this._stop();
    this.deadline = null;
    this.state = 'idle';
    this.stored = this.totalMs;
    this._emit('change');
  }

  skip() {
    this._stop();
    this.deadline = null;
    this._advance(this.phase === 'focus' && this.settings.countSkipped);
    this.state = 'idle';
    this.stored = this.totalMs;
    this._emit('phase');
    this._emit('change');
  }

  set(patch) {
    Object.assign(this.settings, patch);
    if (this.completed >= this.settings.sets) this.completed = this.settings.sets - 1;
    if (this.state === 'idle') this.stored = this.totalMs;
    else if (this.stored > this.totalMs && this.state === 'paused') this.stored = this.totalMs;
    else if (this.state === 'running' && this.remainingMs > this.totalMs) {
      this.deadline = performance.now() + this.totalMs / this.speed;
    }
    this._emit('change');
  }

  setSpeed(speed) {
    const rem = this.remainingMs;
    this.speed = speed;
    if (this.state === 'running') this.deadline = performance.now() + rem / speed;
    this._emit('change');
  }

  _begin() {
    this.deadline = performance.now() + this.stored / this.speed;
    this.state = 'running';
    this._start();
  }

  _complete() {
    this._stop();
    this.deadline = null;
    this._advance(this.phase === 'focus');
    this.stored = this.totalMs;
    this.state = 'idle';
    const auto = this.phase === 'focus' ? this.settings.autoFocus : this.settings.autoBreaks;
    this._emit('phase');
    if (auto) this._begin();
    this._emit('change');
  }

  _advance(countFocus) {
    if (this.phase === 'focus') {
      if (countFocus) this.completed += 1;
      this.phase = this.completed >= this.settings.sets ? 'longBreak' : 'shortBreak';
    } else if (this.phase === 'shortBreak') {
      this.phase = 'focus';
    } else {
      this.completed = 0;
      this.phase = 'focus';
    }
  }

  _loop() {
    this._raf = requestAnimationFrame(this._loop);
    if (this.state !== 'running') return;
    if (performance.now() >= this.deadline) return this._complete();
    const secs = this.remainingSeconds;
    if (secs !== this.lastSecs) {
      this.lastSecs = secs;
      this._emit('second');
    }
  }

  _start() {
    if (this._raf == null) this._raf = requestAnimationFrame(this._loop);
  }

  _stop() {
    if (this._raf != null) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _emit(type) {
    this.lastSecs = this.remainingSeconds;
    this.dispatchEvent(new Event(type));
  }
}
