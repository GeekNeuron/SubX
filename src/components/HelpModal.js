// src/components/HelpModal.js
import React from 'react';

// All text is hardcoded in English
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
                        <li className={helpItemClass}><strong className={helpKeyClass}>File Upload:</strong> Drag & drop an .srt file, or click the area (Ctrl+O). Select the file encoding if it's not UTF-8.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Video Player:</strong> Load a local video file to sync your subtitles. Use the player controls or keyboard shortcuts (`Space` to play/pause, `Ctrl+Alt+S` to set start time, `Ctrl+Alt+E` to set end time).</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Editing:</strong> Click time/text fields to edit. `Esc` cancels. Browser spell check can be toggled in Settings.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Row Actions:</strong> Edit, Delete (`Ctrl+D` on active row), Split (`Ctrl+Shift+S`), and Merge Next (`Ctrl+Shift+M`) buttons are available.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Bulk Actions:</strong> Use checkboxes or `Ctrl+A`. You can shift selected subtitles or set their duration using the inputs in the 'Selected Actions' bar.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Find & Replace:</strong> Search text globally. Searched text is highlighted in the table.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Two-Point Sync:</strong> A powerful tool to adjust subtitles based on two reference points in your video and the SRT file.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Error Checking:</strong> Click 'Check for Errors' to identify common issues. Thresholds are adjustable in Settings.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Undo/Redo:</strong> Most actions are undoable (`Ctrl+Z`) and redoable (`Ctrl+Y`).</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Saving:</strong> 'Save Subtitles' (`Ctrl+S`) downloads your work. An asterisk (`*`) indicates unsaved changes.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Keyboard Navigation:</strong> Use `ArrowUp`/`ArrowDown` to navigate rows. `Enter` toggles edit mode.</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>Visual Timeline:</strong> A visual representation of subtitles over time. Click a block to jump to and select that subtitle.</li>
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
