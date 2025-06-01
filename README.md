# 🚀 SubX - Galactic Subtitle Editor 🌠

Welcome, intrepid time-traveler and linguist, to SubX! Your all-in-one, offline-first, browser-based command center for conquering the cosmos of SRT subtitle files. Prepare to bend time, translate across galaxies, and ensure every word aligns perfectly with the visual wonders of your moving pictures.

## ✨ Features from Across the Universe

SubX is packed with stellar features to make your subtitle editing journey smooth and efficient:

* **Universal SRT Compatibility:**
    * **File Upload:** Drag & drop your `.srt` scrolls or use the `Ctrl+O` portal to summon them.
    * **Multi-Encoding Support:** Deciphers various ancient encodings (UTF-8, Windows-1256, Windows-1252, etc.) so no dialect is lost in translation.
    * **SRT Parsing & Display:** Intelligently parses and displays subtitles in a clear, tabular format: Line No., Start Time, End Time, Text.
* **Precision Editing Tools:**
    * **Direct In-Table Editing:** Modify start/end times and text directly within the data grid.
    * **Add & Delete:** Effortlessly create new subtitle entries or banish unwanted ones (single or `Ctrl+D` for active row).
    * **Save As .srt:** Export your masterpiece back into the universal SRT format (`Ctrl+S`).
* **Advanced Chronomancy (Time Manipulation):**
    * **Global Shift:** Shift all subtitles forward or backward in time with millisecond precision.
    * **Selected Shift:** Apply time shifts only to your chosen subtitle entries.
    * **Set Duration:** Directly define the display duration for selected subtitles.
    * **Two-Point Synchronization:** A powerful chronometer to linearly adjust subtitle timings based on two reference points from your source video and current SRT. Perfect for correcting temporal drifts or scaling issues across entire timelines.
* **Textual Alchemy (Find & Replace):**
    * **Global Search & Replace:** Find specific textual fragments across all subtitles and replace them individually or all at once.
    * **Occurrence Counter:** Know exactly how many instances of a phrase exist in your scroll.
    * **Search Term Highlighting:** Visually pinpoint your search terms within the subtitle text.
* **Structural Integrity (Split & Merge):**
    * **Split Subtitle:** Divide a lengthy subtitle into two more manageable entries (`Ctrl+Shift+S` on active row).
    * **Merge with Next:** Combine a subtitle with the one immediately following it (`Ctrl+Shift+M` on active row).
* **Quality Assurance (Error Checking & Correction):**
    * **Automated Error Detection:** Identifies common temporal and textual anomalies:
        * Overlapping subtitles.
        * Durations that are too short or too long.
        * Excessive lines per subtitle.
        * Excessive characters per line.
        * Invalid time ordering (start time after end time).
    * **Visual Error Feedback:** Problematic subtitles are clearly marked, with detailed error descriptions available on hover.
    * **Automated Fixes:** Attempt to auto-correct overlaps and duration issues.
    * **Customizable Thresholds:** Fine-tune error detection parameters (min/max duration, max lines/chars) in the Settings Citadel.
* **User Interface & Experience (The Bridge Controls):**
    * **Dual-Mode Interface:** Switch between Light and Dark themes for optimal viewing in any cosmic condition.
    * **Multilingual Console:** Interface translated into numerous galactic tongues including English, Persian (فارسی), Spanish, French, German, Italian, Portuguese, Japanese (日本語), and Chinese (简体中文).
    * **System Notifications:** Clear feedback messages for all operations.
    * **Temporal Flux Reversal (Undo/Redo):** `Ctrl+Z` to undo, `Ctrl+Y` to redo. Most actions are reversible.
    * **Autosave Protocol:** Automatically saves your progress to local browser storage (toggleable in Settings).
    * **Unsaved Changes Indicator:** A visual cue (`*`) on the Save button and document title reminds you of unsaved work.
    * **Keyboard Navigation Matrix:**
        * Navigate table rows with `ArrowUp`/`ArrowDown`.
        * Toggle edit mode for the active row with `Enter`.
        * Extensive `Ctrl`-based shortcuts for most actions.
    * **Search & Jump:**
        * Live filter subtitles as you type in the search bar.
        * Quickly clear search terms.
        * Jump to a specific line number, which gets selected and briefly highlighted.
    * **Loading Indicators:** Visual feedback during file processing and bulk operations.
    * **Editor Display Customization:**
        * Toggle visibility of character count per line.
        * Toggle visibility of total line count in the editor.
        * Enable/disable native browser spell-checking within the text editor.
    * **Visual Timeline (Beta):** A graphical overview of subtitle timings, allowing quick jumps to specific entries.
* **Progressive Web App (PWA) Capabilities:**
    * **Offline First:** Designed to function even without a stable hyperspace connection once initially loaded.
    * **Installable:** On supported browsers, install SubX as a standalone application for a dedicated experience.
    * **Caching & Offline Page:** Utilizes a Service Worker for intelligent caching of app assets and provides a fallback `offline.html` page.

## 🌌 Setting Up Your Local SubX Instance (For Developers)

While SubX is designed for direct browser use, if you wish to tinker with its core mechanics:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/subx.git](https://github.com/your-username/subx.git)
    cd subx
    ```
2.  **Install Dependencies:**
    ```bash
    npm install 
    # or
    yarn install
    ```
3.  **Launch the Development Server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    This will typically open SubX in your default browser at `http://localhost:3000`.

## 📜 How to Use SubX - A Quick Start Guide

1.  **Launch:** Open `index.html` in a modern web browser or deploy the `build` folder to a web server.
2.  **Load Subtitles:**
    * Drag and drop your `.srt` file onto the designated area.
    * Or, click the upload area (or press `Ctrl+O`) to select a file.
    * **Important:** If your file uses a non-UTF-8 encoding, select the correct encoding from the dropdown menu *before* selecting the file.
3.  **Edit:**
    * Click on any timecode or text cell in the table to edit it directly.
    * Use the action buttons (Edit, Delete, Split, Merge) for each row.
    * Utilize the tools in the "Find & Replace", "Shift Times", and "Fix Common Errors" sections for bulk operations.
    * Leverage keyboard shortcuts (see Help section in the app for a full list).
4.  **Save:**
    * Click "Save Subtitles (.srt)" (or `Ctrl+S`) to download your changes.
    * If autosave is enabled, your work is periodically saved to your browser's local storage. An asterisk (*) indicates unsaved changes.
5.  **Explore Settings:** Click the gear icon to customize error checking, appearance, and editor behavior.
6.  **Consult Help:** Click the question mark icon for detailed guidance on all features.

## 🛠️ Built With Star-Stuff

* **React:** For building a dynamic and responsive user interface.
* **Tailwind CSS:** For rapid, utility-first styling.
* **Vazirmatn Font:** For beautiful Persian script rendering.
* **Pure JavaScript & HTML5 APIs:** For core functionalities like File API, TextDecoder, and PWA features.

## 🌠 Future Expeditions (Potential Features)

* Advanced error correction tools (e.g., auto-splitting long lines).
* Enhanced PWA features (custom offline page, update notifications).
* More UI/UX refinements and animations.
* Video player integration for direct synchronization.
* Waveform display for audio-based timing.
* Support for more subtitle formats (VTT, SSA/ASS).

## 👽 Contributing

Contributions from fellow space-farers are welcome! Please fork the repository and submit a pull request with your enhancements.

## 📄 License

This project is licensed under the [MIT License](LICENSE.md) (You'll need to create this file).

---

May your subtitles always be in sync with the cosmic flow! ✨
