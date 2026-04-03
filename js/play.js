/**
 * play.js – Player view
 *
 * Views: join → waiting → question → result → final
 */

/* =========================================================
   State
   ========================================================= */
let playerId   = null;
let playerName = '';
let gameCode   = '';
let channel    = null;
let gameData   = null;   // game from localStorage (same-device)
let quizData   = null;
let score      = 0;
let answered   = false;
let timerInterval = null;
let timeLeft   = 0;
let currentQIdx = -1;

const LETTERS = ['A','B','C','D','E','F'];

/* =========================================================
   View switching
   ========================================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

/* =========================================================
   Join
   ========================================================= */
function initJoin() {
  // Pre-fill code from URL
  const params = new URLSearchParams(location.search);
  const code   = params.get('code');
  if (code) {
    const inp = document.getElementById('inp-code');
    if (inp) inp.value = code.toUpperCase();
  }
  showScreen('screen-join');
}

function joinGame() {
  gameCode   = (document.getElementById('inp-code').value || '').trim().toUpperCase();
  playerName = (document.getElementById('inp-name').value || '').trim();

  if (!gameCode || gameCode.length < 4) { toast('Bitte einen gültigen Spielcode eingeben!', 'error'); return; }
  if (!playerName)                       { toast('Bitte deinen Namen eingeben!',           'error'); return; }

  // Check if game exists in localStorage (same-device mode)
  gameData = GameStore.get(gameCode);
  if (gameData) {
    quizData = QuizStore.get(gameData.quizId);
    if (!quizData) { toast('Quiz nicht gefunden!', 'error'); return; }
  }

  playerId = 'player_' + uuidv4();
  score    = 0;
  answered = false;

  // Open channel
  if (channel) channel.close();
  channel = new QuizChannel(gameCode, handleServerMessage);

  // Send join
  channel.send('player:join', { playerId, name: playerName });

  showScreen('screen-waiting');
  document.getElementById('waiting-name').textContent = playerName;
  document.getElementById('waiting-code').textContent = gameCode;

  // If game already started (same-device, host already clicked next)
  if (gameData?.status === 'active' && gameData.currentQuestion >= 0) {
    const qi = gameData.currentQuestion;
    showQuestion(quizData.questions[qi], qi, quizData.questions.length);
  }
}

/* =========================================================
   Channel messages (from host)
   ========================================================= */
function handleServerMessage(msg) {
  switch (msg.type) {
    case 'host:state':
      if (msg.status === 'active' && msg.questionIdx >= 0 && quizData) {
        showQuestion(quizData.questions[msg.questionIdx], msg.questionIdx, quizData.questions.length);
      }
      break;
    case 'question:show':
      currentQIdx = msg.questionIdx;
      answered = false;
      showQuestion(msg.question, msg.questionIdx, quizData?.questions?.length || '?');
      break;
    case 'question:reveal':
      revealAnswers(msg.correctIds);
      updateScore(msg.scores);
      break;
    case 'question:timeup':
      clearInterval(timerInterval);
      if (!answered) revealAnswers([]);
      break;
    case 'game:end':
      clearInterval(timerInterval);
      showFinal(msg.leaderboard);
      break;
  }
}

/* =========================================================
   Question screen
   ========================================================= */
function showQuestion(question, qi, total) {
  showScreen('screen-question');
  currentQIdx = qi;
  answered = false;
  clearInterval(timerInterval);

  // Progress
  document.getElementById('q-progress').textContent = `${+qi + 1} / ${total}`;
  const pct = total && total !== '?' ? ((+qi + 1) / +total) * 100 : 0;
  document.getElementById('q-progress-fill').style.width = pct + '%';

  // Score
  document.getElementById('q-score').textContent = score;

  // Question text
  document.getElementById('q-text').textContent = question.text;

  // Answers
  const grid = document.getElementById('q-answers');
  grid.innerHTML = question.answers.map((a, ai) => `
    <button class="answer-option" id="ans-${a.id}" onclick="submitAnswer('${a.id}','${question.id}')">
      <span class="answer-letter">${LETTERS[ai]}</span>
      <span>${esc(a.text)}</span>
    </button>`).join('');

  // Timer
  timeLeft = question.timeLimit || 30;
  startTimer(timeLeft, question.timeLimit);
}

function startTimer(seconds, total) {
  updateTimerUI(seconds, total);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI(timeLeft, total);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!answered) {
        answered = true;
        disableAnswers();
        // Server will send timeup, but handle locally too
      }
    }
  }, 1000);
}

function updateTimerUI(t, total) {
  const el  = document.getElementById('timer-text');
  const arc = document.getElementById('timer-arc');
  if (el) el.textContent = t;
  if (arc) {
    const r    = 44;
    const circ = 2 * Math.PI * r;
    arc.style.strokeDasharray  = circ;
    arc.style.strokeDashoffset = circ * (1 - t / total);
    arc.style.stroke = t <= 5 ? 'var(--red)' : t <= 10 ? 'var(--amber)' : 'var(--purple-l)';
  }
  if (el) el.style.color = t <= 5 ? 'var(--red)' : 'var(--text)';
}

/* =========================================================
   Submit answer
   ========================================================= */
function submitAnswer(answerId, questionId) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);
  disableAnswers();
  document.getElementById(`ans-${answerId}`)?.classList.add('selected');

  channel.send('player:answer', {
    playerId,
    questionIdx: currentQIdx,
    answerId,
    timeLeft
  });

  // Show "Antwort abgegeben" feedback
  const feedback = document.getElementById('q-feedback');
  if (feedback) {
    feedback.textContent = '✓ Antwort abgegeben – warte auf Auflösung…';
    feedback.classList.remove('hidden');
  }
}

function disableAnswers() {
  document.querySelectorAll('.answer-option').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.7';
  });
}

/* =========================================================
   Reveal answers (from host)
   ========================================================= */
function revealAnswers(correctIds) {
  clearInterval(timerInterval);
  disableAnswers();

  const feedback = document.getElementById('q-feedback');
  if (feedback) feedback.classList.add('hidden');

  document.querySelectorAll('.answer-option').forEach(el => {
    el.style.opacity = '1';
    const id = el.id.replace('ans-', '');
    if (correctIds.includes(id)) {
      el.classList.add('reveal-correct');
    }
    if (el.classList.contains('selected')) {
      if (correctIds.includes(id)) {
        el.classList.add('correct');
        el.classList.remove('selected');
      } else {
        el.classList.add('wrong');
        el.classList.remove('selected');
      }
    }
  });
}

function updateScore(scores) {
  if (!scores) return;
  const me = scores.find(s => s.id === playerId);
  if (me) {
    const gained = me.score - score;
    score = me.score;
    document.getElementById('q-score').textContent = score;
    if (gained > 0) {
      showScorePopup('+' + gained);
    }
  }
}

function showScorePopup(text) {
  const el = document.createElement('div');
  el.className = 'score-popup';
  el.textContent = text;
  el.style.cssText = `
    position:fixed; top:30%; left:50%; transform:translateX(-50%);
    font-size:3rem; font-weight:900; color:var(--green);
    animation: scorePopAnim 1.5s ease forwards;
    z-index:500; pointer-events:none;
    text-shadow: 0 2px 20px rgba(34,197,94,.6);
  `;
  document.body.appendChild(el);
  // Inject animation if not present
  if (!document.getElementById('score-pop-style')) {
    const style = document.createElement('style');
    style.id = 'score-pop-style';
    style.textContent = '@keyframes scorePopAnim { 0%{opacity:1;transform:translateX(-50%) scale(1)} 100%{opacity:0;transform:translateX(-50%) scale(1.5) translateY(-60px)} }';
    document.head.appendChild(style);
  }
  setTimeout(() => el.remove(), 1500);
}

/* =========================================================
   Final screen
   ========================================================= */
function showFinal(leaderboard) {
  showScreen('screen-final');
  const me = leaderboard.find(p => p.name === playerName);
  const rank = leaderboard.findIndex(p => p.name === playerName) + 1;
  const medals = ['🥇','🥈','🥉'];
  const icon = medals[rank-1] || (rank <= 5 ? '🎖' : '🎮');

  document.getElementById('final-icon').textContent = icon;
  document.getElementById('final-score').textContent = me ? me.score : score;
  document.getElementById('final-rank').textContent  = rank
    ? `Platz ${rank} von ${leaderboard.length}`
    : '';

  const lb = document.getElementById('final-lb');
  lb.innerHTML = leaderboard.map((p, i) => `
    <div class="lb-row" style="animation-delay:${i*0.12}s">
      <span class="lb-rank">${medals[i] || i+1}</span>
      <span class="lb-name ${p.name === playerName ? 'text-primary' : ''}">${esc(p.name)}</span>
      <span class="lb-score">${p.score} Pkt</span>
    </div>`).join('');

  if (rank <= 3) celebrate();
}

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  initJoin();

  // Allow pressing Enter to join
  document.getElementById('inp-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinGame();
  });
  document.getElementById('inp-code')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('inp-name')?.focus();
  });
  // Auto-uppercase the code
  document.getElementById('inp-code')?.addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });
});
