# ⚡ QuizSAH – Interaktives Quiz

Eine moderne statische Web-App für interaktive Quizze — mit Admin-Ansicht und Spieler-Ansicht, optimiert für Tablets und Smartphones.

🔗 **Live-Demo:** [GitHub Pages](https://zeroks77.github.io/QuizSAHDemo/)

---

## ✨ Features

- 🎨 **Schönes Dark-Theme** mit Glassmorphismus und Animationen
- 📱 **Mobil-optimiert** – perfekt für Tablets & Smartphones
- 🛠 **Admin-Ansicht** – Quiz erstellen, Fragen & Antworten definieren, richtige Antwort markieren
- 🎮 **Spieler-Ansicht** – Beitritt per QR-Code oder Spielcode
- ⏱ **Countdown-Timer** mit Zeitbonus für schnelle Antworten
- 🏆 **Live-Leaderboard** mit Feieranimationen (Konfetti)
- 🎡 **Glücksrad** für zufällige Gewinner-Auswahl
- 📷 **QR-Code** für schnellen Spieler-Beitritt

## 🚀 Nutzung

### Admin
1. Öffne `admin.html`
2. Erstelle ein neues Quiz oder lade das Demo-Quiz
3. Füge Fragen und Antworten hinzu, markiere die richtige Antwort
4. Klicke auf **▶ Starten** – du erhältst einen Spielcode und QR-Code
5. Für die Demo auf demselben Gerät: öffne die Spieler-Ansicht direkt in einem neuen Tab
6. Teile alternativ den Code/QR mit Mitspielern
7. Klicke **Nächste Frage** um das Quiz zu steuern

### Spieler
1. Öffne `play.html` (oder scanne den QR-Code)
2. Gib deinen Namen und den Spielcode ein
3. Beantworte die Fragen innerhalb der Zeitbegrenzung

### Glücksrad
Im Host-Modus kannst du das Glücksrad öffnen (`🎡 Glücksrad`-Button), um einen zufälligen Gewinner zu ermitteln.

## 🏗 Technologien

- **Reines HTML/CSS/JavaScript** – kein Build-Schritt notwendig
- **localStorage** für Quiz-Datenspeicherung
- **BroadcastChannel API** für Echtzeit-Synchronisierung zwischen Browser-Tabs
- **Canvas API** für das Glücksrad
- **qrcode.js** für QR-Code-Generierung
- **canvas-confetti** für Feieranimationen

## 📁 Struktur

```
├── index.html       – Startseite
├── admin.html       – Admin / Quiz-Host
├── play.html        – Spieler-Ansicht
├── css/
│   └── style.css    – Globale Stile
└── js/
    ├── common.js    – Gemeinsame Hilfsfunktionen
    ├── admin.js     – Admin-Logik
    ├── play.js      – Spieler-Logik
    └── wheel.js     – Glücksrad-Komponente
```

## 🌍 Deployment

Das Repository enthält einen GitHub-Pages-Workflow. Bei einem Push auf `main` wird die statische Seite automatisch nach GitHub Pages deployed.

## ℹ️ Hinweis

Da dies eine reine statische App (ohne Backend) ist, funktioniert die Demo am zuverlässigsten im **gleichen Browser** auf **demselben Gerät** (verschiedene Tabs). Für echten Multiplayer-Betrieb über mehrere Geräte wäre ein Backend (z.B. WebSockets) erforderlich.
