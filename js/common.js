/**
 * common.js – Shared utilities (Überarbeitet)
 */

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

const Store = {
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
  },
  remove(key) { localStorage.removeItem(key); }
};

const QuizStore = {
  all() { return Store.get('quizzes', []); },
  save(quizzes) { Store.set('quizzes', quizzes); },
  get(id) { return this.all().find(q => q.id === id) || null; },
  upsert(quiz) {
    const list = this.all();
    const idx = list.findIndex(q => q.id === quiz.id);
    if (idx >= 0) list[idx] = quiz; else list.push(quiz);
    this.save(list);
    return quiz;
  }
};

const GameStore = {
  get(code) { return Store.get('game_' + code, null); },
  set(code, g) { Store.set('game_' + code, g); },
  remove(code) { Store.remove('game_' + code); }
};

const ActiveGameStore = {
  get() { return Store.get('active_game_code', null); },
  set(code) { Store.set('active_game_code', code); },
  clear() { Store.remove('active_game_code'); }
};

function getQuizMode(source) {
  return source?.mode || 'memory';
}

function initStars(containerId = 'stars') {
  const bg = document.getElementById(containerId);
  if (!bg) return;
  const count = 80;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    const size = Math.random() * 3 + 1;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      animation-duration:${3+Math.random()*5}s;
      animation-delay:${Math.random()*6}s;
    `;
    bg.appendChild(s);
  }
}

function toast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const entry = document.createElement('div');
  entry.className = `toast ${type}`;
  entry.textContent = message;
  container.appendChild(entry);
  setTimeout(() => entry.remove(), 3100);
}

function celebrate(origin = { y: 0.55 }) {
  if (typeof confetti !== 'function') return;
  const colors = ['#4db5d8', '#ff6a1a', '#8dd8ef', '#ffd2b5', '#ffffff'];
  confetti({ particleCount: 120, spread: 70, colors, origin });
  setTimeout(() => confetti({ particleCount: 70, spread: 56, colors, origin: { y: 0.62, x: 0.2 } }), 200);
  setTimeout(() => confetti({ particleCount: 70, spread: 56, colors, origin: { y: 0.62, x: 0.8 } }), 420);
}

/* ---------- SoundFX ---------- */
const SoundFX = (() => {
  const storageKey = 'srh_sound_enabled';
  let context = null;
  let enabled = Store.get(storageKey, true);

  function getContext() {
    if (!context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) context = new AudioCtor();
    }
    return context;
  }

  function toggle() {
    enabled = !enabled;
    Store.set(storageKey, enabled);
    return enabled;
  }

  function isEnabled() { return enabled; }

  function withContext(callback) {
    if (!enabled) return;
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'running') callback(ctx);
    else ctx.resume().then(() => callback(ctx)).catch(() => {});
  }

  function tone(ctx, start, options = {}) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = options.type || 'sine';
    osc.frequency.setValueAtTime(options.freq || 440, start);
    gain.gain.setValueAtTime(options.gain || 0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + (options.duration || 0.1));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + (options.duration || 0.1));
  }

  return {
    isEnabled,
    toggle,
    memoryFlip() {
      withContext((ctx) => {
        tone(ctx, ctx.currentTime, { freq: 600, duration: 0.05, type: 'sine' });
        tone(ctx, ctx.currentTime + 0.05, { freq: 800, duration: 0.05, type: 'sine' });
      });
    },
    match() {
      withContext((ctx) => {
        tone(ctx, ctx.currentTime, { freq: 523, duration: 0.1 });
        tone(ctx, ctx.currentTime + 0.1, { freq: 659, duration: 0.1 });
        tone(ctx, ctx.currentTime + 0.2, { freq: 784, duration: 0.2 });
      });
    },
    error() {
      withContext((ctx) => {
        tone(ctx, ctx.currentTime, { freq: 200, duration: 0.15, type: 'sawtooth' });
        tone(ctx, ctx.currentTime + 0.15, { freq: 150, duration: 0.15, type: 'sawtooth' });
      });
    }
  };
})();

function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}