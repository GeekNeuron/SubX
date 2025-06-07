// src/components/SubtitleEditor.js
import React from 'react';
import FileUploader from './FileUploader';
import SubtitleItem from './SubtitleItem';
import LoadingOverlay from './LoadingOverlay';
import TwoPointSyncModal from './TwoPointSyncModal';
import VisualTimeline from './VisualTimeline';
import WaveformDisplay from './WaveformDisplay';
import { useSettings } from '../contexts/SettingsContext';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { srtTimeToMs, msToSrtTime, checkSubtitleErrors } from '../utils/srtUtils';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';

function SubtitleEditor({ setGlobalNotification }) {
    const t = useTranslation();
    const { language } = useLanguage();
    const { errorConfig, appearanceConfig } = useSettings();
    const { 
        presentState: editorState, 
        setPresentState: setEditorStateWithUndo, 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        resetState: resetEditorHistory 
    } = useUndoRedo({ subtitles: [], originalFileName: '', hasUnsavedChanges: false });
    
    const { subtitles, originalFileName, hasUnsavedChanges } = editorState;

    const [isLoading, setIsLoading] = React.useState(false); 
    const [findText, setFindText] = React.useState('');
    const [replaceText, setReplaceText] = React.useState('');
    const [shiftAmount, setShiftAmount] = React.useState('');
    const [shiftSelectedAmount, setShiftSelectedAmount] = React.useState('');
    const [setDurationSelectedValue, setSetDurationSelectedValue] = React.useState('');
    const [subtitleErrors, setSubtitleErrors] = React.useState(new Map());
    const [selectedSubtitleIds, setSelectedSubtitleIds] = React.useState(new Set());
    const [draggedItemId, setDraggedItemId] = React.useState(null);
    const [dragOverInfo, setDragOverInfo] = React.useState({ id: null, position: null });
    const [searchTerm, setSearchTerm] = React.useState("");
    const [jumpToLineValue, setJumpToLineValue] = React.useState("");
    const fileInputRef = React.useRef(null);
    const videoFileRef = React.useRef(null);
    const subtitleRowsRef = React.useRef({}); 
    const [activeRowId, setActiveRowId] = React.useState(null); 
    const [editingRowId, setEditingRowId] = React.useState(null); 
    const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false);
    const [videoSrc, setVideoSrc] = React.useState(null);
    const [videoDuration, setVideoDuration] = React.useState(0);
    const [videoCurrentTime, setVideoCurrentTime] = React.useState(0);
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        const baseTitle = t('appTitle');
        let newTitle = originalFileName ? `${originalFileName} - ${baseTitle}` : baseTitle;
        if (hasUnsavedChanges) newTitle = `* ${newTitle}`;
        document.title = newTitle;
    }, [hasUnsavedChanges, originalFileName, t]);

    const withLoading = (fn, loadingMessageKey = 'processing') => {
        setIsLoading(true); setGlobalNotification({ message: t(loadingMessageKey), type: 'info', isLoading: true });
        setTimeout(() => { 
            try { fn(); } catch (error) { console.error("Error during processing:", error); setGlobalNotification({ message: "An error occurred during processing.", type: 'error' }); } 
            finally { setIsLoading(false); } 
        }, 100); 
    };

    const parseSRT = (srtContent) => {
        const subs = [];
        const srtBlockRegex = /(\d+)\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*([\s\S]*?(?=\n\n\d+|\n\n\n\d+|$))/g;
        let match;
        while ((match = srtBlockRegex.exec(srtContent)) !== null) {
            subs.push({ 
                id: crypto.randomUUID(), 
                originalId: parseInt(match[1], 10), 
                startTime: match[2].replace('.',','), 
                endTime: match[3].replace('.',','), 
                text: match[4].trim(),
                translation: ''
            });
        }
        return subs.sort((a, b) => srtTimeToMs(a.startTime) - srtTimeToMs(b.startTime));
    };

    const subtitlesToSRT = (subsArray, source = 'original') => {
        return subsArray.map((sub, index) => {
            const textToUse = source === 'translation' && sub.translation ? sub.translation : sub.text;
            return `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${textToUse}\n`;
        }).join('\n');
    };
    
    const handleFileLoadInternal = (content, fileName) => {
        withLoading(() => {
            const parsedSubtitles = parseSRT(content);
            if (parsedSubtitles.length === 0 && content.trim() !== "") throw new Error("File might be empty or not a valid SRT format.");
            resetEditorHistory({ subtitles: parsedSubtitles, originalFileName: fileName });
            setSubtitleErrors(new Map()); setSelectedSubtitleIds(new Set()); setSearchTerm(""); setActiveRowId(null);
            setGlobalNotification({ message: t('subtitlesLoaded'), type: 'success' });
        }, 'loadingFile');
    };

    const handleVideoFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (videoSrc) URL.revokeObjectURL(videoSrc);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
        if (event.target) event.target.value = null;
    };
    
    const handleVideoMetadata = (e) => setVideoDuration(e.target.duration * 1000);
    const handleVideoTimeUpdate = (e) => setVideoCurrentTime(e.target.currentTime * 1000);

    const handleAddSubtitle = () => {
        const lastSub = subtitles.length > 0 ? subtitles[subtitles.length - 1] : null;
        const newStartTime = lastSub ? msToSrtTime(srtTimeToMs(lastSub.endTime) + 100) : "00:00:00,000";
        const newEndTime = msToSrtTime(srtTimeToMs(newStartTime) + 2000); 
        const newSub = { id: crypto.randomUUID(), startTime: newStartTime, endTime: newEndTime, text: "New text...", translation: "" };
        setEditorStateWithUndo({ ...editorState, subtitles: [...subtitles, newSub] });
        setActiveRowId(newSub.id);
        setTimeout(() => { if (subtitleRowsRef.current[newSub.id]) subtitleRowsRef.current[newSub.id].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 0);
    };

    const handleUpdateSubtitle = (id, updatedPart) => {
        const newSubtitles = subtitles.map(sub => (sub.id === id ? { ...sub, ...updatedPart } : sub));
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
    };

    const handleSave = (type) => {
        if (subtitles.length === 0) { setGlobalNotification({ message: "No subtitles to save.", type: 'info' }); return; }
        const sourceText = (type === 'translation' && appearanceConfig.translationMode) ? 'translation' : 'text';
        const srtContent = subtitlesToSRT(subtitles, sourceText);
        const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
        const link = document.createElement('a');
        let baseName = originalFileName || 'subtitles';
        if (baseName.endsWith('.srt')) baseName = baseName.slice(0, -4);
        const suffix = sourceText === 'translation' ? `.${language}.srt` : '.srt';
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}${suffix}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setGlobalNotification({ message: t('subtitlesSaved'), type: 'success' });
        setEditorStateWithUndo(editorState, "save_action");
    };

    const handleErrorCheck = () => {
        if (subtitles.length === 0) { setGlobalNotification({ message: t('noSubtitlesToCheck'), type: 'info' }); setSubtitleErrors(new Map()); return; }
        const errors = checkSubtitleErrors(subtitles, errorConfig, t);
        setSubtitleErrors(errors);
        if (errors.size > 0) {
            setGlobalNotification({ message: t('errorsFound', errors.size), type: 'warning' });
        } else {
            setGlobalNotification({ message: t('noErrorsFound'), type: 'success' });
        }
    };

    const handleFixLongLines = () => {
        withLoading(() => {
            let fixCount = 0;
            const processedSubs = new Set();
            const newSubtitles = [];

            subtitles.forEach(sub => {
                if (processedSubs.has(sub.id)) return;

                const lines = sub.text.split('\n');
                let isLong = lines.some(line => line.length > errorConfig.MAX_CHARS_PER_LINE);

                if (!isLong) {
                    newSubtitles.push(sub);
                    processedSubs.add(sub.id);
                    return;
                }

                fixCount++;
                const originalStartTimeMs = srtTimeToMs(sub.startTime);
                const originalEndTimeMs = srtTimeToMs(sub.endTime);
                const originalDurationMs = originalEndTimeMs - originalStartTimeMs;
                const totalLength = sub.text.replace(/\n/g, ' ').length;
                
                let newTexts = [];
                let currentLine = "";

                sub.text.split(' ').forEach(word => {
                    const tempLine = currentLine ? `${currentLine} ${word}` : word;
                    if (tempLine.length > errorConfig.MAX_CHARS_PER_LINE && currentLine.length > 0) {
                        newTexts.push(currentLine.trim());
                        currentLine = word;
                    } else {
                        currentLine = tempLine;
                    }
                });
                if (currentLine) newTexts.push(currentLine.trim());

                let accumulatedTime = originalStartTimeMs;
                for (let i = 0; i < newTexts.length; i++) {
                    const textPart = newTexts[i];
                    if (textPart.length === 0) continue;
                    const partRatio = textPart.length / totalLength;
                    const partDuration = Math.max(500, Math.round(originalDurationMs * partRatio));
                    
                    const newStartTime = accumulatedTime;
                    const newEndTime = accumulatedTime + partDuration;
                    
                    newSubtitles.push({
                        ...sub,
                        id: crypto.randomUUID(),
                        text: textPart,
                        translation: '', // Reset translation for new split parts
                        startTime: msToSrtTime(newStartTime),
                        endTime: msToSrtTime(newEndTime),
                    });
                    
                    accumulatedTime = newEndTime;
                }
                processedSubs.add(sub.id);
            });

            if (fixCount > 0) {
                setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
                setGlobalNotification({ message: t('longLinesFixed', fixCount), type: 'success' });
                const newErrors = checkSubtitleErrors(newSubtitles, errorConfig, t);
                setSubtitleErrors(newErrors);
            } else {
                setGlobalNotification({ message: t('noLongLinesToFix'), type: 'info' });
            }
        });
    };

    const handleMergeShortLines = () => {
        withLoading(() => {
            let mergeCount = 0;
            let currentSubtitles = [...subtitles];
            
            // Get IDs of subtitles that are too short
            const shortSubIds = new Set();
            currentSubtitles.forEach(sub => {
                const duration = srtTimeToMs(sub.endTime) - srtTimeToMs(sub.startTime);
                if (duration < errorConfig.MIN_DURATION_MS) {
                    shortSubIds.add(sub.id);
                }
            });

            if(shortSubIds.size === 0) {
                setGlobalNotification({ message: t('noShortLinesToFix'), type: 'info' });
                return;
            }

            // Iterate backwards to safely merge and remove elements
            for (let i = currentSubtitles.length - 1; i > 0; i--) {
                const sub = currentSubtitles[i];
                if (shortSubIds.has(sub.id)) {
                    const prevSub = currentSubtitles[i - 1];
                    
                    // Merge sub with previous sub
                    const mergedSub = {
                        ...prevSub,
                        endTime: sub.endTime,
                        text: `${prevSub.text} ${sub.text}`.trim(),
                        translation: `${prevSub.translation || ''} ${sub.translation || ''}`.trim()
                    };
                    
                    // Replace the two subs with the single merged one
                    currentSubtitles.splice(i - 1, 2, mergedSub);
                    mergeCount++;
                }
            }

            if (mergeCount > 0) {
                setEditorStateWithUndo({ ...editorState, subtitles: currentSubtitles });
                setGlobalNotification({ message: t('shortLinesMerged', mergeCount), type: 'success' });
                const newErrors = checkSubtitleErrors(currentSubtitles, errorConfig, t);
                setSubtitleErrors(newErrors);
            }
        });
    };

    const hasLongLinesError = React.useMemo(() => {
        for (const errors of subtitleErrors.values()) {
            if (errors.some(errKey => errKey.startsWith('ERROR_TYPE_TOO_MANY_CHARS'))) return true;
        }
        return false;
    }, [subtitleErrors]);

    const hasShortDurationError = React.useMemo(() => {
        for (const errors of subtitleErrors.values()) {
            if (errors.some(errKey => errKey.startsWith('ERROR_TYPE_TOO_SHORT'))) return true;
        }
        return false;
    }, [subtitleErrors]);

    // ... (rest of the component, especially the JSX part)
    
    return (
        <div className="container mx-auto p-4">
            {/* ... JSX for FileUploader, Video Loader, Action Buttons ... */}

             <div className="my-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* ... Find/Replace and Shift Times sections ... */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">{t('fixCommonErrors')}</h3>
                        <div className="space-y-3">
                            <button onClick={handleErrorCheck} className="w-full px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow text-sm flex items-center justify-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                {t('checkForErrors')}
                            </button>
                            {subtitleErrors.size > 0 && (
                                <>
                                    {/* ... Other fix buttons like Fix Overlaps ... */}
                                    {hasLongLinesError && (
                                        <button onClick={handleFixLongLines} className="w-full px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md shadow text-sm transition-colors">{t('fixLongLines')}</button>
                                    )}
                                    {hasShortDurationError && (
                                        <button onClick={handleMergeShortLines} className="w-full px-3 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-md shadow text-sm transition-colors">{t('mergeShortLines')}</button>
                                    )}
                                    <button onClick={handleClearErrorMarkers} className="w-full px-3 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-md shadow text-sm transition-colors" title="(Ctrl+Shift+L)">{t('clearErrorMarkers')}</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* ... rest of the JSX ... */}
        </div>
    );
}

export default SubtitleEditor;
