/**
 * play.js – Single-user Messemodus
 */

let currentGame = null;
let quizData = null;
let score = 0;
let answered = false;
let timerInterval = null;
let timeLeft = 0;
let currentQIdx = -1;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function loadActiveQuiz() {
  const activeCode = ActiveGameStore.get();
  currentGame = activeCode ? GameStore.get(activeCode) : null;
  quizData = currentGame ? QuizStore.get(currentGame.quizId) : null;
  return !!(currentGame && quizData);
}

function initPlay() {
  if (!loadActiveQuiz()) {
    showMissingGame();
    return;
  }

  score = currentGame.currentPlayer?.score || 0;
  showScreen('screen-start');
  document.getElementById('start-title').textContent = quizData.title;
  document.getElementById('start-description').textContent = quizData.description || 'Bereit für ein kurzes SRH Messe-Quiz.';
  document.getElementById('start-question-count').textContent = `${quizData.questions.length} Fragen`;
}

function showMissingGame() {
  showScreen('screen-start');
  document.getElementById('start-title').textContent = 'Noch kein Quiz vorbereitet';
  document.getElementById('start-description').textContent = 'Bitte zuerst in der Admin-Ansicht ein SRH Messe-Quiz vorbereiten.';
  document.getElementById('start-question-count').textContent = 'Admin öffnen';
  document.getElementById('btn-start-quiz').setAttribute('disabled', 'disabled');
}

function saveGameState() {
  if (!currentGame) return;
  GameStore.set(currentGame.code, currentGame);
  ActiveGameStore.set(currentGame.code);
}

function startQuizRun() {
  if (!loadActiveQuiz()) {
    toast('Bitte zuerst ein Quiz vorbereiten.', 'error');
    return;
  }

  document.getElementById('btn-start-quiz')?.removeAttribute('disabled');
  currentGame.status = 'active';
  currentGame.currentQuestion = 0;
  currentGame.currentPlayer = { name: 'Messegast', score: 0 };
  currentGame.answers = {};
  currentGame.finishedAt = null;
  currentGame.lastResult = null;
  score = 0;
  saveGameState();
  showQuestion(quizData.questions[0], 0, quizData.questions.length);
}

function showQuestion(question, qi, total) {
  showScreen('screen-question');
  currentQIdx = qi;
  answered = false;
  clearInterval(timerInterval);
  document.getElementById('q-feedback').classList.add('hidden');
  document.getElementById('btn-next-step').classList.add('hidden');

  document.getElementById('q-progress').textContent = `${qi + 1} / ${total}`;
  document.getElementById('q-progress-fill').style.width = `${((qi + 1) / total) * 100}%`;
  document.getElementById('q-score').textContent = score;
  document.getElementById('q-text').textContent = question.text;

  const grid = document.getElementById('q-answers');
  grid.innerHTML = question.answers.map((answer, index) => `
    <button class="answer-option" id="ans-${answer.id}" onclick="submitAnswer('${answer.id}')">
      <span class="answer-letter">${LETTERS[index]}</span>
      <span>${esc(answer.text)}</span>
    </button>`).join('');

  timeLeft = question.timeLimit || 30;
  startTimer(timeLeft, question.timeLimit || 30);
}

function startTimer(seconds, total) {
  updateTimerUI(seconds, total);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI(timeLeft, total);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!answered) {
        finishQuestion(null);
      }
    }
  }, 1000);
}

function updateTimerUI(t, total) {
  const el = document.getElementById('timer-text');
  const arc = document.getElementById('timer-arc');
  if (el) el.textContent = String(Math.max(t, 0));
  if (arc) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    arc.style.strokeDasharray = circ;
    arc.style.strokeDashoffset = circ * (1 - Math.max(t, 0) / total);
    arc.style.stroke = t <= 5 ? 'var(--red)' : t <= 10 ? 'var(--accent)' : 'var(--primary-light)';
  }
  if (el) el.style.color = t <= 5 ? 'var(--red)' : 'var(--text)';
}

function submitAnswer(answerId) {
  if (answered) return;
  finishQuestion(answerId);
}

function finishQuestion(answerId) {
  answered = true;
  clearInterval(timerInterval);
  disableAnswers();

  const question = quizData.questions[currentQIdx];
  const correctIds = question.answers.filter(answer => answer.isCorrect).map(answer => answer.id);

  currentGame.answers[currentQIdx] = {
    answerId,
    timeLeft: Math.max(timeLeft, 0)
  };

  if (answerId) {
    document.getElementById(`ans-${answerId}`)?.classList.add('selected');
  }

  if (answerId && correctIds.includes(answerId)) {
    const gained = 100 + Math.max(0, Math.round(Math.max(timeLeft, 0) * 10));
    score += gained;
    currentGame.currentPlayer.score = score;
    showScorePopup('+' + gained);
  }

  revealAnswers(correctIds);
  saveGameState();
  showQuestionFeedback(correctIds.includes(answerId));
}

function showQuestionFeedback(isCorrect) {
  const feedback = document.getElementById('q-feedback');
  const btn = document.getElementById('btn-next-step');
  const isLast = currentQIdx >= quizData.questions.length - 1;

  feedback.textContent = isCorrect
    ? 'Richtig! Sehr gut gemacht.'
    : 'Auflösung angezeigt – weiter zur nächsten Frage.';
  feedback.classList.remove('hidden');

  btn.textContent = isLast ? '🏁 Ergebnis anzeigen' : '▶ Weiter';
  btn.onclick = isLast ? finishQuiz : goToNextQuestion;
  btn.classList.remove('hidden');
  document.getElementById('q-score').textContent = score;
}

function disableAnswers() {
  document.querySelectorAll('.answer-option').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.85';
  });
}

function revealAnswers(correctIds) {
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

function goToNextQuestion() {
  const nextIndex = currentQIdx + 1;
  currentGame.currentQuestion = nextIndex;
  saveGameState();
  showQuestion(quizData.questions[nextIndex], nextIndex, quizData.questions.length);
}

function finishQuiz() {
  currentGame.status = 'finished';
  currentGame.finishedAt = new Date().toISOString();
  currentGame.lastResult = {
    name: currentGame.currentPlayer?.name || 'Messegast',
    score
  };
  saveGameState();
  showFinal();
}

function showFinal() {
  showScreen('screen-final');
  const maxScore = quizData.questions.reduce((sum, question) => sum + 100 + ((question.timeLimit || 30) * 10), 0);
  const ratio = maxScore ? score / maxScore : 0;
  const icon = ratio >= 0.75 ? '🏆' : ratio >= 0.45 ? '👏' : '✨';
  const message = ratio >= 0.75
    ? 'Starker Messe-Run!'
    : ratio >= 0.45
      ? 'Gut gemacht!'
      : 'Danke fürs Mitmachen!';

  document.getElementById('final-icon').textContent = icon;
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-rank').textContent = message;
  document.getElementById('final-lb').innerHTML = `
    <div class="lb-row">
      <span class="lb-rank">📚</span>
      <span class="lb-name">${esc(quizData.title)}</span>
      <span class="lb-score">${quizData.questions.length} Fragen</span>
    </div>
    <div class="lb-row">
      <span class="lb-rank">⭐</span>
      <span class="lb-name">Dein Ergebnis</span>
      <span class="lb-score">${score} Pkt</span>
    </div>`;

  celebrate();
}

function restartQuiz() {
  document.getElementById('btn-start-quiz')?.removeAttribute('disabled');
  if (!loadActiveQuiz()) {
    showMissingGame();
    return;
  }

  currentGame.status = 'ready';
  currentGame.currentQuestion = -1;
  currentGame.currentPlayer = { name: 'Messegast', score: 0 };
  currentGame.answers = {};
  currentGame.finishedAt = null;
  currentGame.lastResult = null;
  score = 0;
  saveGameState();
  initPlay();
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
  if (!document.getElementById('score-pop-style')) {
    const style = document.createElement('style');
    style.id = 'score-pop-style';
    style.textContent = '@keyframes scorePopAnim { 0%{opacity:1;transform:translateX(-50%) scale(1)} 100%{opacity:0;transform:translateX(-50%) scale(1.5) translateY(-60px)} }';
    document.head.appendChild(style);
  }
  setTimeout(() => el.remove(), 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  initPlay();
});
