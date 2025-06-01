# 🚀 SubX - Galactic Subtitle Editor 🌠

Welcome, intrepid time-traveler and linguist, to SubX! Your all-in-one, offline-first, browser-based command center for conquering the cosmos of SRT subtitle files. Prepare to bend time and ensure every word aligns perfectly with the visual wonders of your moving pictures.

## 📂 Project Structure

```
SubX/
├── public/
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── index.html
│   ├── manifest.json
│   └── offline.html
├── src/
│   ├── App.js
│   ├── components/
│   │   ├── FileUploader.js
│   │   ├── Footer.js
│   │   ├── Header.js
│   │   ├── HelpModal.js
│   │   ├── LoadingOverlay.js
│   │   ├── SettingsModal.js
│   │   ├── SubtitleEditor.js
│   │   ├── SubtitleItem.js
│   │   ├── TwoPointSyncModal.js
│   │   ├── VisualTimeline.js
│   │   └── WaveformDisplay.js
│   ├── contexts/
│   │   ├── SettingsContext.js
│   │   └── ThemeContext.js
│   ├── hooks/
│   │   └── useUndoRedo.js
│   ├── locales/                 (This folder is now effectively unused as text is hardcoded in English)
│   │   └── en.js                (Contains English translations - will be simplified/removed)
│   ├── utils/
│   │   └── srtUtils.js
│   ├── index.js
│   └── service-worker.js
├── .gitignore
├── package.json
└── README.md
```

## ✨ Stellar Features

SubX is packed with features to make your subtitle editing journey smooth and efficient:

### 1. Core SRT Editing:
* **File Upload:** Drag & drop your `.srt` scrolls or use `Ctrl+O` to summon them.
* **Multi-Encoding Support:** Deciphers various encodings (UTF-8, Windows-1256, Windows-1252, ISO-8859-1, etc.) during file load.
* **Parsing & Display:** Intelligently parses and displays subtitles in a clear, tabular format: Line No., Start Time, End Time, Text.
* **Direct In-Table Editing:** Modify start/end times and text directly.
* **Add & Delete:** Effortlessly create new subtitle entries or banish unwanted ones.
* **Save As .srt:** Export your masterpiece back into the universal SRT format (`Ctrl+S`), always encoded as UTF-8.

### 2. Advanced Editing Tools:
* **Find & Replace:** Globally search and replace text, with an occurrence counter. Searched text is highlighted. Includes a "Clear Search" button.
* **Time Shifting:**
    * Shift all subtitles at once.
    * Shift only selected subtitles.
* **Duration Setting:** Directly set the display duration for selected subtitles.
* **Split & Merge:** Divide a subtitle or merge it with the next one. (Keyboard shortcuts: `Ctrl+Shift+S` for split, `Ctrl+Shift+M` for merge on active row).
* **Reorder:** Drag & drop subtitles to change their sequence.
* **Two-Point Synchronization:** A powerful chronometer to linearly adjust subtitle timings based on two reference points from your video and SRT file. Perfect for correcting temporal drifts or scaling issues across entire timelines.

### 3. Quality Assurance:
* **Automated Error Detection:** Identifies overlaps, too short/long durations, excessive lines/characters per line, and invalid time ordering.
* **Visual Error Feedback:** Problematic subtitles are clearly marked, with detailed error descriptions available on hover.
* **Automated Fixes (Limited):** Attempt to auto-correct overlaps and duration issues.
* **Customizable Thresholds:** Fine-tune error detection parameters (Min/Max Duration, Max Lines, Max Chars per Line) in the Settings Citadel.

### 4. User Interface & Experience:
* **Dual-Mode Interface:** Switch between Light and Dark themes.
* **System Notifications:** Clear feedback messages for all operations.
* **Undo/Redo:** `Ctrl+Z` to undo, `Ctrl+Y` to redo most actions.
* **Autosave:** Periodically saves progress to browser local storage (toggleable in Settings).
* **Unsaved Changes Indicator:** An asterisk (`*`) on the Save button and document title indicates unsaved work.
* **Keyboard Navigation Matrix:**
    * Navigate table rows with `ArrowUp`/`ArrowDown`.
    * Toggle edit mode with `Enter` on an active row.
    * Extensive `Ctrl`-based shortcuts for most actions (see Help section in the app).
* **Search & Jump:**
    * Live filter subtitles as you type in the search bar. Clear search with an 'x' button.
    * Jump to a specific line number, which gets selected and briefly highlighted.
* **Loading Indicators:** Visual feedback during file processing and bulk operations.
* **Editor Display Customization:** Toggle visibility of character/line counts, and enable/disable browser spell-checking.
* **Visual Timeline:** A graphical overview of subtitle timings. Click a block to jump to and select that subtitle.
* **Conceptual Waveform Display:** A simple visual representation of the active subtitle's sound (conceptual, not actual audio analysis).

### 5. Progressive Web App (PWA) Basics:
* **Offline First:** Designed to work offline once loaded.
* **Installable:** On supported browsers, install SubX as a standalone application.
* **Caching & Offline Page:** Uses a Service Worker for asset caching and provides a fallback `offline.html`.

## 🌌 Setting Up Your Local SubX Instance (For Developers)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/subx.git](https://github.com/your-username/subx.git) # Replace with your repository URL
    cd subx
    ```
2.  **Install Dependencies (if using a build system like Create React App):**
    ```bash
    npm install 
    # or
    yarn install
    ```
3.  **Launch (if using a build system):**
    ```bash
    npm start
    # or
    yarn start
    ```
    Otherwise, you can try opening `public/index.html` directly in a browser that supports ES modules, but a local server is recommended for PWA features.

## 📜 How to Use SubX - A Quick Start Guide

1.  **Launch:** Open `index.html` in a modern web browser.
2.  **Load Subtitles:**
    * Drag and drop your `.srt` file or click the upload area (`Ctrl+O`).
    * Select the file encoding from the dropdown if it's not UTF-8 *before* selecting the file.
3.  **Edit:** Use in-table editing, action buttons, bulk tools, and keyboard shortcuts.
4.  **Save:** Click "Save Subtitles (.srt)" (`Ctrl+S`). An asterisk (`*`) indicates unsaved changes.
5.  **Explore Settings & Help:** Use the gear and question mark icons for customization and guidance.

## 🛠️ Built With Star-Stuff

* **React**
* **Tailwind CSS**
* **JavaScript & HTML5 APIs**

## 🌠 Future Expeditions

* Advanced error correction (e.g., auto-splitting long lines).
* More sophisticated PWA features (fully custom offline page, update notifications).
* Video player integration for direct synchronization.
* Actual audio waveform display.
* Support for more subtitle formats (VTT, SSA/ASS).

## 👽 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

MIT License

---

May your subtitles always be in sync with the cosmic flow! ✨
