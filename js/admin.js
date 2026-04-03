/**
 * admin.js – Quiz Creator + Game Host
 *
 * Views (sections shown/hidden):
 *   #view-list   – quiz library
 *   #view-editor – quiz / question editor
 *   #view-host   – game host screen
 */

/* =========================================================
   State
   ========================================================= */
let currentQuiz   = null;   // quiz being edited
let currentGame   = null;   // active game session
let channel       = null;   // BroadcastChannel
let timerInterval = null;
let wheel         = null;
let timeLeft      = 0;

/* =========================================================
   Navigation
   ========================================================= */
function showView(id) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

/* =========================================================
   Quiz List
   ========================================================= */
function renderQuizList() {
  showView('view-list');
  const list = QuizStore.all();
  const el   = document.getElementById('quiz-list');
  if (!list.length) {
    el.innerHTML = `<div class="text-center text-muted mt-3">
      Noch keine Quizze. Erstelle dein erstes! 🎉</div>`;
    return;
  }
  el.innerHTML = list.map(q => `
    <div class="quiz-item" data-id="${q.id}">
      <div>
        <div class="quiz-item-title">${esc(q.title)}</div>
        <div class="quiz-item-meta">${q.questions.length} Fragen · Erstellt ${new Date(q.createdAt).toLocaleDateString('de-DE')}</div>
      </div>
      <div class="quiz-item-actions">
        <button class="btn btn-ghost btn-sm" onclick="editQuiz('${q.id}')">✏️ Bearbeiten</button>
        <button class="btn btn-primary btn-sm" onclick="startGame('${q.id}')">▶ Starten</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteQuiz('${q.id}')" title="Löschen">🗑</button>
      </div>
    </div>`).join('');
}

function deleteQuiz(id) {
  if (!confirm('Quiz wirklich löschen?')) return;
  QuizStore.delete(id);
  renderQuizList();
  toast('Quiz gelöscht', 'error');
}

/* =========================================================
   Quiz / Question Editor
   ========================================================= */
function newQuiz() {
  currentQuiz = {
    id: uuidv4(),
    title: '',
    description: '',
    questions: [],
    createdAt: new Date().toISOString()
  };
  renderEditor();
}

function editQuiz(id) {
  currentQuiz = JSON.parse(JSON.stringify(QuizStore.get(id)));
  if (!currentQuiz) return toast('Quiz nicht gefunden', 'error');
  renderEditor();
}

function renderEditor() {
  showView('view-editor');
  document.getElementById('quiz-title').value       = currentQuiz.title;
  document.getElementById('quiz-description').value = currentQuiz.description;
  renderQuestions();
}

function renderQuestions() {
  const el = document.getElementById('question-list');
  el.innerHTML = currentQuiz.questions.map((q, qi) => `
    <div class="question-card" id="qcard-${qi}">
      <div class="question-header">
        <span class="question-num">${qi + 1}</span>
        <div style="flex:1">
          <input type="text" placeholder="Frage eingeben…"
            value="${esc(q.text)}"
            oninput="updateQuestion(${qi},'text',this.value)"
            class="w-full mb-1" />
          <div class="flex gap-1 items-center flex-wrap">
            <label class="form-label" style="min-width:max-content">⏱ Zeit:</label>
            <select style="max-width:120px" onchange="updateQuestion(${qi},'timeLimit',+this.value)">
              ${[10,15,20,30,45,60].map(s =>
                `<option value="${s}" ${q.timeLimit===s?'selected':''}>${s}s</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeQuestion(${qi})">✕</button>
      </div>

      <div class="section-title" style="font-size:.8rem">Antworten</div>
      <div class="answers-grid" id="answers-grid-${qi}">
        ${q.answers.map((a, ai) => renderAnswerEditor(qi, ai, a)).join('')}
      </div>
      ${q.answers.length < 6
        ? `<button class="btn btn-ghost btn-sm mt-1" onclick="addAnswer(${qi})">+ Antwort hinzufügen</button>`
        : ''}
    </div>
  `).join('');
}

function renderAnswerEditor(qi, ai, a) {
  const letters = 'ABCDEF';
  return `
    <div class="answer-option ${a.isCorrect ? 'reveal-correct' : ''}" id="aopt-${qi}-${ai}">
      <span class="answer-letter">${letters[ai]}</span>
      <input type="text" placeholder="Antwort…"
        value="${esc(a.text)}"
        oninput="updateAnswer(${qi},${ai},'text',this.value)"
        style="background:transparent;border:none;box-shadow:none;padding:0;flex:1" />
      <button class="btn btn-sm btn-icon"
        title="${a.isCorrect ? 'Richtig (klicken zum aufheben)' : 'Als richtig markieren'}"
        style="background:${a.isCorrect ? 'var(--green)' : 'var(--glass-border)'}; min-width:2rem"
        onclick="toggleCorrect(${qi},${ai})">
        ${a.isCorrect ? '✓' : ''}
      </button>
      ${currentQuiz.questions[qi].answers.length > 2
        ? `<button class="btn btn-danger btn-sm btn-icon" onclick="removeAnswer(${qi},${ai})">✕</button>`
        : ''}
    </div>`;
}

function updateQuestion(qi, field, val) {
  currentQuiz.questions[qi][field] = val;
}
function updateAnswer(qi, ai, field, val) {
  currentQuiz.questions[qi].answers[ai][field] = val;
}
function toggleCorrect(qi, ai) {
  const answers = currentQuiz.questions[qi].answers;
  answers[ai].isCorrect = !answers[ai].isCorrect;
  renderQuestions();
}
function addAnswer(qi) {
  currentQuiz.questions[qi].answers.push({ id: uuidv4(), text: '', isCorrect: false });
  renderQuestions();
}
function removeAnswer(qi, ai) {
  currentQuiz.questions[qi].answers.splice(ai, 1);
  renderQuestions();
}
function addQuestion() {
  currentQuiz.questions.push({
    id: uuidv4(),
    text: '',
    timeLimit: 30,
    answers: [
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false }
    ]
  });
  renderQuestions();
  // Scroll new card into view
  setTimeout(() => {
    const last = document.getElementById(`qcard-${currentQuiz.questions.length - 1}`);
    last?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}
function removeQuestion(qi) {
  currentQuiz.questions.splice(qi, 1);
  renderQuestions();
}

function saveQuiz() {
  currentQuiz.title = document.getElementById('quiz-title').value.trim();
  currentQuiz.description = document.getElementById('quiz-description').value.trim();
  if (!currentQuiz.title) { toast('Bitte einen Titel eingeben!', 'error'); return; }
  if (!currentQuiz.questions.length) { toast('Mindestens eine Frage erforderlich!', 'error'); return; }
  // Validate each question
  for (let [i, q] of currentQuiz.questions.entries()) {
    if (!q.text.trim()) { toast(`Frage ${i+1}: Text fehlt!`, 'error'); return; }
    if (q.answers.length < 2) { toast(`Frage ${i+1}: Mindestens 2 Antworten!`, 'error'); return; }
    if (!q.answers.some(a => a.isCorrect)) { toast(`Frage ${i+1}: Keine richtige Antwort markiert!`, 'error'); return; }
  }
  QuizStore.upsert(currentQuiz);
  toast('Quiz gespeichert ✓', 'success');
  renderQuizList();
}

/* =========================================================
   Game – Start & Host
   ========================================================= */
function startGame(quizId) {
  const quiz = QuizStore.get(quizId);
  if (!quiz) return toast('Quiz nicht gefunden', 'error');

  const code = generateGameCode();
  currentGame = {
    code,
    quizId,
    status: 'waiting',
    currentQuestion: -1,
    players: [],
    answers: {},   // questionIdx → { playerId: answerId }
    startedAt: new Date().toISOString()
  };
  GameStore.set(code, currentGame);

  // Open BroadcastChannel
  if (channel) channel.close();
  channel = new QuizChannel(code, handleChannelMessage);

  renderHostView(quiz);
  showView('view-host');

  // Show QR code modal
  showStartModal(code);
}

function showStartModal(code) {
  const url  = `${location.origin}${location.pathname.replace('admin.html', '')}play.html?code=${code}`;
  const modal = document.getElementById('modal-start');
  modal.classList.remove('hidden');
  document.getElementById('modal-game-code').textContent = code;
  const qrEl = document.getElementById('modal-qr');
  renderQR(qrEl, url, 200);
  document.getElementById('modal-play-url').textContent = url;
}

function closeStartModal() {
  document.getElementById('modal-start').classList.add('hidden');
}

function handleChannelMessage(msg) {
  if (!currentGame) return;
  switch (msg.type) {
    case 'player:join':
      if (!currentGame.players.find(p => p.id === msg.playerId)) {
        currentGame.players.push({ id: msg.playerId, name: msg.name, score: 0, answers: {} });
        GameStore.set(currentGame.code, currentGame);
        renderPlayerList();
        toast(`${msg.name} ist beigetreten 👋`);
      }
      // Send back current state
      channel.send('host:state', { status: currentGame.status, questionIdx: currentGame.currentQuestion });
      break;
    case 'player:answer':
      recordAnswer(msg.playerId, msg.questionIdx, msg.answerId, msg.timeLeft);
      break;
    case 'player:leave':
      currentGame.players = currentGame.players.filter(p => p.id !== msg.playerId);
      GameStore.set(currentGame.code, currentGame);
      renderPlayerList();
      break;
  }
}

function recordAnswer(playerId, questionIdx, answerId, timeLeft) {
  if (!currentGame.answers[questionIdx]) currentGame.answers[questionIdx] = {};
  if (currentGame.answers[questionIdx][playerId]) return; // already answered
  currentGame.answers[questionIdx][playerId] = { answerId, timeLeft };
  GameStore.set(currentGame.code, currentGame);

  // Mark player chip as answered
  const chip = document.querySelector(`.player-chip[data-id="${playerId}"]`);
  if (chip) chip.classList.add('answered');

  // Update count
  const answeredCount = Object.keys(currentGame.answers[questionIdx] || {}).length;
  const total         = currentGame.players.length;
  const el = document.getElementById('answered-count');
  if (el) el.textContent = `${answeredCount}/${total}`;
}

/* ---------- Render Host View ---------- */
function renderHostView(quiz) {
  const el = document.getElementById('host-quiz-title');
  if (el) el.textContent = quiz.title;
  renderPlayerList();
  updateHostControls();
}

function renderPlayerList() {
  const el = document.getElementById('players-grid');
  if (!el) return;
  el.innerHTML = currentGame.players.length
    ? currentGame.players.map(p => `
        <span class="player-chip ${hasAnswered(p.id) ? 'answered' : ''}" data-id="${p.id}">
          ${esc(p.name)}
        </span>`).join('')
    : '<span class="text-muted text-sm">Noch keine Spieler beigetreten…</span>';
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = currentGame.players.length;
  const countStatEl = document.getElementById('player-count-stat');
  if (countStatEl) countStatEl.textContent = currentGame.players.length;
}

function hasAnswered(playerId) {
  const qi = currentGame.currentQuestion;
  return !!(currentGame.answers[qi]?.[playerId]);
}

function updateHostControls() {
  const qi   = currentGame.currentQuestion;
  const quiz = QuizStore.get(currentGame.quizId);
  const total = quiz?.questions?.length || 0;

  document.getElementById('btn-next-q')?.removeAttribute('disabled');
  if (qi >= total - 1) {
    const btn = document.getElementById('btn-next-q');
    if (btn) { btn.textContent = '🏁 Spiel beenden'; btn.onclick = endGame; }
  }

  const prog = document.getElementById('host-progress');
  if (prog) prog.style.width = total ? `${((qi+1)/total)*100}%` : '0%';

  const qDisp = document.getElementById('host-q-display');
  if (qDisp) {
    if (qi < 0) {
      qDisp.textContent = 'Noch keine Frage aktiv. Klicke auf "Nächste Frage".';
    } else {
      const q = quiz.questions[qi];
      qDisp.innerHTML = `<strong>Frage ${qi+1}/${total}:</strong> ${esc(q.text)}`;
    }
  }
}

/* ---------- Next Question ---------- */
function nextQuestion() {
  const quiz = QuizStore.get(currentGame.quizId);
  const total = quiz.questions.length;
  if (currentGame.currentQuestion >= total - 1) { endGame(); return; }

  // Reveal previous answer first if needed
  if (currentGame.currentQuestion >= 0) revealAnswer();

  currentGame.currentQuestion++;
  currentGame.status = 'active';
  GameStore.set(currentGame.code, currentGame);

  const q = quiz.questions[currentGame.currentQuestion];
  channel.send('question:show', {
    questionIdx: currentGame.currentQuestion,
    question: q,
    timeLimit: q.timeLimit
  });

  // Host timer display
  startHostTimer(q.timeLimit);
  updateHostControls();
  renderPlayerList();

  // Update answered count
  const el = document.getElementById('answered-count');
  if (el) el.textContent = `0/${currentGame.players.length}`;
}

function revealAnswer() {
  if (!currentGame || currentGame.currentQuestion < 0) return;
  const quiz = QuizStore.get(currentGame.quizId);
  const qi   = currentGame.currentQuestion;
  const q    = quiz.questions[qi];
  const correct = q.answers.filter(a => a.isCorrect).map(a => a.id);

  // Score players
  const answered = currentGame.answers[qi] || {};
  currentGame.players.forEach(p => {
    const ans = answered[p.id];
    if (!ans) return;
    if (correct.includes(ans.answerId)) {
      const bonus = Math.max(0, Math.round(ans.timeLeft * 10)); // time bonus
      p.score += 100 + bonus;
    }
  });
  GameStore.set(currentGame.code, currentGame);

  channel.send('question:reveal', {
    questionIdx: qi,
    correctIds: correct,
    scores: currentGame.players.map(p => ({ id: p.id, score: p.score }))
  });

  clearInterval(timerInterval);
}

function endGame() {
  clearInterval(timerInterval);
  revealAnswer();
  currentGame.status = 'ended';
  GameStore.set(currentGame.code, currentGame);

  const sorted = [...currentGame.players].sort((a, b) => b.score - a.score);
  channel.send('game:end', { leaderboard: sorted.map(p => ({ name: p.name, score: p.score })) });

  showHostLeaderboard(sorted);
}

function showHostLeaderboard(sorted) {
  const el = document.getElementById('host-leaderboard');
  if (!el) return;
  el.classList.remove('hidden');
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('host-lb-list').innerHTML = sorted.map((p, i) => `
    <div class="lb-row" style="animation-delay:${i*0.1}s">
      <span class="lb-rank">${medals[i] || i+1}</span>
      <span class="lb-name">${esc(p.name)}</span>
      <span class="lb-score">${p.score} Pkt</span>
    </div>`).join('');
  celebrate();
}

/* ---------- Host Timer ---------- */
function startHostTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft = seconds;
  updateTimerDisplay(seconds, seconds);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft, seconds);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      channel.send('question:timeup', { questionIdx: currentGame.currentQuestion });
    }
  }, 1000);
}

function updateTimerDisplay(t, total) {
  const el  = document.getElementById('host-timer-text');
  const arc = document.getElementById('host-timer-arc');
  if (el)  el.textContent = t;
  if (arc) {
    const r = 44, circ = 2 * Math.PI * r;
    arc.style.strokeDasharray  = circ;
    arc.style.strokeDashoffset = circ * (1 - t / total);
    arc.style.stroke = t <= 5 ? 'var(--red)' : t <= 10 ? 'var(--amber)' : 'var(--purple-l)';
  }
  if (el) el.style.color = t <= 5 ? 'var(--red)' : 'var(--text)';
}

/* =========================================================
   Lucky Wheel
   ========================================================= */
function openWheel() {
  const overlay = document.getElementById('wheel-overlay');
  overlay.classList.remove('hidden');
  document.getElementById('wheel-winner').classList.add('hidden');
  document.getElementById('btn-spin').disabled = false;

  const playerNames = currentGame?.players.map(p => p.name) || [];
  const names = playerNames.length
    ? playerNames
    : ['Spieler 1','Spieler 2','Spieler 3','Spieler 4','Spieler 5'];

  const canvas = document.getElementById('wheel-canvas');
  wheel = new LuckyWheel(canvas, names);
  wheel.onWinner = name => {
    const winEl = document.getElementById('wheel-winner');
    winEl.textContent = `🎉 ${name} gewinnt! 🎉`;
    winEl.classList.remove('hidden');
    celebrate();
  };
}

function spinWheel() {
  if (!wheel) return;
  document.getElementById('btn-spin').disabled = true;
  document.getElementById('wheel-winner').classList.add('hidden');
  wheel.spin();
}

function closeWheel() {
  document.getElementById('wheel-overlay').classList.add('hidden');
  wheel = null;
}

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  renderQuizList();

  // Keyboard shortcut: Ctrl+S saves quiz
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !document.getElementById('view-editor').classList.contains('hidden')) {
      e.preventDefault();
      saveQuiz();
    }
  });
});
