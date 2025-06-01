// src/components/TwoPointSyncModal.js
import React from 'react';
import { srtTimeToMs, msToSrtTime } from '../utils/srtUtils';
import { useUndoRedo } from '../hooks/useUndoRedo'; // Assuming this is where editor state is managed

function TwoPointSyncModal({ 
    isOpen, 
    onClose, 
    subtitles, // Full list of subtitles from SubtitleEditor
    selectedSubtitleIds, // Set of selected subtitle IDs
    setEditorState, // Function to update the main editor state (including subtitles)
    setNotification,
    withLoading
}) {
    const [point1Srt, setPoint1Srt] = React.useState('');
    const [point1Actual, setPoint1Actual] = React.useState('');
    const [point2Srt, setPoint2Srt] = React.useState('');
    const [point2Actual, setPoint2Actual] = React.useState('');
    const [applyTo, setApplyTo] = React.useState('all'); // 'all' or 'selected'

    // Try to prefill with selected subtitles if exactly two are selected
    React.useEffect(() => {
        if (isOpen && selectedSubtitleIds.size === 2 && subtitles.length >= 2) {
            const selectedArray = subtitles.filter(sub => selectedSubtitleIds.has(sub.id));
            if (selectedArray.length === 2) {
                // Ensure they are sorted by their original start time to avoid confusion
                selectedArray.sort((a, b) => srtTimeToMs(a.startTime) - srtTimeToMs(b.startTime));
                setPoint1Srt(selectedArray[0].startTime);
                setPoint2Srt(selectedArray[1].startTime);
                // Actual video times need to be manually entered by the user
                setPoint1Actual('');
                setPoint2Actual('');
            }
        } else if (isOpen && subtitles.length >= 2) {
            // Prefill with first and last if no specific selection or invalid selection
            setPoint1Srt(subtitles[0].startTime);
            setPoint2Srt(subtitles[subtitles.length - 1].startTime);
            setPoint1Actual('');
            setPoint2Actual('');
        } else {
            // Reset fields if not enough subtitles or modal is closed
            setPoint1Srt(''); setPoint1Actual('');
            setPoint2Srt(''); setPoint2Actual('');
        }
    }, [isOpen, selectedSubtitleIds, subtitles]);


    const handleSubmit = () => {
        const s1 = srtTimeToMs(point1Srt);
        const v1 = srtTimeToMs(point1Actual);
        const s2 = srtTimeToMs(point2Srt);
        const v2 = srtTimeToMs(point2Actual);

        if (isNaN(s1) || isNaN(v1) || isNaN(s2) || isNaN(v2) || s1 === s2 || v1 === v2) {
            setNotification({ message: "Error: Invalid time format or points are identical/collinear, preventing accurate calculation.", type: 'error' });
            return;
        }

        const subsToUpdate = applyTo === 'all' ? subtitles : subtitles.filter(sub => selectedSubtitleIds.has(sub.id));
        if (subsToUpdate.length === 0) {
            setNotification({ message: "No subtitles to sync. Select subtitles or choose 'All Subtitles'.", type: 'warning' });
            return;
        }


        withLoading(() => {
            // Linear transformation: newTime = scale * oldTime + offset
            // v = a*s + b
            // v1 = a*s1 + b
            // v2 = a*s2 + b
            // v2 - v1 = a * (s2 - s1) => a = (v2 - v1) / (s2 - s1)
            // b = v1 - a*s1
            
            const scale = (v2 - v1) / (s2 - s1);
            const offset = v1 - scale * s1;

            const newSubtitles = subtitles.map(sub => {
                if (applyTo === 'all' || selectedSubtitleIds.has(sub.id)) {
                    const oldStartTimeMs = srtTimeToMs(sub.startTime);
                    const oldEndTimeMs = srtTimeToMs(sub.endTime);

                    const newStartTimeMs = Math.round(scale * oldStartTimeMs + offset);
                    const newEndTimeMs = Math.round(scale * oldEndTimeMs + offset);
                    
                    // Ensure end time is after start time, and duration is not negative
                    if (newEndTimeMs < newStartTimeMs) {
                        console.warn(`Subtitle ${sub.id} would have negative duration. Skipping adjustment.`);
                        return sub; // Keep original if new times are invalid
                    }

                    return {
                        ...sub,
                        startTime: msToSrtTime(newStartTimeMs),
                        endTime: msToSrtTime(newEndTimeMs),
                    };
                }
                return sub;
            });

            setEditorState(prev => ({ ...prev, subtitles: newSubtitles, hasUnsavedChanges: true }), "edit");
            setNotification({ message: `Successfully synchronized ${subsToUpdate.length} subtitle(s).`, type: 'success' });
            onClose();
        }, "Processing synchronization...");
    };

    if (!isOpen) return null;

    const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-200";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Two-Point Synchronization</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Enter two reference points: one from your current SRT file and the corresponding correct time from your video.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="p1Srt" className={labelClass}>1st Subtitle Time (SRT)</label>
                            <input type="text" id="p1Srt" value={point1Srt} onChange={e => setPoint1Srt(e.target.value)} placeholder="00:00:05,000" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="p1Actual" className={labelClass}>1st Video Time (Actual)</label>
                            <input type="text" id="p1Actual" value={point1Actual} onChange={e => setPoint1Actual(e.target.value)} placeholder="00:00:07,000" className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="p2Srt" className={labelClass}>2nd Subtitle Time (SRT)</label>
                            <input type="text" id="p2Srt" value={point2Srt} onChange={e => setPoint2Srt(e.target.value)} placeholder="01:10:15,000" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="p2Actual" className={labelClass}>2nd Video Time (Actual)</label>
                            <input type="text" id="p2Actual" value={point2Actual} onChange={e => setPoint2Actual(e.target.value)} placeholder="01:10:20,000" className={inputClass} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="applyTo" className={labelClass}>Apply to:</label>
                        <select id="applyTo" value={applyTo} onChange={e => setApplyTo(e.target.value)} className={inputClass}>
                            <option value="all">All Subtitles</option>
                            <option value="selected" disabled={selectedSubtitleIds.size === 0}>Selected Subtitles ({selectedSubtitleIds.size})</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm"
                    >
                        Sync Subtitles
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TwoPointSyncModal;
