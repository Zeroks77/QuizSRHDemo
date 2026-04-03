/**
 * admin.js – Quiz Creator + Messe-Host
 */

let currentQuiz = null;
let currentGame = null;

function showView(id) {
  document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function renderQuizList() {
  showView('view-list');
  const list = QuizStore.all();
  const el = document.getElementById('quiz-list');

  if (!list.length) {
    el.innerHTML = `<div class="text-center text-muted mt-3">Noch keine Quizze. Lade eine Vorlage oder erstelle dein erstes SRH Messe-Quiz.</div>`;
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
        <button class="btn btn-primary btn-sm" onclick="startGame('${q.id}')">▶ Vorbereiten</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteQuiz('${q.id}')" title="Löschen">🗑</button>
      </div>
    </div>`).join('');
}

function deleteQuiz(id) {
  if (!confirm('Quiz wirklich löschen?')) return;
  QuizStore.delete(id);
  if (currentGame?.quizId === id) {
    GameStore.remove(currentGame.code);
    ActiveGameStore.clear();
    currentGame = null;
  }
  renderQuizList();
  toast('Quiz gelöscht', 'error');
}

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
  document.getElementById('quiz-title').value = currentQuiz.title;
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
              ${[10,15,20,30,45,60].map(s => `<option value="${s}" ${q.timeLimit === s ? 'selected' : ''}>${s}s</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeQuestion(${qi})">✕</button>
      </div>

      <div class="section-title" style="font-size:.8rem">Antworten</div>
      <div class="answers-grid" id="answers-grid-${qi}">
        ${q.answers.map((a, ai) => renderAnswerEditor(qi, ai, a)).join('')}
      </div>
      ${q.answers.length < 6 ? `<button class="btn btn-ghost btn-sm mt-1" onclick="addAnswer(${qi})">+ Antwort hinzufügen</button>` : ''}
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
      ${currentQuiz.questions[qi].answers.length > 2 ? `<button class="btn btn-danger btn-sm btn-icon" onclick="removeAnswer(${qi},${ai})">✕</button>` : ''}
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
  setTimeout(() => {
    document.getElementById(`qcard-${currentQuiz.questions.length - 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

function removeQuestion(qi) {
  currentQuiz.questions.splice(qi, 1);
  renderQuestions();
}

function validateCurrentQuiz() {
  currentQuiz.title = document.getElementById('quiz-title').value.trim();
  currentQuiz.description = document.getElementById('quiz-description').value.trim();

  if (!currentQuiz.title) {
    toast('Bitte einen Titel eingeben!', 'error');
    return false;
  }
  if (!currentQuiz.questions.length) {
    toast('Mindestens eine Frage erforderlich!', 'error');
    return false;
  }

  for (const [index, question] of currentQuiz.questions.entries()) {
    if (!question.text.trim()) {
      toast(`Frage ${index + 1}: Text fehlt!`, 'error');
      return false;
    }
    if (question.answers.length < 2) {
      toast(`Frage ${index + 1}: Mindestens 2 Antworten!`, 'error');
      return false;
    }
    if (!question.answers.some(answer => answer.isCorrect)) {
      toast(`Frage ${index + 1}: Keine richtige Antwort markiert!`, 'error');
      return false;
    }
  }

  return true;
}

function saveQuiz() {
  if (!currentQuiz || !validateCurrentQuiz()) return;
  QuizStore.upsert(currentQuiz);
  toast('Quiz gespeichert ✓', 'success');
  renderQuizList();
}

function saveAndStart() {
  if (!currentQuiz || !validateCurrentQuiz()) return;
  QuizStore.upsert(currentQuiz);
  startGame(currentQuiz.id);
}

function buildGameState(quizId, existingCode = generateGameCode()) {
  const quiz = QuizStore.get(quizId);
  return {
    code: existingCode,
    quizId,
    status: 'ready',
    currentQuestion: -1,
    totalQuestions: quiz?.questions?.length || 0,
    currentPlayer: {
      name: 'Messegast',
      score: 0
    },
    answers: {},
    preparedAt: new Date().toISOString(),
    finishedAt: null,
    lastResult: null
  };
}

function persistCurrentGame() {
  if (!currentGame) return;
  GameStore.set(currentGame.code, currentGame);
  ActiveGameStore.set(currentGame.code);
}

function startGame(quizId) {
  const quiz = QuizStore.get(quizId);
  if (!quiz) return toast('Quiz nicht gefunden', 'error');

  currentGame = buildGameState(quizId, currentGame?.quizId === quizId ? currentGame.code : generateGameCode());
  persistCurrentGame();
  renderHostView(quiz);
  showView('view-host');
  showStartModal();
}

function restartGame() {
  if (!currentGame) return;
  currentGame = buildGameState(currentGame.quizId, currentGame.code);
  persistCurrentGame();
  renderHostView(QuizStore.get(currentGame.quizId));
  toast('Quiz wurde für den nächsten Messegast neu vorbereitet.', 'success');
}

function getPlayerJoinUrl() {
  return `${location.origin}${location.pathname.replace('admin.html', '')}play.html`;
}

function showStartModal() {
  const modal = document.getElementById('modal-start');
  modal.classList.remove('hidden');
  const quiz = QuizStore.get(currentGame?.quizId);
  document.getElementById('modal-quiz-title').textContent = quiz?.title || 'SRH Messe-Quiz';
  document.getElementById('modal-play-url').textContent = getPlayerJoinUrl();
}

function closeStartModal() {
  document.getElementById('modal-start').classList.add('hidden');
}

function openPlayerView() {
  window.open(getPlayerJoinUrl(), '_blank', 'noopener');
}

async function copyPlayerLink() {
  const url = getPlayerJoinUrl();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      toast('Spieler-Link kopiert ✓', 'success');
      return;
    }
  } catch (_) {}
  window.prompt('Spieler-Link kopieren:', url);
}

function syncCurrentGameFromStore() {
  if (!currentGame?.code) return;
  const latest = GameStore.get(currentGame.code);
  if (!latest) return;
  currentGame = latest;
  updateHostControls();
}

function renderHostView(quiz) {
  document.getElementById('host-quiz-title').textContent = quiz?.title || 'SRH Messe-Quiz';
  document.getElementById('host-quiz-description').textContent = quiz?.description || 'Bereit für den nächsten Messegast.';
  updateHostControls();
}

function updateHostControls() {
  if (!currentGame) return;

  const quiz = QuizStore.get(currentGame.quizId);
  const total = quiz?.questions?.length || 0;
  const activeIndex = Math.max(0, currentGame.currentQuestion + 1);
  const progress = currentGame.status === 'finished'
    ? 100
    : total
      ? Math.round((activeIndex / total) * 100)
      : 0;

  const statusMap = {
    ready: 'Bereit für Start',
    active: 'Quiz läuft',
    finished: 'Quiz abgeschlossen'
  };

  document.getElementById('game-status').textContent = statusMap[currentGame.status] || 'Unbekannt';
  document.getElementById('question-count-stat').textContent = String(total);
  document.getElementById('progress-stat').textContent = currentGame.status === 'ready' ? '0 / ' + total : `${activeIndex} / ${total}`;
  document.getElementById('score-stat').textContent = `${currentGame.currentPlayer?.score || 0}`;
  document.getElementById('host-progress').style.width = `${progress}%`;

  const display = document.getElementById('host-q-display');
  if (currentGame.status === 'ready') {
    display.innerHTML = total
      ? `<strong>Bereit:</strong> ${esc(quiz.questions[0].text)}`
      : 'Dieses Quiz enthält noch keine Fragen.';
  } else if (currentGame.status === 'active') {
    const question = quiz.questions[currentGame.currentQuestion];
    display.innerHTML = question
      ? `<strong>Aktuelle Frage ${currentGame.currentQuestion + 1}/${total}:</strong> ${esc(question.text)}`
      : 'Das Quiz läuft gerade.';
  } else {
    display.innerHTML = `<strong>Abgeschlossen:</strong> ${currentGame.lastResult?.score ?? currentGame.currentPlayer?.score ?? 0} Punkte erzielt.`;
  }

  renderHostTimeline(quiz);
  renderHostResult();
}

function renderHostTimeline(quiz) {
  const el = document.getElementById('host-status-list');
  if (!el) return;

  if (!quiz?.questions?.length) {
    el.innerHTML = '<span class="text-muted text-sm">Keine Fragen vorhanden.</span>';
    return;
  }

  if (currentGame.status === 'ready') {
    el.innerHTML = `
      <div class="lb-row">
        <span class="lb-rank">1</span>
        <span class="lb-name">Quiz vorbereitet</span>
        <span class="lb-score">${quiz.questions.length} Fragen</span>
      </div>
      <div class="lb-row">
        <span class="lb-rank">▶</span>
        <span class="lb-name">Spieleransicht öffnen</span>
        <span class="lb-score">SRH Messemodus</span>
      </div>`;
    return;
  }

  if (currentGame.status === 'active') {
    el.innerHTML = quiz.questions.map((question, index) => `
      <div class="lb-row">
        <span class="lb-rank">${index + 1}</span>
        <span class="lb-name">${esc(question.text)}</span>
        <span class="lb-score">${index < currentGame.currentQuestion ? '✓' : index === currentGame.currentQuestion ? 'Live' : 'Offen'}</span>
      </div>`).join('');
    return;
  }

  el.innerHTML = `
    <div class="lb-row">
      <span class="lb-rank">🏁</span>
      <span class="lb-name">Letzter Lauf abgeschlossen</span>
      <span class="lb-score">${currentGame.lastResult?.score ?? currentGame.currentPlayer?.score ?? 0} Punkte</span>
    </div>
    <div class="lb-row">
      <span class="lb-rank">🔄</span>
      <span class="lb-name">Neustart möglich</span>
      <span class="lb-score">Für den nächsten Gast</span>
    </div>`;
}

function renderHostResult() {
  const el = document.getElementById('host-lb-list');
  if (!el) return;

  if (currentGame.status !== 'finished') {
    el.innerHTML = '<span class="text-muted text-sm">Sobald ein Lauf abgeschlossen wurde, erscheint hier das Ergebnis.</span>';
    return;
  }

  const result = currentGame.lastResult || currentGame.currentPlayer || { name: 'Messegast', score: 0 };
  el.innerHTML = `
    <div class="lb-row">
      <span class="lb-rank">🏆</span>
      <span class="lb-name">${esc(result.name || 'Messegast')}</span>
      <span class="lb-score">${result.score} Pkt</span>
    </div>`;
}

function presetQuestion(text, timeLimit, answers, correctIndices = [0]) {
  const correctList = Array.isArray(correctIndices) ? correctIndices : [correctIndices];
  return {
    id: uuidv4(),
    text,
    timeLimit,
    answers: answers.map((answer, index) => ({
      id: uuidv4(),
      text: answer,
      isCorrect: correctList.includes(index)
    }))
  };
}

function getPresetQuizzes() {
  return [
    {
      title: 'SRH Messe-Quiz – Studium & Zukunft',
      description: 'Vordefinierte Fragen für Gespräche am SRH Messestand.',
      questions: [
        presetQuestion('Wofür steht SRH besonders?', 20, ['Leidenschaft fürs Leben', 'Nur Fernstudium', 'Ausschließlich Technik', 'Nur Heidelberg'], 0),
        presetQuestion('Welches Format passt gut zu einem SRH Messe-Quiz?', 20, ['Einzelmodus direkt am Stand', 'Nur Multiplayer', 'Nur Papierfragebogen', 'Nur Audio ohne Display'], 0),
        presetQuestion('Was ist für Studieninteressierte besonders wichtig?', 20, ['Persönliche Betreuung', 'Zufällige Inhalte', 'Unklare Bewerbungswege', 'Versteckte Informationen'], 0),
        presetQuestion('Welche Aussage passt zu einer Messe-Situation?', 20, ['Kurze, klare Fragen funktionieren gut', 'Nur sehr lange Texte sind geeignet', 'Timer sollten nie sichtbar sein', 'Branding ist unwichtig'], 0)
      ]
    },
    {
      title: 'SRH Messe-Quiz – Campus & Community',
      description: 'Zweite Vorlage mit lockeren Einstiegsfragen für Messestände.',
      questions: [
        presetQuestion('Was hilft auf einer Messe beim Einstieg ins Gespräch?', 15, ['Ein kurzes Quiz', 'Nur Flyer ohne Interaktion', 'Komplizierte Formulare', 'Stille'], 0),
        presetQuestion('Welche Darstellung ist für Besucher:innen am angenehmsten?', 15, ['Klare Texte und starke Kontraste', 'Sehr kleine Schrift', 'Viele Fachbegriffe', 'Unruhige Navigation'], 0),
        presetQuestion('Wie sollte ein Messe-Quiz nach einem Durchlauf weitergehen?', 15, ['Direkt neu startbar sein', 'Manuell im Code zurückgesetzt werden', 'Nur nach Browser-Neustart', 'Gar nicht'], 0),
        presetQuestion('Welche Rolle spielt das SRH Branding?', 15, ['Es sorgt für Wiedererkennung', 'Es ist überflüssig', 'Es darf nur im Footer stehen', 'Es erschwert die Nutzung'], 0)
      ]
    }
  ].map(quiz => ({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...quiz
  }));
}

function upsertPresetQuiz(preset) {
  const existing = QuizStore.all().find(quiz => quiz.title === preset.title);
  if (existing) {
    preset.id = existing.id;
    preset.createdAt = existing.createdAt;
  }
  QuizStore.upsert(preset);
}

function loadPresetQuizzes() {
  getPresetQuizzes().forEach(upsertPresetQuiz);
  renderQuizList();
  toast('SRH Quiz-Vorlagen geladen ✓', 'success');
}

function createDemoQuiz() {
  upsertPresetQuiz(getPresetQuizzes()[0]);
  renderQuizList();
  toast('SRH Demo-Quiz geladen ✓', 'success');
}

window.addEventListener('storage', event => {
  if (!currentGame?.code || event.key !== 'game_' + currentGame.code) return;
  syncCurrentGameFromStore();
});

document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  renderQuizList();

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's' && !document.getElementById('view-editor').classList.contains('hidden')) {
      event.preventDefault();
      saveQuiz();
    }
  });
});
