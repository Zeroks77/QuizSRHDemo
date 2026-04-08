# SRH Experience – Holding Event Mode

Eine statische Web-App für SRH Auftritte auf Event, Messe und Touchscreen: Der Admin bereitet eine Experience vor, Besucher:innen spielen direkt im Einzelmodus auf dem Gerät und danach kann der Lauf sofort neu gestartet werden. Die Player View ist für Tablets optimiert und auf schnelle Touch-Interaktion ausgelegt.

🔗 **Live-Demo:** [GitHub Pages](https://zeroks77.github.io/QuizSRHDemo/)

## Features

- SRH Holding Branding für Bildung, Gesundheit, Werte und Verantwortung
- Vier sofort nutzbare Formate: Questions, Memory, Glücksrad und Mystery Boxen
- Single-User Flow ohne Multiplayer oder Join-Code
- Admin-Ansicht mit eigenen Eingabemasken für Questions, Memory, Wheel und Mystery
- Beispiel-Sessions für einen schnellen Showcase-Start
- Direkter Neustart nach einem abgeschlossenen Durchlauf
- Touch-freundliche Player View mit Screen-tauglicher Inszenierung
- Kompaktere Karten und reduzierte Motion für stabile Tablet-Performance

## Nutzung

Hinweis: Für zuverlässigen Browser-Speicher die App über `http://localhost` oder einen anderen lokalen Webserver öffnen. Direktes Öffnen per `file://` kann je nach Browser getrennte `localStorage`-Bereiche pro Seite verursachen.

### Lokal starten
1. Im Projektordner einen lokalen Webserver starten, z.B. `python -m http.server 8000`
2. `http://localhost:8000/admin.html` öffnen
3. Experience speichern und danach in `play.html` testen

### Admin
1. `admin.html` im lokalen Webserver öffnen
2. Optional ein Beispiel für Questions, Memory, Glücksrad oder Mystery laden
3. Titel, Modus und Inhalte definieren und speichern
4. Gespeicherte Experiences bei Bedarf in der Bibliothek erneut laden und weiterbearbeiten
5. Für Tablet-Workflows die aktive Experience oder die komplette Bibliothek als JSON exportieren
6. Die JSON über Teilen oder Dateien nach OneDrive bzw. Google Drive legen und später wieder importieren
7. Experience für die Player View bereitstellen
8. Spieleransicht über `play.html` auf demselben Gerät öffnen

### Spieleransicht
1. `play.html` im lokalen Webserver öffnen
2. Vorbereitete Experience starten
3. Gewähltes Format ausspielen und Ergebnis ansehen
4. Die Experience bei Bedarf direkt neu starten

## Technologien

- Reines HTML, CSS und JavaScript
- `localStorage` für Experience- und Spielstatus
- `canvas-confetti` für Abschlussanimationen
- Canvas-basiertes Themenrad für den Glücksrad-Modus
- Tablet-optimierte Layouts und Touch-Interaktionen ohne zusätzliche Frameworks

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
    ├── play.js      – Player-Runtime für alle Modi
    └── wheel.js     – Canvas-Logik für das Themenrad
```

## Deployment

Das Repository enthält einen GitHub-Pages-Workflow. Bei einem Push auf `main` wird die statische Seite automatisch nach GitHub Pages deployed.
