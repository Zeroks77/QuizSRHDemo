/**
 * common.js – Shared utilities (Überarbeitet)
 */

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

const WINDOW_STORAGE_PREFIX = '__SRH_EXPERIENCE_STORE__:';

function readWindowNameStore() {
  try {
    if (!String(window.name || '').startsWith(WINDOW_STORAGE_PREFIX)) return {};
    const raw = window.name.slice(WINDOW_STORAGE_PREFIX.length);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeWindowNameStore(store) {
  try {
    window.name = WINDOW_STORAGE_PREFIX + JSON.stringify(store);
  } catch {
    // Ignore fallback serialization errors and continue without tab fallback.
  }
}

function canUseLocalStorage() {
  try {
    const testKey = '__srh_storage_probe__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const StorageRuntime = (() => {
  const windowStore = readWindowNameStore();
  const hasLocalStorage = canUseLocalStorage();

  function getLocalValue(key) {
    if (!hasLocalStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function getFallbackValue(key) {
    return Object.prototype.hasOwnProperty.call(windowStore, key) ? windowStore[key] : null;
  }

  return {
    getCandidates(key) {
      const values = [];
      const localValue = getLocalValue(key);
      const fallbackValue = getFallbackValue(key);

      if (localValue !== null) values.push(localValue);
      if (fallbackValue !== null && fallbackValue !== localValue) values.push(fallbackValue);

      return values;
    },
    setItem(key, value) {
      windowStore[key] = value;
      writeWindowNameStore(windowStore);

      if (!hasLocalStorage) return;

      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(error);
      }
    },
    removeItem(key) {
      delete windowStore[key];
      writeWindowNameStore(windowStore);

      if (!hasLocalStorage) return;

      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(error);
      }
    },
    getStatus() {
      return {
        hasLocalStorage,
        isFileProtocol: window.location.protocol === 'file:'
      };
    }
  };
})();

const Store = {
  get(key, def = null) {
    const values = StorageRuntime.getCandidates(key);

    for (const raw of values) {
      try {
        return JSON.parse(raw) ?? def;
      } catch {
        // Continue with the next backend if one payload is invalid.
      }
    }

    return def;
  },
  set(key, val) {
    try {
      StorageRuntime.setItem(key, JSON.stringify(val));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  remove(key) {
    try {
      StorageRuntime.removeItem(key);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  getStatus() {
    return StorageRuntime.getStatus();
  }
};

const QuizStore = {
  all() {
    const quizzes = Store.get('quizzes', []);
    return Array.isArray(quizzes) ? quizzes : [];
  },
  save(quizzes) { Store.set('quizzes', quizzes); },
  get(id) { return this.all().find(q => q.id === id) || null; },
  delete(id) {
    this.save(this.all().filter(q => q.id !== id));
  },
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

const AdminDraftStore = {
  get() { return Store.get('admin_quiz_draft', null); },
  set(quiz) { Store.set('admin_quiz_draft', quiz); },
  clear() { Store.remove('admin_quiz_draft'); }
};

const AdminStateStore = {
  getCurrentQuizId() { return Store.get('admin_current_quiz_id', null); },
  setCurrentQuizId(id) { Store.set('admin_current_quiz_id', id); },
  clear() { Store.remove('admin_current_quiz_id'); }
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