// src/components/HelpModal.js
import React from 'react';

// All text is now hardcoded in English
function HelpModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const helpItemClass = "mb-2";
    const helpKeyClass = "font-semibold text-sky-600 dark:text-sky-400";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">SubX Help</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3">
                    <p>Welcome to SubX! This is a fully offline subtitle editor. Here are some tips:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li className={helpItemClass}><strong className={helpKeyClass}>File Upload:</strong> Drag & drop an .srt file onto the designated area, or click it (Ctrl+O) to open the file dialog. Select the file encoding if it's not UTF-8. Supports UTF-8 .srt files primarily.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Editing:</strong> Click time/text fields to edit. Save with Enter (text) or the row's Save button. Esc cancels. Browser spell check can be toggled in Settings.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Row Actions:</strong> Edit, Delete (Ctrl+D on active row), Split (Ctrl+Shift+S on active row), and Merge Next (Ctrl+Shift+M on active row) buttons are available for each subtitle.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Bulk Actions:</strong> Use checkboxes or Ctrl+A to select. 'Delete Selected' (or Delete key) removes them. Some operations show a loading indicator. You can also shift selected subtitles or set their duration using the inputs in the 'Selected Actions' bar.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Find & Replace:</strong> Use the dedicated section to search for text within subtitles and replace it. 'Count' shows occurrences. Searched text is highlighted in the table.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Shift Times:</strong> Adjust all subtitle timings by entering a millisecond value.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Two-Point Sync:</strong> Use the 'Two-Point Sync' tool to adjust subtitles based on two reference points in your video and the subtitle file. This is useful for correcting drift or scaling issues.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Error Checking:</strong> Click 'Check for Errors' to identify common issues like time overlaps, short/long durations, too many lines, or too many characters per line. Error thresholds (like Max Lines, Max Chars per Line) can be adjusted in Settings. 'Fix Overlaps' and 'Fix Durations' attempt to automatically correct these specific issues.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Undo/Redo:</strong> Most actions are undoable (Ctrl+Z) and redoable (Ctrl+Y).</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Saving:</strong> 'Save Subtitles (.srt)' (Ctrl+S) downloads your work. Autosave (if enabled in Settings) saves to browser storage. An asterisk (*) next to the Save button indicates unsaved changes.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Settings:</strong> Customize error checking parameters (including Max Lines & Chars), table font, editor displays (like character/line counts, spell check), and autosave via the gear icon in the header.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Offline First & PWA:</strong> SubX is designed to work entirely in your browser, even offline, once loaded. With a supported browser, you can 'Install' SubX for a more app-like experience. If offline and a page isn't cached, a basic offline page will be shown.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Jump to Line:</strong> Use the input field above the table to quickly navigate to a specific subtitle number. The line will be selected and briefly highlighted.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Keyboard Navigation:</strong> Use Arrow Up/Down to navigate rows in the table. Press Enter on an active row to toggle edit mode. Esc in edit mode cancels changes.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Visual Timeline:</strong> A visual representation of subtitles over time. Click a block to jump to and select that subtitle in the table.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Conceptual Waveform:</strong> A simple visual representation of the active subtitle's sound.</li>
                    </ul>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow text-sm transition-colors">Close Help</button>
                </div>
            </div>
        </div>
    );
}
export default HelpModal;
