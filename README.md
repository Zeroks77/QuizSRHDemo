# SRH Experience – Holding Event Mode

Eine statische Web-App fuer SRH Auftritte auf Event, Messe und Touchscreen: Der Admin bereitet eine Experience vor, Besucher:innen spielen direkt im Einzelmodus auf dem Geraet und danach kann der Lauf sofort neu gestartet werden. Die Player View ist fuer Tablets optimiert und auf schnelle Touch-Interaktion ausgelegt.

🔗 **Live-Demo:** [GitHub Pages](https://zeroks77.github.io/QuizSAHDemo/)

## Features

- SRH Holding Branding fuer Bildung, Gesundheit, Werte und Verantwortung
- Vier sofort nutzbare Formate: Questions, Memory, Gluecksrad und Mystery Boxen
- Single-User Flow ohne Multiplayer oder Join-Code
- Admin-Ansicht mit eigenen Eingabemasken fuer Questions, Memory, Wheel und Mystery
- Beispiel-Sessions fuer einen schnellen Showcase-Start
- Direkter Neustart nach einem abgeschlossenen Durchlauf
- Touch-freundliche Player View mit Screen-tauglicher Inszenierung
- Kompaktere Karten und reduzierte Motion fuer stabile Tablet-Performance

## Nutzung

### Admin
1. `admin.html` öffnen
2. Optional ein Beispiel fuer Questions, Memory, Gluecksrad oder Mystery laden
3. Titel, Modus und Inhalte definieren und speichern
4. Experience fuer die Player View bereitstellen
5. Spieleransicht über `play.html` auf demselben Gerät öffnen

### Spieleransicht
1. `play.html` öffnen
2. Vorbereitete Experience starten
3. Gewaehltes Format ausspielen und Ergebnis ansehen
4. Die Experience bei Bedarf direkt neu starten

## Technologien

- Reines HTML, CSS und JavaScript
- `localStorage` fuer Experience- und Spielstatus
- `canvas-confetti` fuer Abschlussanimationen
- Canvas-basiertes Themenrad fuer den Gluecksrad-Modus
- Tablet-optimierte Layouts und Touch-Interaktionen ohne zusaetzliche Frameworks

## Struktur

```
├── index.html       – Startseite / Landing
├── admin.html       – Admin / Experience-Vorbereitung
├── play.html        – Spieleransicht im Einzelmodus
├── css/
│   └── style.css    – Globale Stile
└── js/
    ├── common.js    – Gemeinsame Hilfsfunktionen & Storage
    ├── admin.js     – Admin-Logik
    ├── play.js      – Player-Runtime fuer alle Modi
    └── wheel.js     – Canvas-Logik fuer das Themenrad
```

## Deployment

Das Repository enthält einen GitHub-Pages-Workflow. Bei einem Push auf `main` wird die statische Seite automatisch nach GitHub Pages deployed.
