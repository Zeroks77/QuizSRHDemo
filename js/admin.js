const MAX_ANSWERS = 4;
const EXPORT_SCHEMA_VERSION = 1;

const MODE_CONTENT = {
  quiz: {
    modeLabel: 'Questions',
    itemLabel: 'Frage',
    promptLabel: 'Frage',
    promptPlaceholder: 'Welche Felder verbindet die SRH Holding?',
    answerPlaceholder: 'Antwortoption',
    answerLabel: 'Kann gleichzeitig richtig sein',
    answerHint: 'Mehrfachauswahl ist möglich. Markiere alle passenden Antworten.',
    emptyTitle: 'Questions sind bereit.',
    emptyText: 'Lege jetzt die ersten SRH Holding Fragen an. Single- und Multi-Select können gemischt genutzt werden.',
    panelTitle: 'Questions und Antworten',
    panelCopy: 'Im Questions-Modus können mehrere Antworten gleichzeitig richtig sein. Das eignet sich ideal für Holding-Themen mit mehreren Facetten.',
    composerCopy: 'Questions eignen sich für starke Holding-Botschaften, Facts und klare Multi-Select-Interaktion auf Event- und Touch-Flächen.',
    editorBadge: 'Single oder Multi'
  },
  memory: {
    modeLabel: 'Memory',
    itemLabel: 'Paar',
    emptyTitle: 'Memory ist bereit.',
    emptyText: 'Lege jetzt das erste Kartenpaar an. Kurze Begriffe und ein klarer Match-Text funktionieren auf dem Tablet am besten.',
    panelTitle: 'Memory Kartenpaare',
    panelCopy: 'Jedes Memory-Paar besteht aus zwei gleichwertigen Karten und einer optionalen Kategorie für die Player View.',
    composerCopy: 'Memory eignet sich für Werte, Themen und Kernbotschaften der SRH Holding in Bildung und Gesundheit.',
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
    modeLabel: 'Glücksrad',
    itemLabel: 'Segment',
    emptyTitle: 'Das Rad wartet auf Themen.',
    emptyText: 'Lege jetzt Segmente an, die nach dem Spin als SRH Holding Impulse erscheinen.',
    panelTitle: 'Segmente und Impulse',
    panelCopy: 'Jedes Segment bekommt einen Titel, eine optionale Kategorie und genau einen Impuls für den Reveal nach dem Spin.',
    composerCopy: 'Das Glücksrad ist ideal für Live-Inszenierungen, Themenimpulse und auffällige Moderationsmomente.',
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
    panelCopy: 'Jede Box bekommt einen Titel, einen kurzen Zustand für die geschlossene Ansicht und einen Reveal-Text für den Aha-Moment.',
    composerCopy: 'Mystery Boxen schaffen Aha-Momente für Insights, Geschichten und Kernaussagen der SRH Holding.',
    editorBadge: 'Reveal Box',
    primaryLabel: 'Boxtitel',
    primaryPlaceholder: 'z.B. Insight 01',
    secondaryLabel: 'Reveal-Text',
    secondaryPlaceholder: 'Kurzer Insight, der nach dem Öffnen direkt sichtbar wird.',
    metaLabel: 'Text auf der geschlossenen Box',
    metaPlaceholder: 'z.B. Tippen zum Öffnen',
    editorHint: 'Geschlossene Boxen brauchen nur einen kurzen Teaser. Die eigentliche Aussage steht im Reveal.'
  }
};

let currentQuiz = null;

function cloneQuizData(quiz) {
  return JSON.parse(JSON.stringify(quiz));
}

function normalizeQuizRecord(quiz = {}) {
  const mode = getQuizMode(quiz);
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

  return {
    id: quiz.id || uuidv4(),
    title: String(quiz.title || '').trim(),
    description: String(quiz.description || '').trim(),
    mode,
    timerMode: quiz.timerMode || 'auto',
    timerSeconds: Number(quiz.timerSeconds) || 30,
    questions: questions.map((item) => normalizeItem(item, mode)),
    createdAt: quiz.createdAt || new Date().toISOString(),
    updatedAt: quiz.updatedAt || quiz.createdAt || new Date().toISOString()
  };
}

function showQuestionsSection(visible = true) {
  const section = document.getElementById('questions-section');
  if (section) section.style.display = visible ? 'block' : 'none';
}

function getCurrentQuizSnapshot() {
  if (!currentQuiz) return null;

  const mode = getSelectedMode();
  const timerMode = document.getElementById('quiz-timer-mode')?.value || 'auto';
  const timerSeconds = Number(document.getElementById('quiz-timer-seconds')?.value) || 30;

  return {
    ...currentQuiz,
    title: document.getElementById('quiz-title')?.value.trim() || currentQuiz.title || '',
    description: document.getElementById('quiz-description')?.value.trim() || currentQuiz.description || '',
    mode,
    timerMode,
    timerSeconds,
    questions: (currentQuiz.questions || []).map((item) => normalizeItem(item, mode))
  };
}

function persistAdminDraft() {
  const snapshot = getCurrentQuizSnapshot();

  if (!snapshot) {
    AdminDraftStore.clear();
    AdminStateStore.clear();
    return;
  }

  currentQuiz = snapshot;
  AdminDraftStore.set(cloneQuizData(snapshot));
  AdminStateStore.setCurrentQuizId(snapshot.id);
  updateAdminInsights();
}

function populateEditor(quiz) {
  currentQuiz = normalizeQuizRecord(cloneQuizData(quiz));

  document.getElementById('quiz-title').value = currentQuiz.title;
  document.getElementById('quiz-mode').value = currentQuiz.mode;

  const descEl = document.getElementById('quiz-description');
  if (descEl) descEl.value = currentQuiz.description || '';

  const timerMode = currentQuiz.timerMode || 'auto';
  const timerModeEl = document.getElementById('quiz-timer-mode');
  if (timerModeEl) timerModeEl.value = timerMode;

  const timerSeconds = currentQuiz.timerSeconds || 30;
  const timerSecondsEl = document.getElementById('quiz-timer-seconds');
  if (timerSecondsEl) timerSecondsEl.value = timerSeconds;

  updateTimerConfig();
  showQuestionsSection(true);
  updateEditorModeText();
  renderQuestions();
  persistAdminDraft();
  renderSavedQuizzes();
}

function formatQuizTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unbekannt';

  return date.toLocaleString('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function getSavedQuizzes() {
  const savedQuizzes = QuizStore.all().map((quiz) => normalizeQuizRecord(quiz));
  const draft = getCurrentQuizSnapshot() || AdminDraftStore.get();

  if (draft?.id) {
    const draftRecord = normalizeQuizRecord(draft);
    const index = savedQuizzes.findIndex((quiz) => quiz.id === draftRecord.id);
    if (index >= 0) savedQuizzes[index] = draftRecord;
  }

  return savedQuizzes.sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function renderSavedQuizCard(quiz) {
  const copy = getModeCopy(quiz.mode);
  const isActive = currentQuiz?.id === quiz.id;

  return `
    <article class="saved-quiz-card ${isActive ? 'is-active' : ''}">
      <div class="saved-quiz-head">
        <div class="saved-quiz-copy">
          <span class="status-pill status-soft">${copy.modeLabel}</span>
          <h3>${esc(quiz.title || 'Unbenannte Experience')}</h3>
        </div>
        <span class="saved-quiz-count">${quiz.questions.length} Einträge</span>
      </div>

      <div class="saved-quiz-stats">
        <span class="status-pill">${isActive ? 'Im Editor' : 'Gespeichert'}</span>
        <span class="status-pill status-soft">Update ${esc(formatQuizTimestamp(quiz.updatedAt || quiz.createdAt))}</span>
      </div>

      <p class="saved-quiz-meta">Diese Experience kann direkt wieder geladen, angepasst und neu gestartet werden.</p>

      <div class="saved-quiz-actions">
        <button class="btn btn-secondary btn-sm" type="button" onclick="loadStoredQuiz('${quiz.id}')">Bearbeiten</button>
        <button class="question-remove" type="button" onclick="deleteStoredQuiz('${quiz.id}')">Löschen</button>
      </div>
    </article>
  `;
}

function renderSavedQuizzes() {
  const list = document.getElementById('saved-quizzes-list');
  if (!list) return;

  const savedQuizzes = getSavedQuizzes();
  if (!savedQuizzes.length) {
    list.innerHTML = `
      <div class="saved-quizzes-empty">
        <strong>Noch keine Experience gespeichert.</strong>
        <p>Nach dem ersten Speichern erscheint sie hier zum späteren Bearbeiten.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = savedQuizzes.map((quiz) => renderSavedQuizCard(quiz)).join('');
}

function updateStorageNotice() {
  const copyEl = document.getElementById('saved-quizzes-copy');
  const warningEl = document.getElementById('storage-warning');
  const status = Store.getStatus();
  const warnings = [];

  if (copyEl) {
    copyEl.textContent = status.isFileProtocol
      ? 'Gespeicherte Experiences können hier erneut geladen werden. Export und Import funktionieren auch auf Tablets, für stabilen Browser-Speicher ist localhost aber zuverlässiger als der direkte Datei-Start.'
      : 'Gespeicherte Experiences können hier erneut geladen, exportiert, importiert und direkt wieder gestartet werden.';
  }

  if (status.isFileProtocol) {
    warnings.push('Die App läuft direkt über file://. Browser behandeln localStorage in diesem Modus oft pro Datei oder nur eingeschränkt.');
  }

  if (!status.hasLocalStorage) {
    warnings.push('localStorage ist in diesem Browser aktuell nicht beschreibbar. Im selben Tab nutzt die App deshalb ein Fallback über window.name.');
  }

  if (!warningEl) return;

  if (!warnings.length) {
    warningEl.classList.add('hidden');
    warningEl.innerHTML = '';
    return;
  }

  warningEl.classList.remove('hidden');
  warningEl.innerHTML = `
    <strong>Speicher-Hinweis</strong>
    <p>${warnings.join(' ')}</p>
    <p>Empfehlung: die App über einen lokalen Webserver wie http://localhost starten.</p>
  `;
}

function startFreshDraft(showToast = true) {
  currentQuiz = null;
  AdminDraftStore.clear();
  AdminStateStore.clear();

  document.getElementById('quiz-title').value = '';
  showQuestionsSection(false);
  renderQuestions();
  updateEditorModeText();
  renderSavedQuizzes();

  if (showToast) {
    toast('Neuer Entwurf gestartet.', 'info');
  }
}

function loadStoredQuiz(quizId) {
  const quiz = QuizStore.get(quizId);
  if (!quiz) {
    renderSavedQuizzes();
    toast('Die gespeicherte Experience wurde nicht gefunden.', 'error');
    return;
  }

  populateEditor(quiz);
  toast('Experience zum Bearbeiten geladen.', 'success');
}

function deleteStoredQuiz(quizId) {
  const quiz = QuizStore.get(quizId);
  if (!quiz) {
    renderSavedQuizzes();
    return;
  }

  const label = quiz.title || 'Diese Experience';
  if (!window.confirm(`\"${label}\" wirklich löschen?`)) return;

  QuizStore.delete(quizId);

  const activeCode = ActiveGameStore.get();
  const activeGame = activeCode ? GameStore.get(activeCode) : null;
  if (activeGame?.quizId === quizId) {
    GameStore.remove(activeCode);
    ActiveGameStore.clear();
  }

  if (AdminStateStore.getCurrentQuizId() === quizId) {
    AdminStateStore.clear();
  }

  const draft = AdminDraftStore.get();
  if (draft?.id === quizId) {
    AdminDraftStore.clear();
  }

  if (currentQuiz?.id === quizId) {
    startFreshDraft(false);
  }

  renderSavedQuizzes();
  toast('Experience gelöscht.', 'success');
}

function restoreAdminSession() {
  const draft = AdminDraftStore.get();
  if (draft?.id) {
    populateEditor(draft);
    return true;
  }

  const currentQuizId = AdminStateStore.getCurrentQuizId();
  if (currentQuizId) {
    const storedQuiz = QuizStore.get(currentQuizId);
    if (storedQuiz) {
      populateEditor(storedQuiz);
      return true;
    }
  }

  const activeCode = ActiveGameStore.get();
  const activeGame = activeCode ? GameStore.get(activeCode) : null;
  const activeQuiz = activeGame ? QuizStore.get(activeGame.quizId) : null;

  if (activeQuiz) {
    populateEditor(activeQuiz);
    return true;
  }

  showQuestionsSection(false);
  return false;
}

function bindAdminInputListeners() {
  const titleInput = document.getElementById('quiz-title');
  const descInput = document.getElementById('quiz-description');

  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!currentQuiz) {
        updateAdminInsights();
        return;
      }
      currentQuiz.title = titleInput.value;
      persistAdminDraft();
      renderSavedQuizzes();
    });
  }

  if (descInput) {
    descInput.addEventListener('input', () => {
      if (!currentQuiz) return;
      currentQuiz.description = descInput.value;
      persistAdminDraft();
    });
  }
}

function sanitizeFilenamePart(value, fallback = 'experience') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

function buildExportPayload(quizzes, scope) {
  return {
    app: 'SRH Experience',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    scope,
    exportedAt: new Date().toISOString(),
    quizzes: quizzes.map((quiz) => normalizeQuizRecord(cloneQuizData(quiz)))
  };
}

function triggerQuizImport() {
  document.getElementById('quiz-import-input')?.click();
}

function downloadExportBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canShareFiles(file) {
  if (!file || typeof navigator?.share !== 'function') return false;

  if (typeof navigator.canShare !== 'function') return true;

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

async function deliverExportFile(payload, fileName, title) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const file = typeof File === 'function'
    ? new File([blob], fileName, { type: 'application/json' })
    : null;

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        title,
        text: 'SRH Experience Export für Tablet, OneDrive oder Google Drive.',
        files: [file]
      });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      console.error(error);
    }
  }

  downloadExportBlob(blob, fileName);
  return 'downloaded';
}

async function exportCurrentQuiz() {
  const snapshot = getCurrentQuizSnapshot();
  if (!snapshot) {
    toast('Es gibt aktuell keinen Entwurf zum Exportieren.', 'error');
    return;
  }

  currentQuiz = normalizeQuizRecord(snapshot);
  persistAdminDraft();
  renderSavedQuizzes();

  const fileName = `${sanitizeFilenamePart(currentQuiz.title, 'srh-experience')}.json`;
  const result = await deliverExportFile(
    buildExportPayload([currentQuiz], 'draft'),
    fileName,
    currentQuiz.title || 'SRH Experience'
  );

  if (result === 'shared') {
    toast('Export bereit. Teile die Datei direkt nach OneDrive oder Google Drive.', 'success');
    return;
  }

  if (result === 'downloaded') {
    toast('Export als JSON gespeichert. Die Datei kann in OneDrive oder Google Drive hochgeladen werden.', 'success');
  }
}

async function exportQuizLibrary() {
  const quizzes = QuizStore.all().map((quiz) => normalizeQuizRecord(quiz));
  if (!quizzes.length) {
    toast('Die Bibliothek ist noch leer.', 'error');
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `srh-experience-bibliothek-${stamp}.json`;
  const result = await deliverExportFile(
    buildExportPayload(quizzes, 'library'),
    fileName,
    'SRH Experience Bibliothek'
  );

  if (result === 'shared') {
    toast('Bibliothek bereit. Teile die JSON direkt in OneDrive oder Google Drive.', 'success');
    return;
  }

  if (result === 'downloaded') {
    toast('Bibliothek als JSON gespeichert.', 'success');
  }
}

function extractImportedQuizzes(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.quizzes)) return payload.quizzes;
  if (payload?.quiz && typeof payload.quiz === 'object') return [payload.quiz];
  if (payload && typeof payload === 'object' && Array.isArray(payload.questions)) return [payload];
  return [];
}

async function handleQuizImport(event) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const payload = JSON.parse(raw);
    const quizzes = extractImportedQuizzes(payload)
      .map((quiz) => normalizeQuizRecord(quiz))
      .filter((quiz) => quiz.title || quiz.questions.length > 0);

    if (!quizzes.length) {
      throw new Error('No quizzes found in import file.');
    }

    quizzes.forEach((quiz) => {
      quiz.updatedAt = new Date().toISOString();
      QuizStore.upsert(cloneQuizData(quiz));
    });

    renderSavedQuizzes();

    if (quizzes.length === 1) {
      populateEditor(quizzes[0]);
    }

    toast(`${quizzes.length} Experience${quizzes.length > 1 ? 's' : ''} importiert.`, 'success');
  } catch (error) {
    console.error(error);
    toast('Import fehlgeschlagen. Bitte eine gültige JSON-Datei wählen.', 'error');
  } finally {
    if (input) input.value = '';
  }
}

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

function buildMysteryItem(title, reveal, teaser = 'Tippen zum Öffnen') {
  return {
    title,
    teaser: 'Tippen zum Öffnen',
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
    teaser: 'Tippen zum Öffnen',
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
      buildQuizQuestion('Was stärkt eine SRH Experience auf Eventflächen?', ['Klare Botschaften', 'Touch-taugliche Interaktion', 'Versteckte Navigation', 'Lange Textwüsten'], [0, 1]),
      buildQuizQuestion('Wofür steht "Aus Leidenschaft fürs Leben" im Auftritt?', ['Wertorientierung', 'Reine Technikwerbung', 'Haltung mit menschlichem Fokus', 'Beliebiger Kampagnenclaim'], [0, 2]),
      buildQuizQuestion('Wohin reinvestiert SRH Gewinne?', ['In starke Angebote und Zukunftsmärkte', 'Ausschließlich in Printwerbung', 'Nur in Verwaltung', 'Gar nicht'], [0]),
      buildQuizQuestion('Welche Eigenschaften passen zur SRH Holding Darstellung?', ['Verantwortung', 'Innovationsbereitschaft', 'Beliebigkeit', 'Langfristigkeit'], [0, 1, 3]),
      buildQuizQuestion('Warum funktionieren Questions auf dem Screen gut?', ['Sie machen Themen sofort begreifbar', 'Sie laden zu schneller Interaktion ein', 'Sie brauchen zwingend mehrere Personen', 'Sie eignen sich für Single- und Multi-Select'], [0, 1, 3])
    ]
  },
  memory: {
    title: 'SRH Holding Pair Match',
    mode: 'memory',
    questions: [
      buildMemoryItem('Bildung', 'Neue Lebenschancen', 'Holding'),
      buildMemoryItem('Gesundheit', 'Das Wohl des Menschen', 'Versorgung'),
      buildMemoryItem('Verantwortung', 'Gemeinnützig und unternehmerisch', 'Werte'),
      buildMemoryItem('Innovation', 'Digitale Lösungen mit Nutzen', 'Zukunft'),
      buildMemoryItem('Partnerschaft', 'Starker Verbund aus Bildung und Gesundheit', 'Netzwerk'),
      buildMemoryItem('SRH', 'Aus Leidenschaft fürs Leben', 'Claim')
    ]
  },
  wheel: {
    title: 'SRH Holding Themenrad',
    mode: 'wheel',
    questions: [
      buildWheelItem('Bildung', 'Angebote, die Menschen neue Lebenschancen eröffnen.', 'Bildung'),
      buildWheelItem('Gesundheit', 'Das Wohl von Patientinnen und Patienten steht im Mittelpunkt.', 'Gesundheit'),
      buildWheelItem('Verantwortung', 'Gemeinnützigkeit und unternehmerisches Handeln greifen ineinander.', 'Werte'),
      buildWheelItem('Werte', 'Aus Leidenschaft fürs Leben ist Haltung und Anspruch zugleich.', 'Claim'),
      buildWheelItem('Innovation', 'Digitale Lösungen entstehen mit echtem Nutzen für Menschen.', 'Zukunft'),
      buildWheelItem('Zukunft', 'Gewinne fließen in starke Angebote und Zukunftsmärkte zurück.', 'Wachstum')
    ]
  },
  mystery: {
    title: 'SRH Holding Mystery Boxen',
    mode: 'mystery',
    questions: [
      buildMysteryItem('Insight 01', 'SRH verbindet Bildung und Gesundheit unter einem Dach.', 'Box öffnen'),
      buildMysteryItem('Insight 02', 'Soziale Verantwortung ist Teil des unternehmerischen Handelns.', 'Mehr entdecken'),
      buildMysteryItem('Insight 03', 'Gewinne werden in die Zukunft von Angeboten und Märkten reinvestiert.', 'Reveal starten'),
      buildMysteryItem('Insight 04', 'Die SRH gestaltet Lebensqualität und Lebenschancen aktiv mit.', 'Tippen zum Öffnen'),
      buildMysteryItem('Insight 05', 'Klare interaktive Formate machen Holding-Themen sichtbar und merkbar.', 'Insight laden'),
      buildMysteryItem('Insight 06', 'Die SRH ist ein starker Partner für Bildung und Gesundheit.', 'Mehr erfahren')
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
    persistAdminDraft();
  }
  updateTimerConfig();
  updateEditorModeText();
  if (currentQuiz) {
    renderQuestions();
    renderSavedQuizzes();
  }
  else updateAdminInsights();
}

function updateTimerConfig() {
  const mode = getSelectedMode();
  const timerModeEl = document.getElementById('quiz-timer-mode');
  const timerConfigGroup = document.getElementById('timer-config-group');
  const timerCustomGroup = document.getElementById('timer-custom-group');

  if (timerConfigGroup) {
    timerConfigGroup.classList.toggle('hidden', mode !== 'quiz');
  }

  const timerMode = timerModeEl?.value || 'auto';
  if (timerCustomGroup) {
    timerCustomGroup.classList.toggle('hidden', mode !== 'quiz' || timerMode !== 'custom');
  }

  if (currentQuiz) {
    currentQuiz.timerMode = timerMode;
    currentQuiz.timerSeconds = Number(document.getElementById('quiz-timer-seconds')?.value) || 30;
    persistAdminDraft();
  }
}

function createQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const mode = getSelectedMode();

  if (!title) {
    toast('Bitte zuerst einen Titel vergeben.', 'error');
    return;
  }

  currentQuiz = normalizeQuizRecord({
    id: uuidv4(),
    title,
    mode,
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  showQuestionsSection(true);
  updateEditorModeText();
  renderQuestions();
  persistAdminDraft();
  renderSavedQuizzes();
}

function loadExampleSession(mode) {
  const baseSession = EXAMPLE_SESSIONS[mode] || EXAMPLE_SESSIONS.quiz;
  currentQuiz = normalizeQuizRecord({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...baseSession
  });

  document.getElementById('quiz-title').value = currentQuiz.title;
  document.getElementById('quiz-mode').value = currentQuiz.mode;
  showQuestionsSection(true);
  updateEditorModeText();
  renderQuestions();
  persistAdminDraft();
  renderSavedQuizzes();
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
        <button class="btn btn-ghost" type="button" onclick="addQuestion()">+ ${copy.itemLabel} hinzufügen</button>
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
  persistAdminDraft();
  renderSavedQuizzes();
}

function removeQuestion(index) {
  if (!currentQuiz) return;
  currentQuiz.questions.splice(index, 1);
  renderQuestions();
  persistAdminDraft();
  renderSavedQuizzes();
}

function updateQuestion(index, value) {
  updateModuleField(index, 'text', value);
}

function updateModuleField(index, field, value) {
  if (!currentQuiz?.questions?.[index]) return;
  currentQuiz.questions[index][field] = value;
  persistAdminDraft();
}

function updateAnswer(questionIndex, answerIndex, value) {
  if (!currentQuiz || currentQuiz.mode !== 'quiz') return;
  currentQuiz.questions[questionIndex].answers[answerIndex].text = value;
  persistAdminDraft();
}

function toggleCorrect(questionIndex, answerIndex) {
  if (!currentQuiz || currentQuiz.mode !== 'quiz') return;

  currentQuiz.questions[questionIndex].answers[answerIndex].isCorrect = !currentQuiz.questions[questionIndex].answers[answerIndex].isCorrect;
  persistAdminDraft();
  renderQuestions();
}

function validateItem(item, index, mode, copy) {
  const itemNumber = index + 1;

  if (mode === 'quiz') {
    const filledAnswers = item.answers.filter((answer) => answer.text.trim());
    const correctAnswers = item.answers.filter((answer) => answer.isCorrect && answer.text.trim());

    if (!item.text.trim()) {
      return `${copy.itemLabel} ${itemNumber} benötigt einen Titel.`;
    }
    if (filledAnswers.length < 2) {
      return `${copy.itemLabel} ${itemNumber} benötigt mindestens zwei Antwortoptionen.`;
    }
    if (!correctAnswers.length) {
      return `${copy.itemLabel} ${itemNumber} benötigt mindestens eine richtige Antwort.`;
    }
    return '';
  }

  if (mode === 'memory') {
    if (!item.prompt.trim() || !item.match.trim()) {
      return `${copy.itemLabel} ${itemNumber} benötigt zwei Karteninhalte.`;
    }
    return '';
  }

  if (mode === 'wheel') {
    if (!item.title.trim()) {
      return `${copy.itemLabel} ${itemNumber} benötigt einen Segmenttitel.`;
    }
    if (!item.detail.trim()) {
      return `${copy.itemLabel} ${itemNumber} benötigt einen Impuls für den Spin.`;
    }
    return '';
  }

  if (!item.title.trim()) {
    return `${copy.itemLabel} ${itemNumber} benötigt einen Boxtitel.`;
  }
  if (!item.reveal.trim()) {
    return `${copy.itemLabel} ${itemNumber} benötigt einen Reveal-Text.`;
  }
  return '';
}

function saveQuiz() {
  if (!currentQuiz) {
    toast('Es gibt noch keine Experience zum Speichern.', 'error');
    return;
  }

  currentQuiz = normalizeQuizRecord(getCurrentQuizSnapshot());
  currentQuiz.updatedAt = new Date().toISOString();

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

  QuizStore.upsert(cloneQuizData(currentQuiz));
  AdminDraftStore.set(cloneQuizData(currentQuiz));
  AdminStateStore.setCurrentQuizId(currentQuiz.id);

  const game = {
    code: 'GAME-' + Math.floor(Math.random() * 9999),
    quizId: currentQuiz.id,
    mode: currentQuiz.mode,
    timerMode: currentQuiz.timerMode || 'auto',
    timerSeconds: currentQuiz.timerSeconds || 30,
    status: 'ready',
    lastResult: null
  };

  GameStore.set(game.code, game);
  ActiveGameStore.set(game.code);

  updateAdminInsights(true);
  renderSavedQuizzes();
  toast('Experience gespeichert. Player View wird geöffnet ...', 'success');
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
  if (addButton) addButton.textContent = `+ ${copy.itemLabel} hinzufügen`;
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
  bindAdminInputListeners();
  bindTimerInputListeners();
  updateStorageNotice();
  renderSavedQuizzes();
  if (!restoreAdminSession()) {
    updateEditorModeText();
    updateTimerConfig();
  }
});

function bindTimerInputListeners() {
  const timerModeEl = document.getElementById('quiz-timer-mode');
  const timerSecondsEl = document.getElementById('quiz-timer-seconds');

  if (timerModeEl) {
    timerModeEl.addEventListener('change', () => {
      updateTimerConfig();
      if (currentQuiz) persistAdminDraft();
    });
  }

  if (timerSecondsEl) {
    timerSecondsEl.addEventListener('input', () => {
      if (currentQuiz) {
        currentQuiz.timerSeconds = Number(timerSecondsEl.value) || 30;
        persistAdminDraft();
      }
    });
  }
}