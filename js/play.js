/**
 * play.js - SRH Experience Player
 * Supports questions, memory, wheel, and mystery box modes.
 */

let currentGame = null;
let quizData = null;
let correctAnswers = 0;
let timerInterval = null;
let autoAdvanceTimeout = null;
let timeLeft = 0;
let currentRunMode = 'quiz';
let currentTotalTime = 0;
let currentWheel = null;

const MEMORY_BASE_TIME = 30;
const MEMORY_TIME_PER_PAIR = 8;
const QUIZ_BASE_TIME = 18;
const QUIZ_MULTI_TIME = 26;

const MODE_META = {
  quiz: {
    modeLabel: 'Questions',
    navLabel: 'Questions',
    kicker: 'Question Experience',
    description: 'Klare Fragen mit Single- und Multi-Select direkt auf dem Screen.',
    countLabel: 'Fragen',
    startButton: 'Questions starten',
    finishPrimaryLabel: 'Richtige Antworten',
    finishSecondaryLabel: 'Quote',
    finishTertiaryLabel: 'Antworttyp'
  },
  memory: {
    modeLabel: 'Memory',
    navLabel: 'Memory',
    kicker: 'Memory Experience',
    description: 'Verbinde Themen und Aussagen in einer hochwertigen Memory-Ansicht direkt auf dem Screen.',
    countLabel: 'Paare',
    startButton: 'Memory starten',
    finishPrimaryLabel: 'Gefundene Paare',
    finishSecondaryLabel: 'Zuege',
    finishTertiaryLabel: 'Status'
  },
  wheel: {
    modeLabel: 'Gluecksrad',
    navLabel: 'Gluecksrad',
    kicker: 'Wheel Experience',
    description: 'Ein Spin bringt Themen, Werte und Impulse der SRH Holding sichtbar nach vorn.',
    countLabel: 'Segmente',
    startButton: 'Rad starten',
    finishPrimaryLabel: 'Spins',
    finishSecondaryLabel: 'Themen gezeigt',
    finishTertiaryLabel: 'Letzter Impuls'
  },
  mystery: {
    modeLabel: 'Mystery Boxen',
    navLabel: 'Mystery',
    kicker: 'Reveal Experience',
    description: 'Oeffne Mystery Boxen und bringe SRH Insights Schritt fuer Schritt auf den Screen.',
    countLabel: 'Boxen',
    startButton: 'Reveal starten',
    finishPrimaryLabel: 'Geoeffnet',
    finishSecondaryLabel: 'Boxen gesamt',
    finishTertiaryLabel: 'Status'
  }
};

/* ---------- Particle System ---------- */
function createParticles(x, y, color = '#22c55e', count = 12) {
  for (let index = 0; index < count; index++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = color;

    const angle = (index / count) * Math.PI * 2;
    const velocity = 60 + Math.random() * 60;
    particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
    particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

/* ---------- Sound Toggle ---------- */
function toggleSoundEffects() {
  if (!SoundFX?.toggle) return;
  const enabled = SoundFX.toggle();
  const button = document.getElementById('btn-sound-toggle');
  const label = document.getElementById('sound-toggle-label');
  if (button && label) {
    button.classList.toggle('is-off', !enabled);
    button.setAttribute('aria-pressed', String(enabled));
    label.textContent = enabled ? 'Sound an' : 'Sound aus';
  }
}

function syncSoundToggle() {
  const enabled = SoundFX?.isEnabled ? SoundFX.isEnabled() : true;
  const button = document.getElementById('btn-sound-toggle');
  const label = document.getElementById('sound-toggle-label');
  if (!button || !label) return;

  button.classList.toggle('is-off', !enabled);
  button.setAttribute('aria-pressed', String(enabled));
  label.textContent = enabled ? 'Sound an' : 'Sound aus';
}

/* ---------- Screen Management ---------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function getModeMeta(mode = currentRunMode) {
  return MODE_META[mode] || MODE_META.quiz;
}

function getFieldText(item, keys = []) {
  for (const key of keys) {
    const value = String(item?.[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function getCorrectText(question) {
  const directText = getFieldText(question, ['match', 'detail', 'reveal', 'note']);
  if (directText) return directText;
  return question?.answers?.find((answer) => answer.isCorrect)?.text || question?.answers?.[0]?.text || '';
}

function getVisibleItemCount(mode = currentRunMode) {
  const total = quizData?.questions?.length || 0;
  return ['memory', 'wheel', 'mystery'].includes(mode) ? Math.min(total, 6) : total;
}

function shuffleItems(items = []) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}

/* ---------- Game Initialization ---------- */
function initPlay() {
  syncSoundToggle();
  if (!loadActiveQuiz()) {
    showMissingGame();
    return;
  }

  correctAnswers = 0;
  currentWheel = null;
  renderStartScreen();
  showScreen('screen-start');
}

function loadActiveQuiz() {
  const activeCode = ActiveGameStore.get();
  currentGame = activeCode ? GameStore.get(activeCode) : null;
  quizData = currentGame ? QuizStore.get(currentGame.quizId) : null;
  currentRunMode = getQuizMode(currentGame || quizData);
  return !!(currentGame && quizData);
}

function renderStartScreen() {
  const meta = getModeMeta();
  const itemCount = getVisibleItemCount();
  const stateLabel = currentGame?.status === 'finished'
    ? 'Done'
    : currentGame?.status === 'active'
      ? 'Live'
      : 'Ready';
  const chipLabel = currentGame?.status === 'finished'
    ? 'Fertig'
    : currentGame?.status === 'active'
      ? 'Live'
      : 'Bereit';

  setText('play-mode-chip', meta.navLabel);
  setText('start-kicker', meta.kicker);
  setText('start-title', quizData?.title || 'SRH Experience');
  setText('start-description', meta.description);
  setText('start-question-count', String(itemCount));
  setText('start-count-label', meta.countLabel);
  setText('start-mode-name', meta.modeLabel);
  setText('start-state-label', stateLabel);
  setText('start-status-chip', chipLabel);

  const startButton = document.getElementById('btn-start-quiz');
  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = meta.startButton;
  }
}

function showMissingGame() {
  setText('play-mode-chip', 'Player View');
  setText('start-kicker', 'Player View');
  setText('start-title', 'Noch keine Experience vorbereitet');
  setText('start-description', 'Bitte zuerst in der Admin-Ansicht eine SRH Experience anlegen und speichern.');
  setText('start-question-count', '0');
  setText('start-count-label', 'Module');
  setText('start-mode-name', 'Setup');
  setText('start-state-label', 'Warten');
  setText('start-status-chip', 'Kein Inhalt');

  const startButton = document.getElementById('btn-start-quiz');
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'Experience fehlt';
  }

  showScreen('screen-start');
}

/* ---------- Questions ---------- */
function normalizeQuizQuestion(question, index) {
  const answers = (question?.answers || [])
    .slice(0, 4)
    .map((answer, answerIndex) => ({
      id: `answer-${index + 1}-${answerIndex + 1}`,
      text: String(answer?.text || '').trim(),
      isCorrect: Boolean(answer?.isCorrect)
    }))
    .filter((answer) => answer.text);

  if (answers.length && !answers.some((answer) => answer.isCorrect)) {
    answers[0].isCorrect = true;
  }

  return {
    id: `question-${index + 1}`,
    text: String(question?.text || '').trim(),
    answers,
    timeLimit: Number(question?.timeLimit) || 0
  };
}

function buildQuizQuestions(quiz) {
  if (!quiz?.questions) return [];
  return quiz.questions
    .map((question, index) => normalizeQuizQuestion(question, index))
    .filter((question) => question.text && question.answers.length >= 2);
}

function isMultiAnswerQuestion(question) {
  return question?.answers?.filter((answer) => answer.isCorrect).length > 1;
}

function getQuizTimeLimit(question) {
  if (Number(question?.timeLimit) > 0) return Number(question.timeLimit);
  return isMultiAnswerQuestion(question) ? QUIZ_MULTI_TIME : QUIZ_BASE_TIME;
}

function startQuestionRun() {
  const questions = buildQuizQuestions(quizData);
  if (!questions.length) {
    toast('Dieser Questions-Run benoetigt mindestens zwei Antwortoptionen pro Frage.', 'error');
    return;
  }

  currentRunMode = 'quiz';
  correctAnswers = 0;
  currentGame.mode = 'quiz';
  currentGame.status = 'active';
  currentGame.modeState = {
    questions,
    currentIndex: 0,
    selectedIndexes: [],
    answered: false,
    results: []
  };

  saveGameState();
  setText('play-mode-chip', 'Questions');
  showScreen('screen-quiz');
  renderQuestionStage();
}

function renderQuestionStage() {
  const state = currentGame?.modeState;
  if (!state) return;

  const question = state.questions[state.currentIndex];
  if (!question) {
    finishExperience();
    return;
  }

  const isMulti = isMultiAnswerQuestion(question);
  const feedback = document.getElementById('quiz-feedback');
  if (feedback) {
    feedback.textContent = '';
    feedback.classList.add('hidden');
    feedback.classList.remove('is-correct', 'is-wrong');
  }

  setText('quiz-stage-title', quizData?.title || 'SRH Holding Questions');
  setText('quiz-stage-description', 'Klare Fragen mit Single- und Multi-Select direkt auf dem Screen. Ideal fuer Eventflaechen, Touchpoints und schnelle Aktivierung.');
  setText('quiz-progress-count', `${state.currentIndex + 1} / ${state.questions.length}`);
  setText('quiz-correct-count', String(correctAnswers));
  setText('quiz-answer-mode', isMulti ? 'Multi Select' : 'Single Select');
  setText('quiz-topic-label', isMulti ? 'Mehrere Antworten richtig' : 'Eine Antwort richtig');
  setText('quiz-question-text', question.text);
  setText('quiz-question-note', isMulti
    ? 'Markiere alle passenden Antworten und tippe dann auf Antwort pruefen.'
    : 'Tippe direkt auf die passende Antwort.');

  const bar = document.getElementById('quiz-progress-bar');
  if (bar) {
    bar.style.width = `${((state.currentIndex + 1) / Math.max(state.questions.length, 1)) * 100}%`;
  }

  renderQuestionAnswers(question);
  updateQuizSubmitButton(question);

  clearInterval(timerInterval);
  clearTimeout(autoAdvanceTimeout);
  currentTotalTime = getQuizTimeLimit(question);
  startQuizTimer(currentTotalTime);
}

function renderQuestionAnswers(question) {
  const state = currentGame?.modeState;
  const grid = document.getElementById('quiz-answer-grid');
  if (!state || !grid) return;

  grid.innerHTML = question.answers.map((answer, index) => {
    const letter = String.fromCharCode(65 + index);
    const isSelected = state.selectedIndexes.includes(index);
    const resultClass = state.answered ? getQuestionAnswerResultClass(question, index, isSelected) : '';

    return `
      <button class="quiz-answer-card ${isSelected && !state.answered ? 'is-selected' : ''} ${resultClass} ${state.answered ? 'is-locked' : ''}"
              type="button"
              onclick="toggleQuestionAnswer(${index})">
        <span class="quiz-answer-badge">${letter}</span>
        <div class="quiz-answer-body">
          <strong>${esc(answer.text)}</strong>
          <p>Antwortoption</p>
        </div>
      </button>
    `;
  }).join('');
}

function getQuestionAnswerResultClass(question, index, isSelected) {
  const answer = question.answers[index];
  if (answer?.isCorrect) return 'is-correct';
  if (isSelected) return 'is-wrong';
  return 'is-muted';
}

function toggleQuestionAnswer(index) {
  const state = currentGame?.modeState;
  if (!state || state.answered) return;

  const question = state.questions[state.currentIndex];
  if (!question) return;

  if (isMultiAnswerQuestion(question)) {
    if (state.selectedIndexes.includes(index)) {
      state.selectedIndexes = state.selectedIndexes.filter((selectedIndex) => selectedIndex !== index);
    } else {
      state.selectedIndexes = [...state.selectedIndexes, index];
    }
    saveGameState();
    renderQuestionAnswers(question);
    updateQuizSubmitButton(question);
    return;
  }

  state.selectedIndexes = [index];
  saveGameState();
  renderQuestionAnswers(question);
  updateQuizSubmitButton(question);
  setTimeout(() => submitQuizSelection(), 140);
}

function updateQuizSubmitButton(question) {
  const button = document.getElementById('quiz-submit-btn');
  const state = currentGame?.modeState;
  if (!button || !state) return;

  const isMulti = isMultiAnswerQuestion(question);
  const showButton = isMulti && !state.answered;

  button.classList.toggle('hidden', !showButton);
  button.disabled = !showButton || state.selectedIndexes.length === 0;
  button.textContent = 'Antwort pruefen';
}

function startQuizTimer(seconds) {
  timeLeft = seconds;
  updateQuizTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateQuizTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuizSelection(true);
    }
  }, 1000);
}

function updateQuizTimerDisplay() {
  const display = document.getElementById('quiz-timer-display');
  const ring = document.getElementById('quiz-timer-ring');
  if (display) {
    display.textContent = String(Math.max(timeLeft, 0));
    display.classList.toggle('urgent', timeLeft <= 5);
  }

  if (ring) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (Math.max(timeLeft, 0) / Math.max(currentTotalTime, 1)) * circumference;
    ring.style.strokeDashoffset = offset;
  }
}

function submitQuizSelection(timedOut = false) {
  const state = currentGame?.modeState;
  if (!state || state.answered) return;
  if (!timedOut && state.selectedIndexes.length === 0) return;

  const question = state.questions[state.currentIndex];
  if (!question) return;

  clearInterval(timerInterval);

  const correctIndexes = question.answers
    .map((answer, index) => (answer.isCorrect ? index : -1))
    .filter((index) => index >= 0);
  const selectedIndexes = [...state.selectedIndexes].sort((a, b) => a - b);
  const isCorrect = selectedIndexes.length > 0
    && selectedIndexes.length === correctIndexes.length
    && selectedIndexes.every((index) => correctIndexes.includes(index));

  state.answered = true;
  state.results.push({
    questionId: question.id,
    selectedIndexes,
    correctIndexes,
    isCorrect,
    timedOut
  });

  if (isCorrect) correctAnswers += 1;
  saveGameState();

  renderQuestionAnswers(question);
  setText('quiz-correct-count', String(correctAnswers));
  showQuizFeedback(question, isCorrect, timedOut);
  updateQuizSubmitButton(question);

  const isLast = state.currentIndex >= state.questions.length - 1;
  autoAdvanceTimeout = setTimeout(() => {
    if (isLast) {
      finishExperience();
      return;
    }

    state.currentIndex += 1;
    state.selectedIndexes = [];
    state.answered = false;
    saveGameState();
    renderQuestionStage();
  }, isCorrect ? 1350 : 1800);
}

function showQuizFeedback(question, isCorrect, timedOut) {
  const feedback = document.getElementById('quiz-feedback');
  if (!feedback) return;

  feedback.classList.remove('hidden', 'is-correct', 'is-wrong');
  feedback.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

  if (timedOut) {
    feedback.textContent = 'Zeit abgelaufen. Die richtigen Antworten leuchten jetzt auf.';
    return;
  }

  if (isCorrect) {
    feedback.textContent = isMultiAnswerQuestion(question)
      ? 'Stark. Alle passenden Antworten sitzen.'
      : 'Richtig. Weiter geht es direkt.';
    return;
  }

  feedback.textContent = isMultiAnswerQuestion(question)
    ? 'Noch nicht ganz. Die richtigen Antworten sind markiert.'
    : 'Nicht ganz. Die richtige Antwort ist markiert.';
}

/* ---------- Memory ---------- */
function getMemoryPairs(quiz) {
  if (!quiz?.questions) return [];

  const icons = ['⚕️', '📘', '🤝', '✦', '🚀', '🌍'];
  const categories = ['Gesundheit', 'Bildung', 'Verantwortung', 'Werte', 'Zukunft', 'Wirkung'];

  return quiz.questions.slice(0, 6).map((question, index) => ({
    id: `pair-${index + 1}`,
    questionText: getFieldText(question, ['prompt', 'text', 'title']) || `Karte ${index + 1}`,
    answerText: getFieldText(question, ['match']) || getCorrectText(question) || 'Aussage',
    icon: icons[index % icons.length],
    category: getFieldText(question, ['category']) || categories[index % categories.length]
  }));
}

function buildMemoryDeck(pairs) {
  const deck = [];
  pairs.forEach((pair, index) => {
    deck.push({
      id: `card-${index + 1}-q`,
      pairId: pair.id,
      type: 'question',
      content: pair.questionText,
      icon: pair.icon,
      category: pair.category,
      color: '#ff6a1a'
    });
    deck.push({
      id: `card-${index + 1}-a`,
      pairId: pair.id,
      type: 'answer',
      content: pair.answerText,
      icon: pair.icon,
      category: pair.category,
      color: '#4db5d8'
    });
  });

  return shuffleItems(deck);
}

function startMemoryRun() {
  const pairs = getMemoryPairs(quizData);
  if (!pairs.length) {
    toast('Dieses Memory hat noch keine spielbaren Paare.', 'error');
    return;
  }

  currentRunMode = 'memory';
  currentTotalTime = MEMORY_BASE_TIME + (pairs.length * MEMORY_TIME_PER_PAIR);
  correctAnswers = 0;

  currentGame.mode = 'memory';
  currentGame.status = 'active';
  currentGame.modeState = {
    deck: buildMemoryDeck(pairs),
    flipped: [],
    matched: [],
    moves: 0,
    locked: false,
    totalPairs: pairs.length
  };

  saveGameState();
  setText('play-mode-chip', 'Memory');
  showScreen('screen-memory');
  renderMemoryGrid();
  startMemoryTimer(currentTotalTime);
}

function renderMemoryGrid() {
  const grid = document.getElementById('memory-grid');
  const state = currentGame?.modeState;
  if (!grid || !state) return;

  grid.innerHTML = state.deck.map((card) => {
    const isFlipped = state.flipped.includes(card.id) || state.matched.includes(card.pairId);
    const isMatched = state.matched.includes(card.pairId);

    return `
      <div class="memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}"
           data-id="${card.id}"
           onclick="flipMemoryCard('${card.id}')">
        <div class="memory-card-inner">
          <div class="memory-card-back">
            <div class="memory-card-back-brand">SRH</div>
          </div>

          <div class="memory-card-front">
            <div class="memory-card-corner top-left">
              <span>${card.icon}</span>
            </div>

            <div class="memory-card-content">
              <div class="memory-card-icon">${card.type === 'question' ? '❓' : '✓'}</div>
              <div class="memory-card-text">${esc(card.content)}</div>
              <div class="memory-card-category">${esc(card.category)}</div>
            </div>

            <div class="memory-card-corner bottom-right">
              <span>${card.icon}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateMemoryStats();
}

function flipMemoryCard(cardId) {
  const state = currentGame?.modeState;
  if (!state || state.locked) return;

  const card = state.deck.find((entry) => entry.id === cardId);
  if (!card) return;
  if (state.flipped.includes(cardId) || state.matched.includes(card.pairId)) return;

  const cardElement = document.querySelector(`[data-id="${cardId}"]`);
  if (cardElement) {
    cardElement.classList.add('flipping');
    setTimeout(() => cardElement.classList.remove('flipping'), 600);
  }

  SoundFX?.memoryFlip?.();
  state.flipped.push(cardId);
  renderMemoryGrid();

  if (state.flipped.length === 2) {
    state.moves += 1;
    state.locked = true;
    saveGameState();
    updateMemoryStats();
    checkForMatch();
  }
}

function checkForMatch() {
  const state = currentGame?.modeState;
  if (!state) return;

  const [firstId, secondId] = state.flipped;
  const firstCard = state.deck.find((entry) => entry.id === firstId);
  const secondCard = state.deck.find((entry) => entry.id === secondId);
  const isMatch = firstCard?.pairId && firstCard.pairId === secondCard?.pairId;

  if (isMatch) handleMatch(firstCard);
  else handleMismatch();
}

function handleMatch(card) {
  const state = currentGame?.modeState;
  if (!state || !card) return;

  setTimeout(() => {
    state.matched.push(card.pairId);
    state.flipped = [];
    state.locked = false;
    correctAnswers += 1;
    saveGameState();

    showFeedback(true);
    SoundFX?.match?.();

    const cardElement = document.querySelector(`[data-id="${card.id}"]`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, card.color);
    }

    renderMemoryGrid();

    if (state.matched.length === state.totalPairs) {
      clearInterval(timerInterval);
      setTimeout(finishExperience, 1200);
    }
  }, 500);
}

function handleMismatch() {
  const state = currentGame?.modeState;
  if (!state) return;

  setTimeout(() => {
    showFeedback(false);
    state.flipped.forEach((id) => {
      const element = document.querySelector(`[data-id="${id}"]`);
      if (element) element.classList.add('shake-error');
    });

    SoundFX?.error?.();

    setTimeout(() => {
      state.flipped = [];
      state.locked = false;
      saveGameState();
      renderMemoryGrid();
    }, 800);
  }, 900);
}

function showFeedback(success) {
  const overlay = document.getElementById('memory-feedback');
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');
  if (!overlay || !icon || !text) return;

  icon.textContent = success ? '✨' : '✕';
  text.textContent = success ? 'Match!' : 'Weiter';
  text.style.color = success ? 'var(--green)' : 'var(--red)';

  overlay.classList.remove('hidden');
  void overlay.offsetWidth;
  overlay.classList.add('show');

  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }, 900);
}

function startMemoryTimer(seconds) {
  timeLeft = seconds;
  updateMemoryTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateMemoryTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishExperience();
    }
  }, 1000);
}

function updateMemoryTimerDisplay() {
  const display = document.getElementById('memory-timer-display');
  const ring = document.getElementById('memory-timer-ring');
  if (display) {
    display.textContent = String(Math.max(timeLeft, 0));
    display.classList.toggle('urgent', timeLeft <= 5);
  }

  if (ring) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (Math.max(timeLeft, 0) / Math.max(currentTotalTime, 1)) * circumference;
    ring.style.strokeDashoffset = offset;
  }
}

function updateMemoryStats() {
  const state = currentGame?.modeState;
  setText('memory-matches-count', String(state?.matched?.length || 0));
  setText('memory-moves-stat', String(state?.moves || 0));
}

/* ---------- Wheel ---------- */
function buildWheelSegments(quiz) {
  if (!quiz?.questions) return [];

  const categories = ['Werte', 'Bildung', 'Gesundheit', 'Innovation', 'Verantwortung', 'Zukunft'];
  return quiz.questions.slice(0, 6).map((question, index) => ({
    id: `segment-${index + 1}`,
    label: getFieldText(question, ['title', 'text', 'prompt']) || `Impuls ${index + 1}`,
    category: getFieldText(question, ['category']) || categories[index % categories.length],
    note: getFieldText(question, ['detail', 'note']) || getCorrectText(question),
    weight: 1
  }));
}

function startWheelRun() {
  const segments = buildWheelSegments(quizData);
  if (!segments.length) {
    toast('Dieses Gluecksrad benoetigt mindestens ein Segment.', 'error');
    return;
  }

  currentRunMode = 'wheel';
  currentWheel = null;
  currentGame.mode = 'wheel';
  currentGame.status = 'active';
  currentGame.modeState = {
    segments,
    spins: 0,
    drawnIds: [],
    lastWinnerId: null,
    focusVisible: false,
    locked: false
  };

  saveGameState();
  setText('play-mode-chip', 'Gluecksrad');
  showScreen('screen-wheel');

  document.querySelector('#screen-wheel .wheel-canvas-shell')?.classList.remove('is-spinning', 'is-highlighted');
  document.querySelector('#screen-wheel .wheel-result-card')?.classList.remove('is-highlighted');

  requestAnimationFrame(() => {
    syncWheelInstance();
    renderWheelScreen();
  });
}

function createWheelInstance(segments) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas || typeof LuckyWheel !== 'function') return null;

  const wheel = new LuckyWheel(canvas, segments);
  wheel.onWinner = handleWheelWinner;
  return wheel;
}

function getWheelRemainingSegments() {
  const state = currentGame?.modeState;
  if (!state?.segments) return [];
  return state.segments.filter((segment) => !state.drawnIds.includes(segment.id));
}

function getRenderableWheelSegments() {
  const state = currentGame?.modeState;
  if (!state?.segments?.length) return [];

  const remaining = getWheelRemainingSegments();
  if (remaining.length) return remaining;

  if (state.lastWinnerId) {
    const lastWinner = state.segments.find((segment) => segment.id === state.lastWinnerId);
    if (lastWinner) return [lastWinner];
  }

  return state.segments;
}

function syncWheelInstance() {
  currentWheel = createWheelInstance(getRenderableWheelSegments());
  return currentWheel;
}

function renderWheelScreen() {
  const state = currentGame?.modeState;
  if (!state) return;

  const lastWinner = state.segments.find((segment) => segment.id === state.lastWinnerId);
  setText('wheel-segment-count', String(state.segments.length));
  setText('wheel-spin-count', String(state.spins));
  setText('wheel-result-badge', lastWinner ? 'Gezogen' : 'Bereit');
  setText('wheel-result-title', lastWinner ? lastWinner.label : 'SRH Holding Impuls');
  setText(
    'wheel-result-note',
    lastWinner
      ? lastWinner.note || 'Ein Impuls der SRH Holding wurde sichtbar gemacht.'
      : 'Drehe das Rad und bringe ein Thema der SRH Holding in den Fokus.'
  );

  const list = document.getElementById('wheel-segment-list');
  if (list) {
    list.innerHTML = state.segments.map((segment) => `
      <div class="wheel-segment-item ${state.drawnIds.includes(segment.id) ? 'is-drawn' : ''} ${state.lastWinnerId === segment.id ? 'is-active' : ''}">
        <strong>${esc(segment.label)}</strong>
        <p>${esc(segment.note || '')}</p>
      </div>
    `).join('');
  }

  const spinButton = document.getElementById('btn-spin-wheel');
  const finishButton = document.getElementById('btn-finish-wheel');
  const remaining = getWheelRemainingSegments();
  if (spinButton) {
    spinButton.disabled = state.locked || !remaining.length;
    spinButton.textContent = remaining.length
      ? state.spins > 0 ? 'Nochmal drehen' : 'Rad drehen'
      : 'Alle Impulse gezeigt';
  }
  if (finishButton) {
    finishButton.classList.toggle('hidden', state.spins === 0);
  }

  renderWheelFocus(lastWinner, Boolean(state.focusVisible));
}

function renderWheelFocus(winner, visible) {
  const overlay = document.getElementById('wheel-focus-overlay');
  if (!overlay) return;

  if (!winner || !visible) {
    overlay.classList.remove('is-visible');
    overlay.classList.add('hidden');
    overlay.style.removeProperty('--wheel-focus-color');
    return;
  }

  overlay.style.setProperty('--wheel-focus-color', winner.color || '#ff6a1a');
  setText('wheel-focus-kicker', winner.category || 'Gezogener Bereich');
  setText('wheel-focus-title', winner.label || 'SRH Holding Impuls');
  setText('wheel-focus-note', winner.note || 'Der gezogene Impuls wird hier gross und lesbar eingeblendet.');

  overlay.classList.remove('hidden');
  if (!overlay.classList.contains('is-visible')) {
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  }
}

function flashWheelStage() {
  const shell = document.querySelector('#screen-wheel .wheel-canvas-shell');
  const card = document.querySelector('#screen-wheel .wheel-result-card');
  [shell, card].forEach((element) => {
    if (!element) return;
    element.classList.remove('is-highlighted');
    void element.offsetWidth;
    element.classList.add('is-highlighted');
    setTimeout(() => element.classList.remove('is-highlighted'), 950);
  });
}

function spinWheel() {
  const state = currentGame?.modeState;
  if (!state || state.locked) return;

  const remaining = getWheelRemainingSegments();
  if (!remaining.length) {
    finishExperience();
    return;
  }

  if (!currentWheel) syncWheelInstance();
  if (!currentWheel) {
    toast('Das Gluecksrad konnte nicht initialisiert werden.', 'error');
    return;
  }

  state.locked = true;
  state.focusVisible = false;
  saveGameState();
  renderWheelScreen();

  document.querySelector('#screen-wheel .wheel-canvas-shell')?.classList.add('is-spinning');

  const target = remaining[Math.floor(Math.random() * remaining.length)];
  SoundFX?.memoryFlip?.();
  currentWheel.spin(target.id);
}

function handleWheelWinner(winner) {
  const state = currentGame?.modeState;
  if (!state || !winner) return;

  state.spins += 1;
  state.locked = false;
  state.lastWinnerId = winner.id;
  state.focusVisible = true;
  if (!state.drawnIds.includes(winner.id)) state.drawnIds.push(winner.id);
  saveGameState();

  document.querySelector('#screen-wheel .wheel-canvas-shell')?.classList.remove('is-spinning');
  syncWheelInstance();
  renderWheelScreen();
  flashWheelStage();
  celebrate({ y: 0.42 });
}

/* ---------- Mystery ---------- */
function buildMysteryBoxes(quiz) {
  if (!quiz?.questions) return [];

  const accents = ['#ff6a1a', '#4db5d8', '#3ad37e', '#ffbc5e', '#84d9ef', '#ff8f6b'];
  return quiz.questions.slice(0, 6).map((question, index) => ({
    id: `box-${index + 1}`,
    title: getFieldText(question, ['title', 'text', 'prompt']) || `Insight ${index + 1}`,
    teaser: getFieldText(question, ['teaser']) || 'Tippen zum Oeffnen',
    reveal: getFieldText(question, ['reveal']) || getCorrectText(question),
    tone: accents[index % accents.length]
  }));
}

function startMysteryRun() {
  const boxes = buildMysteryBoxes(quizData);
  if (!boxes.length) {
    toast('Die Mystery Boxen benoetigen mindestens einen Inhalt.', 'error');
    return;
  }

  currentRunMode = 'mystery';
  currentGame.mode = 'mystery';
  currentGame.status = 'active';
  currentGame.modeState = {
    boxes,
    openedIds: []
  };

  saveGameState();
  setText('play-mode-chip', 'Mystery');
  showScreen('screen-mystery');
  renderMysteryScreen();
}

function renderMysteryScreen() {
  const state = currentGame?.modeState;
  const grid = document.getElementById('mystery-grid');
  if (!state || !grid) return;

  setText('mystery-open-count', String(state.openedIds.length));
  setText('mystery-total-count', String(state.boxes.length));

  grid.innerHTML = state.boxes.map((box, index) => {
    const isOpen = state.openedIds.includes(box.id);
    return `
      <button class="mystery-card ${isOpen ? 'is-open' : ''}"
              type="button"
              data-box-id="${box.id}"
              style="--mystery-accent:${box.tone}"
              onclick="openMysteryBox('${box.id}')">
        <span class="feature-index">Box ${index + 1}</span>
        <strong>${esc(box.title)}</strong>
        <p>${esc(isOpen ? box.reveal : box.teaser)}</p>
        <span class="mystery-card-state">${isOpen ? 'Geoeffnet' : 'Reveal starten'}</span>
      </button>
    `;
  }).join('');
}

function openMysteryBox(boxId) {
  const state = currentGame?.modeState;
  if (!state || state.openedIds.includes(boxId)) return;

  state.openedIds.push(boxId);
  saveGameState();
  renderMysteryScreen();
  SoundFX?.match?.();

  const box = state.boxes.find((entry) => entry.id === boxId);
  const element = document.querySelector(`[data-box-id="${boxId}"]`);
  if (element) {
    element.classList.add('is-opening');
    setTimeout(() => element.classList.remove('is-opening'), 760);

    const rect = element.getBoundingClientRect();
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, box?.tone || '#ff6a1a', 16);
  }

  if (state.openedIds.length === state.boxes.length) {
    setTimeout(finishExperience, 900);
  }
}

/* ---------- Finish / Restart ---------- */
function startQuizRun() {
  if (!loadActiveQuiz()) {
    showMissingGame();
    return;
  }

  if (currentRunMode === 'quiz') {
    startQuestionRun();
    return;
  }
  if (currentRunMode === 'memory') {
    startMemoryRun();
    return;
  }
  if (currentRunMode === 'wheel') {
    startWheelRun();
    return;
  }
  if (currentRunMode === 'mystery') {
    startMysteryRun();
    return;
  }

  toast('Dieser Modus ist aktuell nicht verfuegbar.', 'error');
}

function finishExperience() {
  clearInterval(timerInterval);
  clearTimeout(autoAdvanceTimeout);

  const mode = currentGame?.mode || currentRunMode;
  const meta = getModeMeta(mode);
  let title = 'Session beendet.';
  let summary = 'Die Experience kann direkt fuer den naechsten Kontakt neu gestartet werden.';
  let primaryValue = '0';
  let secondaryValue = '0';
  let tertiaryValue = 'Ready';
  let shouldCelebrate = false;
  let result = { mode };

  if (mode === 'quiz') {
    const state = currentGame?.modeState || {};
    const totalQuestions = state.questions?.length || 0;
    const accuracy = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const multiCount = state.questions?.filter((question) => isMultiAnswerQuestion(question)).length || 0;
    title = accuracy >= 80 ? 'Starker Questions-Run.' : accuracy >= 50 ? 'Questions beendet.' : 'Questions abgeschlossen.';
    summary = accuracy >= 80
      ? 'Die wichtigsten SRH Holding Botschaften sitzen. Der Questions-Run ist sofort bereit fuer den naechsten Kontakt.'
      : 'Die Questions-Session ist beendet und kann direkt fuer den naechsten Durchlauf neu gestartet werden.';
    primaryValue = `${correctAnswers}/${totalQuestions}`;
    secondaryValue = `${accuracy} %`;
    tertiaryValue = multiCount ? `${multiCount} Multi` : 'Single';
    shouldCelebrate = accuracy >= 80;
    result = {
      mode,
      correctAnswers,
      totalQuestions,
      accuracy,
      multiCount
    };
  }

  if (mode === 'memory') {
    const totalPairs = currentGame?.modeState?.totalPairs || 0;
    const moves = currentGame?.modeState?.moves || 0;
    const isComplete = totalPairs > 0 && correctAnswers === totalPairs;
    title = isComplete ? 'Starker Match-Run.' : 'Memory beendet.';
    summary = isComplete
      ? 'Alle Paare wurden gefunden. Die SRH Experience ist sofort bereit fuer den naechsten Gast.'
      : 'Der Countdown ist abgelaufen. Das Memory kann direkt neu gestartet werden.';
    primaryValue = `${correctAnswers}/${totalPairs}`;
    secondaryValue = String(moves);
    tertiaryValue = isComplete ? 'Complete' : 'Timeout';
    shouldCelebrate = isComplete;
    result = { mode, correctAnswers, totalQuestions: totalPairs, moves };
  }

  if (mode === 'wheel') {
    const state = currentGame?.modeState || {};
    const lastWinner = state.segments?.find((segment) => segment.id === state.lastWinnerId);
    title = state.spins > 0 ? 'Impulse ausgespielt.' : 'Gluecksrad beendet.';
    summary = lastWinner
      ? `Der letzte gezogene Impuls war ${lastWinner.label}. Die Experience kann direkt neu inszeniert werden.`
      : 'Das Themenrad ist bereit fuer die naechste Aktivierung.';
    primaryValue = String(state.spins || 0);
    secondaryValue = `${state.drawnIds?.length || 0}/${state.segments?.length || 0}`;
    tertiaryValue = lastWinner?.label || 'Bereit';
    shouldCelebrate = (state.spins || 0) > 0;
    result = {
      mode,
      spins: state.spins || 0,
      shownSegments: state.drawnIds?.length || 0,
      totalSegments: state.segments?.length || 0,
      lastWinnerLabel: lastWinner?.label || ''
    };
  }

  if (mode === 'mystery') {
    const state = currentGame?.modeState || {};
    const opened = state.openedIds?.length || 0;
    const total = state.boxes?.length || 0;
    const isComplete = total > 0 && opened === total;
    title = isComplete ? 'Alle Boxen geoeffnet.' : 'Mystery beendet.';
    summary = isComplete
      ? 'Alle SRH Insights wurden freigelegt. Die Experience kann direkt fuer den naechsten Reveal neu starten.'
      : 'Die Reveal-Session ist beendet und kann direkt neu gestartet werden.';
    primaryValue = String(opened);
    secondaryValue = String(total);
    tertiaryValue = isComplete ? 'Complete' : 'Ready';
    shouldCelebrate = isComplete;
    result = { mode, openedBoxes: opened, totalBoxes: total };
  }

  currentGame.status = 'finished';
  currentGame.lastResult = result;
  saveGameState();

  setText('finish-title', title);
  setText('finish-summary', summary);
  setText('finish-pairs', primaryValue);
  setText('finish-moves', secondaryValue);
  setText('finish-state', tertiaryValue);
  setText('finish-primary-label', meta.finishPrimaryLabel);
  setText('finish-secondary-label', meta.finishSecondaryLabel);
  setText('finish-tertiary-label', meta.finishTertiaryLabel);

  if (shouldCelebrate) celebrate({ y: 0.5 });
  showScreen('screen-finish');
}

function saveGameState() {
  if (!currentGame) return;
  GameStore.set(currentGame.code, currentGame);
  ActiveGameStore.set(currentGame.code);
}

function restartExperience() {
  clearInterval(timerInterval);
  clearTimeout(autoAdvanceTimeout);

  if (!loadActiveQuiz()) {
    showMissingGame();
    return;
  }

  correctAnswers = 0;
  currentTotalTime = 0;
  currentWheel = null;
  currentGame.status = 'ready';
  currentGame.modeState = null;
  currentGame.lastResult = null;
  saveGameState();

  renderStartScreen();
  showScreen('screen-start');
}

window.addEventListener('resize', () => {
  if (currentRunMode !== 'wheel') return;
  const wheelScreen = document.getElementById('screen-wheel');
  if (!wheelScreen || wheelScreen.classList.contains('hidden')) return;
  syncWheelInstance();
  renderWheelScreen();
});

/* ---------- Initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  initPlay();
});