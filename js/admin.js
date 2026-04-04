const MAX_ANSWERS = 4;

const MODE_CONTENT = {
  quiz: {
    modeLabel: 'Questions',
    itemLabel: 'Frage',
    promptLabel: 'Frage',
    promptPlaceholder: 'Welche Felder verbindet die SRH Holding?',
    answerPlaceholder: 'Antwortoption',
    answerLabel: 'Kann gleichzeitig richtig sein',
    answerHint: 'Mehrfachauswahl ist moeglich. Markiere alle passenden Antworten.',
    emptyTitle: 'Questions sind bereit.',
    emptyText: 'Lege jetzt die ersten SRH Holding Fragen an. Single- und Multi-Select koennen gemischt genutzt werden.',
    panelTitle: 'Questions und Antworten',
    panelCopy: 'Im Questions-Modus koennen mehrere Antworten gleichzeitig richtig sein. Das eignet sich ideal fuer Holding-Themen mit mehreren Facetten.',
    composerCopy: 'Questions eignen sich fuer starke Holding-Botschaften, Facts und klare Multi-Select-Interaktion auf Event- und Touch-Flaechen.',
    editorBadge: 'Single oder Multi'
  },
  memory: {
    modeLabel: 'Memory',
    itemLabel: 'Paar',
    emptyTitle: 'Memory ist bereit.',
    emptyText: 'Lege jetzt das erste Kartenpaar an. Kurze Begriffe und ein klarer Match-Text funktionieren auf dem Tablet am besten.',
    panelTitle: 'Memory Kartenpaare',
    panelCopy: 'Jedes Memory-Paar besteht aus zwei gleichwertigen Karten und einer optionalen Kategorie fuer die Player View.',
    composerCopy: 'Memory eignet sich fuer Werte, Themen und Kernbotschaften der SRH Holding in Bildung und Gesundheit.',
    editorBadge: 'Zwei Karten',
    primaryLabel: 'Karte A',
    primaryPlaceholder: 'z.B. Bildung',
    secondaryLabel: 'Karte B',
    secondaryPlaceholder: 'z.B. Neue Lebenschancen',
    metaLabel: 'Kategorie optional',
    metaPlaceholder: 'z.B. Gesundheit',
    editorHint: 'In der Player View entstehen daraus zwei gleichwertige Karten. Kurze Inhalte bleiben auf Tablets gut lesbar.'
  },
  wheel: {
    modeLabel: 'Gluecksrad',
    itemLabel: 'Segment',
    emptyTitle: 'Das Rad wartet auf Themen.',
    emptyText: 'Lege jetzt Segmente an, die nach dem Spin als SRH Holding Impulse erscheinen.',
    panelTitle: 'Segmente und Impulse',
    panelCopy: 'Jedes Segment bekommt einen Titel, eine optionale Kategorie und genau einen Impuls fuer den Reveal nach dem Spin.',
    composerCopy: 'Das Gluecksrad ist ideal fuer Live-Inszenierungen, Themenimpulse und auffaellige Moderationsmomente.',
    editorBadge: 'Spin Reveal',
    primaryLabel: 'Segmenttitel',
    primaryPlaceholder: 'z.B. Verantwortung',
    secondaryLabel: 'Impuls nach dem Spin',
    secondaryPlaceholder: 'Kurzer Text, der nach dem Spin als zentrales Statement erscheint.',
    metaLabel: 'Kategorie optional',
    metaPlaceholder: 'z.B. Zukunft',
    editorHint: 'Halte Titel und Reveal kompakt. Das Rad wirkt am besten mit sechs klar lesbaren Segmenten.'
  },
  mystery: {
    modeLabel: 'Mystery',
    itemLabel: 'Box',
    emptyTitle: 'Die Mystery Boxen sind startklar.',
    emptyText: 'Lege Boxen mit kurzem Teaser und klarem Reveal an. Kurze Reveals bleiben auf dem Tablet dynamisch und gut lesbar.',
    panelTitle: 'Boxen und Reveals',
    panelCopy: 'Jede Box bekommt einen Titel, einen kurzen Zustand fuer die geschlossene Ansicht und einen Reveal-Text fuer den Aha-Moment.',
    composerCopy: 'Mystery Boxen schaffen Aha-Momente fuer Insights, Geschichten und Kernaussagen der SRH Holding.',
    editorBadge: 'Reveal Box',
    primaryLabel: 'Boxtitel',
    primaryPlaceholder: 'z.B. Insight 01',
    secondaryLabel: 'Reveal-Text',
    secondaryPlaceholder: 'Kurzer Insight, der nach dem Oeffnen direkt sichtbar wird.',
    metaLabel: 'Text auf der geschlossenen Box',
    metaPlaceholder: 'z.B. Tippen zum Oeffnen',
    editorHint: 'Geschlossene Boxen brauchen nur einen kurzen Teaser. Die eigentliche Aussage steht im Reveal.'
  }
};

let currentQuiz = null;

function getSelectedMode() {
  return document.getElementById('quiz-mode')?.value || 'quiz';
}

function buildAnswerSet(texts = [], correctIndexes = []) {
  const safeTexts = Array.isArray(texts) ? texts : [texts];
  return Array.from({ length: MAX_ANSWERS }, (_, index) => ({
    text: String(safeTexts[index] || ''),
    isCorrect: correctIndexes.includes(index)
  }));
}

function buildQuizQuestion(text, answers, correctIndexes = [0]) {
  return {
    text,
    answers: buildAnswerSet(answers, correctIndexes)
  };
}

function buildMemoryItem(prompt, match, category = '') {
  return {
    prompt,
    match,
    category
  };
}

function buildWheelItem(title, detail, category = '') {
  return {
    title,
    detail,
    category
  };
}

function buildMysteryItem(title, reveal, teaser = 'Tippen zum Oeffnen') {
  return {
    title,
    teaser,
    reveal
  };
}

function createEmptyItem(mode = getSelectedMode()) {
  if (mode === 'quiz') {
    return {
      text: '',
      answers: buildAnswerSet([], [])
    };
  }

  if (mode === 'memory') {
    return {
      prompt: '',
      match: '',
      category: ''
    };
  }

  if (mode === 'wheel') {
    return {
      title: '',
      detail: '',
      category: ''
    };
  }

  return {
    title: '',
    teaser: 'Tippen zum Oeffnen',
    reveal: ''
  };
}

function normalizeAnswers(answers, mode) {
  const sanitized = Array.from({ length: MAX_ANSWERS }, (_, index) => {
    const raw = answers?.[index] || {};
    const text = String(raw.text || '').trim();
    return {
      text,
      isCorrect: Boolean(raw.isCorrect) && text.length > 0
    };
  });

  if (mode !== 'quiz') {
    const firstCorrectIndex = sanitized.findIndex((answer) => answer.isCorrect);
    return sanitized.map((answer, index) => ({
      ...answer,
      isCorrect: firstCorrectIndex >= 0 && index === firstCorrectIndex
    }));
  }

  return sanitized;
}

function getLegacyCorrectText(item) {
  const answers = normalizeAnswers(item?.answers, 'quiz');
  return answers.find((answer) => answer.isCorrect)?.text || answers.find((answer) => answer.text)?.text || '';
}

function normalizeItem(item, mode) {
  if (mode === 'quiz') {
    return {
      text: String(item?.text || item?.prompt || item?.title || '').trim(),
      answers: normalizeAnswers(item?.answers, mode)
    };
  }

  if (mode === 'memory') {
    return {
      prompt: String(item?.prompt || item?.text || item?.title || '').trim(),
      match: String(item?.match || getLegacyCorrectText(item) || item?.detail || item?.reveal || '').trim(),
      category: String(item?.category || '').trim()
    };
  }

  if (mode === 'wheel') {
    return {
      title: String(item?.title || item?.text || item?.prompt || '').trim(),
      detail: String(item?.detail || item?.note || getLegacyCorrectText(item) || item?.match || '').trim(),
      category: String(item?.category || '').trim()
    };
  }

  return {
    title: String(item?.title || item?.text || item?.prompt || '').trim(),
    teaser: String(item?.teaser || '').trim(),
    reveal: String(item?.reveal || getLegacyCorrectText(item) || item?.detail || item?.match || '').trim()
  };
}

const EXAMPLE_SESSIONS = {
  quiz: {
    title: 'SRH Holding Questions',
    mode: 'quiz',
    questions: [
      buildQuizQuestion('Welche Felder verbindet die SRH Holding?', ['Bildung', 'Gesundheit', 'Rohstoffhandel', 'Seefracht'], [0, 1]),
      buildQuizQuestion('Was staerkt eine SRH Experience auf Eventflaechen?', ['Klare Botschaften', 'Touch-taugliche Interaktion', 'Versteckte Navigation', 'Lange Textwuesten'], [0, 1]),
      buildQuizQuestion('Wofuer steht "Aus Leidenschaft fuers Leben" im Auftritt?', ['Wertorientierung', 'Reine Technikwerbung', 'Haltung mit menschlichem Fokus', 'Beliebiger Kampagnenclaim'], [0, 2]),
      buildQuizQuestion('Wohin reinvestiert SRH Gewinne?', ['In starke Angebote und Zukunftsmaerkte', 'Ausschliesslich in Printwerbung', 'Nur in Verwaltung', 'Gar nicht'], [0]),
      buildQuizQuestion('Welche Eigenschaften passen zur SRH Holding Darstellung?', ['Verantwortung', 'Innovationsbereitschaft', 'Beliebigkeit', 'Langfristigkeit'], [0, 1, 3]),
      buildQuizQuestion('Warum funktionieren Questions auf dem Screen gut?', ['Sie machen Themen sofort begreifbar', 'Sie laden zu schneller Interaktion ein', 'Sie brauchen zwingend mehrere Personen', 'Sie eignen sich fuer Single- und Multi-Select'], [0, 1, 3])
    ]
  },
  memory: {
    title: 'SRH Holding Pair Match',
    mode: 'memory',
    questions: [
      buildMemoryItem('Bildung', 'Neue Lebenschancen', 'Holding'),
      buildMemoryItem('Gesundheit', 'Das Wohl des Menschen', 'Versorgung'),
      buildMemoryItem('Verantwortung', 'Gemeinnuetzig und unternehmerisch', 'Werte'),
      buildMemoryItem('Innovation', 'Digitale Loesungen mit Nutzen', 'Zukunft'),
      buildMemoryItem('Partnerschaft', 'Starker Verbund aus Bildung und Gesundheit', 'Netzwerk'),
      buildMemoryItem('SRH', 'Aus Leidenschaft fuers Leben', 'Claim')
    ]
  },
  wheel: {
    title: 'SRH Holding Themenrad',
    mode: 'wheel',
    questions: [
      buildWheelItem('Bildung', 'Angebote, die Menschen neue Lebenschancen eroeffnen.', 'Bildung'),
      buildWheelItem('Gesundheit', 'Das Wohl von Patientinnen und Patienten steht im Mittelpunkt.', 'Gesundheit'),
      buildWheelItem('Verantwortung', 'Gemeinnuetzigkeit und unternehmerisches Handeln greifen ineinander.', 'Werte'),
      buildWheelItem('Werte', 'Aus Leidenschaft fuers Leben ist Haltung und Anspruch zugleich.', 'Claim'),
      buildWheelItem('Innovation', 'Digitale Loesungen entstehen mit echtem Nutzen fuer Menschen.', 'Zukunft'),
      buildWheelItem('Zukunft', 'Gewinne fliessen in starke Angebote und Zukunftsmaerkte zurueck.', 'Wachstum')
    ]
  },
  mystery: {
    title: 'SRH Holding Mystery Boxen',
    mode: 'mystery',
    questions: [
      buildMysteryItem('Insight 01', 'SRH verbindet Bildung und Gesundheit unter einem Dach.', 'Box oeffnen'),
      buildMysteryItem('Insight 02', 'Soziale Verantwortung ist Teil des unternehmerischen Handelns.', 'Mehr entdecken'),
      buildMysteryItem('Insight 03', 'Gewinne werden in die Zukunft von Angeboten und Maerkten reinvestiert.', 'Reveal starten'),
      buildMysteryItem('Insight 04', 'Die SRH gestaltet Lebensqualitaet und Lebenschancen aktiv mit.', 'Tippen zum Oeffnen'),
      buildMysteryItem('Insight 05', 'Klare interaktive Formate machen Holding-Themen sichtbar und merkbar.', 'Insight laden'),
      buildMysteryItem('Insight 06', 'Die SRH ist ein starker Partner fuer Bildung und Gesundheit.', 'Mehr erfahren')
    ]
  }
};

function getModeCopy(mode = currentQuiz?.mode || getSelectedMode()) {
  return MODE_CONTENT[mode] || MODE_CONTENT.quiz;
}

function updateMode() {
  const mode = getSelectedMode();
  if (currentQuiz) {
    currentQuiz.mode = mode;
    currentQuiz.questions = currentQuiz.questions.map((item) => normalizeItem(item, mode));
  }
  updateEditorModeText();
  if (currentQuiz) renderQuestions();
  else updateAdminInsights();
}

function createQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const mode = getSelectedMode();

  if (!title) {
    toast('Bitte zuerst einen Titel vergeben.', 'error');
    return;
  }

  currentQuiz = {
    id: uuidv4(),
    title,
    mode,
    questions: [],
    createdAt: new Date().toISOString()
  };

  document.getElementById('questions-section').style.display = 'block';
  updateEditorModeText();
  renderQuestions();
}

function loadExampleSession(mode) {
  const baseSession = EXAMPLE_SESSIONS[mode] || EXAMPLE_SESSIONS.quiz;
  currentQuiz = JSON.parse(JSON.stringify({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...baseSession
  }));

  currentQuiz.questions = currentQuiz.questions.map((item) => normalizeItem(item, currentQuiz.mode));

  document.getElementById('quiz-title').value = currentQuiz.title;
  document.getElementById('quiz-mode').value = currentQuiz.mode;
  document.getElementById('questions-section').style.display = 'block';
  updateEditorModeText();
  renderQuestions();
  toast(`${getModeCopy(currentQuiz.mode).modeLabel} Beispiel geladen.`, 'success');
}

function renderQuestions() {
  const list = document.getElementById('questions-list');
  const copy = getModeCopy();

  if (!currentQuiz) {
    list.innerHTML = '';
    return;
  }

  if (!currentQuiz.questions.length) {
    list.innerHTML = `
      <div class="questions-empty">
        <div>
          <strong>${copy.emptyTitle}</strong>
          <p>${copy.emptyText}</p>
        </div>
        <button class="btn btn-ghost" type="button" onclick="addQuestion()">+ ${copy.itemLabel} hinzufuegen</button>
      </div>
    `;
    updateAdminInsights();
    return;
  }

  list.innerHTML = currentQuiz.questions
    .map((item, index) => renderEditorCard(item, index, currentQuiz.mode, copy))
    .join('');

  updateAdminInsights();
}

function renderEditorCard(item, index, mode, copy) {
  if (mode === 'quiz') return renderQuizEditor(item, index, copy);
  if (mode === 'memory') return renderMemoryEditor(item, index, copy);
  if (mode === 'wheel') return renderWheelEditor(item, index, copy);
  return renderMysteryEditor(item, index, copy);
}

function renderEditorHeader(index, copy, badgeText) {
  return `
    <div class="question-card-top">
      <div class="question-card-meta">
        <span class="question-card-index">${copy.itemLabel} ${index + 1}</span>
        <span class="status-pill status-soft">${badgeText}</span>
      </div>
      <button class="question-remove" type="button" onclick="removeQuestion(${index})">Entfernen</button>
    </div>
  `;
}

function renderQuizEditor(question, index, copy) {
  return `
    <article class="question-card-editor mode-card-editor mode-quiz-editor">
      ${renderEditorHeader(index, copy, copy.editorBadge)}

      <label class="question-field">
        <span class="field-caption">${copy.promptLabel}</span>
        <input
          type="text"
          value="${esc(question.text)}"
          placeholder="${copy.promptPlaceholder}"
          oninput="updateQuestion(${index}, this.value)"
          class="w-full"
        />
      </label>

      <p class="question-mode-hint">${copy.answerHint}</p>

      <div class="answers-grid">
        ${question.answers.map((answer, answerIndex) => `
          <div class="answer-item ${answer.isCorrect ? 'is-correct' : ''}">
            <span class="answer-slot">${answerIndex + 1}</span>
            <div class="answer-body">
              <input
                type="text"
                value="${esc(answer.text)}"
                placeholder="${copy.answerPlaceholder} ${answerIndex + 1}"
                oninput="updateAnswer(${index}, ${answerIndex}, this.value)"
              />
              <label class="answer-check is-multi">
                <input
                  type="checkbox"
                  ${answer.isCorrect ? 'checked' : ''}
                  onchange="toggleCorrect(${index}, ${answerIndex})"
                />
                <span>${copy.answerLabel}</span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function renderMemoryEditor(item, index, copy) {
  return `
    <article class="question-card-editor mode-card-editor mode-memory-editor">
      ${renderEditorHeader(index, copy, copy.editorBadge)}

      <div class="editor-split-grid">
        <label class="question-field editor-field-emphasis">
          <span class="field-caption">${copy.primaryLabel}</span>
          <input
            type="text"
            value="${esc(item.prompt)}"
            placeholder="${copy.primaryPlaceholder}"
            oninput="updateModuleField(${index}, 'prompt', this.value)"
          />
        </label>

        <label class="question-field editor-field-emphasis">
          <span class="field-caption">${copy.secondaryLabel}</span>
          <input
            type="text"
            value="${esc(item.match)}"
            placeholder="${copy.secondaryPlaceholder}"
            oninput="updateModuleField(${index}, 'match', this.value)"
          />
        </label>
      </div>

      <div class="editor-split-grid editor-split-grid-compact">
        <label class="question-field">
          <span class="field-caption">${copy.metaLabel}</span>
          <input
            type="text"
            value="${esc(item.category)}"
            placeholder="${copy.metaPlaceholder}"
            oninput="updateModuleField(${index}, 'category', this.value)"
          />
        </label>

        <div class="module-note-card">
          <strong>Tablet Hinweis</strong>
          <p>${copy.editorHint}</p>
        </div>
      </div>
    </article>
  `;
}

function renderWheelEditor(item, index, copy) {
  return `
    <article class="question-card-editor mode-card-editor mode-wheel-editor">
      ${renderEditorHeader(index, copy, copy.editorBadge)}

      <div class="editor-split-grid editor-split-grid-compact">
        <label class="question-field">
          <span class="field-caption">${copy.primaryLabel}</span>
          <input
            type="text"
            value="${esc(item.title)}"
            placeholder="${copy.primaryPlaceholder}"
            oninput="updateModuleField(${index}, 'title', this.value)"
          />
        </label>

        <label class="question-field">
          <span class="field-caption">${copy.metaLabel}</span>
          <input
            type="text"
            value="${esc(item.category)}"
            placeholder="${copy.metaPlaceholder}"
            oninput="updateModuleField(${index}, 'category', this.value)"
          />
        </label>
      </div>

      <label class="question-field">
        <span class="field-caption">${copy.secondaryLabel}</span>
        <textarea
          rows="3"
          class="editor-textarea"
          placeholder="${copy.secondaryPlaceholder}"
          oninput="updateModuleField(${index}, 'detail', this.value)"
        >${esc(item.detail)}</textarea>
      </label>

      <p class="question-mode-hint">${copy.editorHint}</p>
    </article>
  `;
}

function renderMysteryEditor(item, index, copy) {
  return `
    <article class="question-card-editor mode-card-editor mode-mystery-editor">
      ${renderEditorHeader(index, copy, copy.editorBadge)}

      <div class="editor-split-grid editor-split-grid-compact">
        <label class="question-field">
          <span class="field-caption">${copy.primaryLabel}</span>
          <input
            type="text"
            value="${esc(item.title)}"
            placeholder="${copy.primaryPlaceholder}"
            oninput="updateModuleField(${index}, 'title', this.value)"
          />
        </label>

        <label class="question-field">
          <span class="field-caption">${copy.metaLabel}</span>
          <input
            type="text"
            value="${esc(item.teaser)}"
            placeholder="${copy.metaPlaceholder}"
            oninput="updateModuleField(${index}, 'teaser', this.value)"
          />
        </label>
      </div>

      <label class="question-field">
        <span class="field-caption">${copy.secondaryLabel}</span>
        <textarea
          rows="3"
          class="editor-textarea"
          placeholder="${copy.secondaryPlaceholder}"
          oninput="updateModuleField(${index}, 'reveal', this.value)"
        >${esc(item.reveal)}</textarea>
      </label>

      <p class="question-mode-hint">${copy.editorHint}</p>
    </article>
  `;
}

function addQuestion() {
  if (!currentQuiz) {
    toast('Erstelle zuerst eine Experience oder lade ein Beispiel.', 'info');
    return;
  }

  currentQuiz.questions.push(createEmptyItem(currentQuiz.mode));
  renderQuestions();
}

function removeQuestion(index) {
  if (!currentQuiz) return;
  currentQuiz.questions.splice(index, 1);
  renderQuestions();
}

function updateQuestion(index, value) {
  updateModuleField(index, 'text', value);
}

function updateModuleField(index, field, value) {
  if (!currentQuiz?.questions?.[index]) return;
  currentQuiz.questions[index][field] = value;
}

function updateAnswer(questionIndex, answerIndex, value) {
  if (!currentQuiz || currentQuiz.mode !== 'quiz') return;
  currentQuiz.questions[questionIndex].answers[answerIndex].text = value;
}

function toggleCorrect(questionIndex, answerIndex) {
  if (!currentQuiz || currentQuiz.mode !== 'quiz') return;

  currentQuiz.questions[questionIndex].answers[answerIndex].isCorrect = !currentQuiz.questions[questionIndex].answers[answerIndex].isCorrect;
  renderQuestions();
}

function validateItem(item, index, mode, copy) {
  const itemNumber = index + 1;

  if (mode === 'quiz') {
    const filledAnswers = item.answers.filter((answer) => answer.text.trim());
    const correctAnswers = item.answers.filter((answer) => answer.isCorrect && answer.text.trim());

    if (!item.text.trim()) {
      return `${copy.itemLabel} ${itemNumber} benoetigt einen Titel.`;
    }
    if (filledAnswers.length < 2) {
      return `${copy.itemLabel} ${itemNumber} benoetigt mindestens zwei Antwortoptionen.`;
    }
    if (!correctAnswers.length) {
      return `${copy.itemLabel} ${itemNumber} benoetigt mindestens eine richtige Antwort.`;
    }
    return '';
  }

  if (mode === 'memory') {
    if (!item.prompt.trim() || !item.match.trim()) {
      return `${copy.itemLabel} ${itemNumber} benoetigt zwei Karteninhalte.`;
    }
    return '';
  }

  if (mode === 'wheel') {
    if (!item.title.trim()) {
      return `${copy.itemLabel} ${itemNumber} benoetigt einen Segmenttitel.`;
    }
    if (!item.detail.trim()) {
      return `${copy.itemLabel} ${itemNumber} benoetigt einen Impuls fuer den Spin.`;
    }
    return '';
  }

  if (!item.title.trim()) {
    return `${copy.itemLabel} ${itemNumber} benoetigt einen Boxtitel.`;
  }
  if (!item.reveal.trim()) {
    return `${copy.itemLabel} ${itemNumber} benoetigt einen Reveal-Text.`;
  }
  return '';
}

function saveQuiz() {
  if (!currentQuiz) {
    toast('Es gibt noch keine Experience zum Speichern.', 'error');
    return;
  }

  currentQuiz.title = document.getElementById('quiz-title').value.trim();
  currentQuiz.mode = getSelectedMode();
  currentQuiz.questions = currentQuiz.questions.map((item) => normalizeItem(item, currentQuiz.mode));

  const copy = getModeCopy(currentQuiz.mode);

  if (!currentQuiz.title) {
    toast('Bitte einen Titel eintragen.', 'error');
    return;
  }

  if (!currentQuiz.questions.length) {
    toast('Mindestens ein Modul ist erforderlich.', 'error');
    return;
  }

  for (let index = 0; index < currentQuiz.questions.length; index++) {
    const errorMessage = validateItem(currentQuiz.questions[index], index, currentQuiz.mode, copy);
    if (errorMessage) {
      toast(errorMessage, 'error');
      return;
    }
  }

  QuizStore.upsert(currentQuiz);

  const game = {
    code: 'GAME-' + Math.floor(Math.random() * 9999),
    quizId: currentQuiz.id,
    mode: currentQuiz.mode,
    status: 'ready',
    lastResult: null
  };

  GameStore.set(game.code, game);
  ActiveGameStore.set(game.code);

  updateAdminInsights(true);
  toast('Experience gespeichert. Player View wird geoeffnet ...', 'success');
  setTimeout(() => {
    location.href = 'play.html';
  }, 420);
}

function updateEditorModeText() {
  const copy = getModeCopy();
  const titleEl = document.getElementById('questions-panel-title');
  const copyEl = document.getElementById('questions-panel-copy');
  const addButton = document.getElementById('questions-add-btn');
  const composerCopy = document.getElementById('admin-composer-copy');

  if (titleEl) titleEl.textContent = copy.panelTitle;
  if (copyEl) copyEl.textContent = copy.panelCopy;
  if (addButton) addButton.textContent = `+ ${copy.itemLabel} hinzufuegen`;
  if (composerCopy) composerCopy.textContent = copy.composerCopy;

  updateAdminInsights();
}

function updateAdminInsights(isReady = false) {
  const mode = getSelectedMode();
  const questionCount = currentQuiz?.questions?.length || 0;
  const state = isReady
    ? 'Ready'
    : currentQuiz
      ? questionCount > 0 ? 'Build' : 'Setup'
      : 'Draft';

  const modeEl = document.getElementById('admin-status-mode');
  const countEl = document.getElementById('admin-status-count');
  const stateEl = document.getElementById('admin-status-state');

  if (modeEl) modeEl.textContent = getModeCopy(mode).modeLabel;
  if (countEl) countEl.textContent = String(questionCount);
  if (stateEl) stateEl.textContent = state;
}

document.addEventListener('DOMContentLoaded', () => {
  initStars('stars');
  updateEditorModeText();
});