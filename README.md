# SRH Quiz – Messemodus

Eine statische Web-App für SRH Messestände: Der Admin bereitet Quizze vor, Besucher:innen spielen direkt im Einzelmodus auf dem Gerät und danach kann das Quiz sofort neu gestartet werden.

🔗 **Live-Demo:** [GitHub Pages](https://zeroks77.github.io/QuizSAHDemo/)

## Features

- SRH-inspiriertes Branding für Messeeinsätze
- Single-User Flow ohne Multiplayer oder Join-Code
- Admin-Ansicht zum Erstellen, Bearbeiten und Vorbereiten von Quizzen
- Vordefinierte SRH Quiz-Vorlagen als schneller Einstieg
- Direkter Neustart nach einem abgeschlossenen Durchlauf
- Touch-freundliche Spieleransicht mit Timer und Punkteanzeige

## Nutzung

### Admin
1. `admin.html` öffnen
2. Optional **Vorlagen laden** oder ein eigenes Quiz anlegen
3. Fragen und Antworten definieren und speichern
4. Quiz über **Vorbereiten** bereitstellen
5. Spieleransicht über `play.html` auf demselben Gerät öffnen

### Spieleransicht
1. `play.html` öffnen
2. Vorbereitetes Quiz starten
3. Fragen beantworten und Ergebnis ansehen
4. Das Quiz bei Bedarf direkt neu starten

## Technologien

- Reines HTML, CSS und JavaScript
- `localStorage` für Quiz- und Spielstatus
- `canvas-confetti` für Abschlussanimationen

## Struktur

```
├── index.html       – Startseite
├── admin.html       – Admin / Quiz-Vorbereitung
├── play.html        – Spieleransicht im Einzelmodus
├── css/
│   └── style.css    – Globale Stile
└── js/
    ├── common.js    – Gemeinsame Hilfsfunktionen & Storage
    ├── admin.js     – Admin-Logik
    ├── play.js      – Spieler-Logik
    └── wheel.js     – Glücksrad-Komponente
```

## Deployment

Das Repository enthält einen GitHub-Pages-Workflow. Bei einem Push auf `main` wird die statische Seite automatisch nach GitHub Pages deployed.
