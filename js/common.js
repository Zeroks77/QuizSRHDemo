/**
 * common.js – Shared utilities
 * Storage, BroadcastChannel, helpers
 */

/* =========================================================
   UUID
   ========================================================= */
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

/* =========================================================
   LocalStorage helpers
   ========================================================= */
const Store = {
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
  },
  remove(key) { localStorage.removeItem(key); }
};

/* Quiz CRUD */
const QuizStore = {
  all()          { return Store.get('quizzes', []); },
  save(quizzes)  { Store.set('quizzes', quizzes); },
  get(id)        { return this.all().find(q => q.id === id) || null; },
  upsert(quiz) {
    const list = this.all();
    const idx  = list.findIndex(q => q.id === quiz.id);
    if (idx >= 0) list[idx] = quiz; else list.push(quiz);
    this.save(list);
    return quiz;
  },
  delete(id) {
    this.save(this.all().filter(q => q.id !== id));
  }
};

/* Game Session Store */
const GameStore = {
  get(code)    { return Store.get('game_' + code, null); },
  set(code, g) { Store.set('game_' + code, g); },
  remove(code) { Store.remove('game_' + code); }
};

/* =========================================================
   BroadcastChannel – real-time sync between tabs
   ========================================================= */
class QuizChannel {
  constructor(code, onMessage) {
    this.code = code;
    this.ch = new BroadcastChannel('quizsah_' + code);
    this.ch.onmessage = e => onMessage && onMessage(e.data);
  }
  send(type, payload = {}) {
    this.ch.postMessage({ type, ...payload, _ts: Date.now() });
  }
  close() { this.ch.close(); }
}

/* =========================================================
   Game code generator
   ========================================================= */
function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* =========================================================
   Toast notifications
   ========================================================= */
function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

/* =========================================================
   Stars background animation
   ========================================================= */
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

/* =========================================================
   QR Code helper (uses qrcode.js lib)
   ========================================================= */
function renderQR(container, text, size = 200) {
  if (typeof QRCode === 'undefined') { container.textContent = text; return; }
  container.innerHTML = '';
  new QRCode(container, {
    text,
    width: size,
    height: size,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

/* =========================================================
   Confetti (uses canvas-confetti lib)
   ========================================================= */
function celebrate() {
  if (typeof confetti === 'undefined') return;
  const colors = ['#7c3aed','#db2777','#f59e0b','#22c55e','#0d9488'];
  confetti({ particleCount: 120, spread: 70, colors, origin: { y: .55 } });
  setTimeout(() => confetti({ particleCount: 60, spread: 50, colors, origin: { y: .6, x: .2 } }), 400);
  setTimeout(() => confetti({ particleCount: 60, spread: 50, colors, origin: { y: .6, x: .8 } }), 700);
}

/* =========================================================
   Escape HTML for safe insertion
   ========================================================= */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* =========================================================
   Format seconds to MM:SS
   ========================================================= */
function fmtSec(s) {
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(s%60).padStart(2,'0')}` : String(s);
}
