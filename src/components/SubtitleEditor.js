// src/components/SubtitleEditor.js
import React from 'react';
import FileUploader from './FileUploader';
import SubtitleItem from './SubtitleItem';
import LoadingOverlay from './LoadingOverlay';
import TwoPointSyncModal from './TwoPointSyncModal';
import VisualTimeline from './VisualTimeline';
import WaveformDisplay from './WaveformDisplay'; // New component
import { useSettings } from '../contexts/SettingsContext';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { srtTimeToMs, msToSrtTime, checkSubtitleErrors } from '../utils/srtUtils';

// All text is now hardcoded in English
function SubtitleEditor({ openTwoPointSyncModal: openExternalTwoPointSyncModalProp }) {
    const { errorConfig, appearanceConfig } = useSettings();
    const { 
        presentState: editorState, 
        setPresentState: setEditorState, 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        resetState: resetEditorHistory 
    } = useUndoRedo({ subtitles: [], originalFileName: '', hasUnsavedChanges: false });
    
    const { subtitles, originalFileName, hasUnsavedChanges } = editorState;

    const [notification, setNotification] = React.useState({ message: '', type: '', isLoading: false });
    const [showNotification, setShowNotification] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false); // General processing indicator for bulk operations
    
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
    const subtitleRowsRef = React.useRef({}); 
    const [activeRowId, setActiveRowId] = React.useState(null); 
    const [editingRowId, setEditingRowId] = React.useState(null); 
    const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false);

    // Update document title based on unsaved changes and filename
    React.useEffect(() => {
        const baseTitle = "SubX - Subtitle Editor";
        let newTitle = baseTitle;
        if (originalFileName) {
            newTitle = `${originalFileName} - ${baseTitle}`;
        }
        if (hasUnsavedChanges) {
            newTitle = `* ${newTitle}`;
        }
        document.title = newTitle;
    }, [hasUnsavedChanges, originalFileName]);


    // Effect for autosave
    React.useEffect(() => {
        if (appearanceConfig.autosave && hasUnsavedChanges) {
            if (subtitles.length > 0 || originalFileName) {
                localStorage.setItem('subx-autosave-state', JSON.stringify(editorState));
            } else {
                 // If no subs and no filename, but state was marked as unsaved (e.g. after clear all), remove autosave
                localStorage.removeItem('subx-autosave-state');
            }
        }
    }, [editorState, subtitles, originalFileName, appearanceConfig.autosave, hasUnsavedChanges]);

    // Effect for loading autosaved state on initial mount
    React.useEffect(() => {
        const autoSavedStateString = localStorage.getItem('subx-autosave-state');
        if (autoSavedStateString) {
            try {
                const autoSavedState = JSON.parse(autoSavedStateString);
                resetEditorHistory({...autoSavedState, hasUnsavedChanges: true }); // Mark as unsaved initially after restore
                displayNotification("Restored auto-saved session. Save to confirm changes.", "info");
            } catch (e) {
                console.error("Failed to parse autosaved state:", e);
                localStorage.removeItem('subx-autosave-state');
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Notification display logic
    const displayNotification = (newMessage, newType, isLoadingFlag = false) => {
        setNotification({ message: newMessage, type: newType, isLoading: isLoadingFlag });
        if (newMessage) {
            setShowNotification(true);
        } else {
            setShowNotification(false);
        }
    };

    React.useEffect(() => {
        let clearTimer;
        if (notification.message && !notification.isLoading) { 
            setShowNotification(true);
            const timer = setTimeout(() => {
                setShowNotification(false); 
                clearTimer = setTimeout(() => {
                    setNotification({ message: '', type: '', isLoading: false });
                }, 300); 
                 return () => clearTimeout(clearTimer);
            }, 2700); 
            return () => clearTimeout(timer);
        } else if (!notification.message) {
            setShowNotification(false);
        }
    }, [notification]);

    // SRT Parsing logic
    const parseSRT = (srtContent) => {
        const subs = [];
        const srtBlockRegex = /(\d+)\s*(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*([\s\S]*?(?=\n\n\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}|\n\n\n\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}|$))/g;
        let match;
        while ((match = srtBlockRegex.exec(srtContent)) !== null) {
            subs.push({
                id: crypto.randomUUID(),
                originalId: parseInt(match[1], 10),
                startTime: match[2],
                endTime: match[3],
                text: match[4].trim()
            });
        }
         if (subs.length === 0 && srtContent.trim() !== "") {
            const simplerRegex = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*([\s\S]+?(?=\n\d{2}:\d{2}:\d{2},\d{3}|$|\n\n[^\d]|$))/g;
            let simpleMatch;
            let tempId = 1;
            while ((simpleMatch = simplerRegex.exec(srtContent)) !== null) {
                 subs.push({
                    id: crypto.randomUUID(),
                    originalId: tempId++,
                    startTime: simpleMatch[1],
                    endTime: simpleMatch[2],
                    text: simpleMatch[3].trim()
                });
            }
        }
        return subs.sort((a, b) => srtTimeToMs(a.startTime) - srtTimeToMs(b.startTime));
    };

    const subtitlesToSRT = (subsArray) => {
        return subsArray
            .map((sub, index) => `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}\n`)
            .join('\n');
    };
    
    const handleFileLoadInternal = (content, fileName) => {
        setIsLoading(true);
        displayNotification('Loading file...', 'info', true); 
    
        setTimeout(() => { 
            try {
                const parsedSubtitles = parseSRT(content);
                if (parsedSubtitles.length === 0 && content.trim() !== "") {
                    throw new Error("File might be empty or not a valid SRT format.");
                }
                resetEditorHistory({ subtitles: parsedSubtitles, originalFileName: fileName, hasUnsavedChanges: false });
                setSubtitleErrors(new Map()); 
                setSelectedSubtitleIds(new Set()); 
                setSearchTerm("");
                setActiveRowId(null);
                displayNotification('Subtitles loaded successfully.', 'success');
            } catch (error) {
                console.error("Error parsing SRT:", error);
                displayNotification(`Error: Invalid SRT file format. ${error.message}`, 'error');
                resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false });
                setSubtitleErrors(new Map()); 
                setSelectedSubtitleIds(new Set()); 
                setSearchTerm("");
                setActiveRowId(null);
            } finally {
                setIsLoading(false);
            }
        }, 500); 
    };
    
    const withLoading = (fn, loadingMessage = 'Processing...') => {
        setIsLoading(true);
        displayNotification(loadingMessage, 'info', true); 
        setTimeout(() => { 
            try {
                fn(); 
                setEditorState(prev => ({...prev, hasUnsavedChanges: true}), "standard_edit");
            } catch (error) {
                console.error("Error during processing:", error);
                displayNotification("An error occurred during processing.", 'error');
            } finally {
                setIsLoading(false);
            }
        }, 100); 
    };

    const handleAddSubtitle = () => {
        const lastSub = subtitles[subtitles.length -1];
        const newStartTime = lastSub ? msToSrtTime(srtTimeToMs(lastSub.endTime) + 100) : "00:00:00,000";
        const newEndTime = msToSrtTime(srtTimeToMs(newStartTime) + 2000); 
        const newSub = { 
            id: crypto.randomUUID(), 
            startTime: newStartTime, 
            endTime: newEndTime, 
            text: "New subtitle..." 
        };
        setEditorState({ ...editorState, subtitles: [...subtitles, newSub] }, "add");
        setActiveRowId(newSub.id); 
        setTimeout(() => {
            if (subtitleRowsRef.current[newSub.id]) {
                subtitleRowsRef.current[newSub.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 0);
    };

    const handleUpdateSubtitle = (id, updatedPart) => {
        const newSubtitles = subtitles.map(sub => sub.id === id ? { ...sub, ...updatedPart } : sub);
        setEditorState({ ...editorState, subtitles: newSubtitles });
    };

    const handleDeleteSubtitle = (id) => {
        const newSubtitles = subtitles.filter(sub => sub.id !== id);
        setEditorState({ ...editorState, subtitles: newSubtitles });
        setSelectedSubtitleIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        if(activeRowId === id) setActiveRowId(null);
    };
    
    const handleSaveSubtitles = React.useCallback(() => {
        if (subtitles.length === 0) {
            displayNotification("No subtitles to save.", 'info');
            return;
        }
        const srtContent = subtitlesToSRT(subtitles);
        const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
        const link = document.createElement('a');
        const fileNameToSave = originalFileName || 'subtitles.srt';
        link.href = URL.createObjectURL(blob);
        link.download = fileNameToSave.endsWith('.srt') ? fileNameToSave : `${fileNameToSave}.srt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        displayNotification('Subtitles saved successfully.', 'success');
        setEditorState(prev => ({...prev, hasUnsavedChanges: false}), "save"); 
    }, [subtitles, originalFileName, displayNotification, setEditorState]);


    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all subtitles? This cannot be undone.')) {
            resetEditorHistory({ subtitles: [], originalFileName: editorState.originalFileName, hasUnsavedChanges: (subtitles.length > 0) });
            setSubtitleErrors(new Map());
            setSelectedSubtitleIds(new Set());
            setSearchTerm("");
            setActiveRowId(null);
            displayNotification("All subtitles cleared.", 'info');
        }
    };
    
    const clearSubtitlesForUploader = () => {
        resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false });
        setSubtitleErrors(new Map());
        setSelectedSubtitleIds(new Set());
        setSearchTerm("");
        setActiveRowId(null);
    };

    const handleReplaceAll = () => withLoading(() => {
        if (!findText) {
            displayNotification('Text not found.', 'error');
            return;
        }
        let count = 0;
        const newSubtitles = subtitles.map(sub => {
            if (sub.text.includes(findText)) {
                count++;
                return { ...sub, text: sub.text.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText) };
            }
            return sub;
        });
        if (count > 0) {
            setEditorState({ ...editorState, subtitles: newSubtitles });
            displayNotification(`Replaced ${count} occurrence(s) of "${findText}".`, 'success');
        } else {
            displayNotification(`No occurrences of "${findText}" found.`, 'info');
        }
    });

    const handleCountOccurrences = () => {
        if (!findText) {
            displayNotification('Text not found.', 'error');
            return;
        }
        let count = 0;
        subtitles.forEach(sub => {
            const occurrencesInSub = (sub.text.match(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            count += occurrencesInSub;
        });
        displayNotification(`${count} occurrence(s) of "${findText}" found.`, 'info');
    };

    const handleShiftTimes = () => withLoading(() => {
        const ms = parseInt(shiftAmount, 10);
        if (isNaN(ms)) {
            displayNotification('Invalid shift amount. Please enter a number.', 'error');
            return;
        }
        const newSubtitles = subtitles.map(sub => ({
            ...sub,
            startTime: msToSrtTime(srtTimeToMs(sub.startTime) + ms),
            endTime: msToSrtTime(srtTimeToMs(sub.endTime) + ms)
        }));
        setEditorState({ ...editorState, subtitles: newSubtitles });
        displayNotification(`All subtitles shifted by ${ms}ms.`, 'success');
    });
    
    const handleSplitSubtitle = (id) => {
        const subIndex = subtitles.findIndex(s => s.id === id);
        if (subIndex === -1) return;
        const subToSplit = subtitles[subIndex];

        if (subToSplit.text.trim().length < 2) {
            displayNotification('Cannot split empty or very short text.', 'warning');
            return;
        }
        let splitPoint = Math.floor(subToSplit.text.length / 2);
        const firstNewline = subToSplit.text.indexOf('\n');
        if (firstNewline !== -1 && firstNewline > 0 && firstNewline < subToSplit.text.length -1) {
            splitPoint = firstNewline;
        }
        const text1 = subToSplit.text.substring(0, splitPoint).trim();
        const text2 = subToSplit.text.substring(splitPoint).trim();
        if (!text1 || !text2) {
             displayNotification('Cannot split empty or very short text.', 'warning');
             return;
        }
        const originalStartTimeMs = srtTimeToMs(subToSplit.startTime);
        const originalEndTimeMs = srtTimeToMs(subToSplit.endTime);
        const originalDurationMs = originalEndTimeMs - originalStartTimeMs;
        if (originalDurationMs <= 100) { 
            displayNotification("Subtitle duration too short to split meaningfully.", 'warning');
            return;
        }
        let duration1Ratio = text1.length / (text1.length + text2.length);
        if (duration1Ratio < 0.1 || duration1Ratio > 0.9) duration1Ratio = 0.5; 
        const splitTimeMs = originalStartTimeMs + Math.floor(originalDurationMs * duration1Ratio);
        const updatedSub1 = { ...subToSplit, text: text1, endTime: msToSrtTime(splitTimeMs) };
        const newSub2 = { id: crypto.randomUUID(), startTime: msToSrtTime(splitTimeMs), endTime: subToSplit.endTime, text: text2 };
        const newSubtitles = [...subtitles];
        newSubtitles.splice(subIndex, 1, updatedSub1, newSub2);
        setEditorState({ ...editorState, subtitles: newSubtitles });
        displayNotification('Subtitle split.', 'success');
    };

    const handleMergeNextSubtitle = (id) => {
        const subIndex = subtitles.findIndex(s => s.id === id);
        if (subIndex === -1 || subIndex >= subtitles.length - 1) {
            displayNotification('Cannot merge the last subtitle.', 'warning');
            return;
        }
        const sub1 = subtitles[subIndex];
        const sub2 = subtitles[subIndex + 1];
        const mergedSub = { ...sub1, text: `${sub1.text.trim()} ${sub2.text.trim()}`.trim(), endTime: sub2.endTime };
        const newSubtitles = [...subtitles];
        newSubtitles.splice(subIndex, 2, mergedSub);
        setEditorState({ ...editorState, subtitles: newSubtitles });
        displayNotification('Subtitles merged.', 'success');
    };
    
    const handleErrorCheck = () => {
        if (subtitles.length === 0) {
            displayNotification("No subtitles to check.", 'info');
            setSubtitleErrors(new Map());
            return;
        }
        // Pass a dummy 't' function for now since translations are hardcoded
        const dummyT = (key, ...args) => {
            let str = key;
            if (args.length > 0 && typeof key === 'function') return key(...args); // Should not happen with current error strings
            args.forEach((arg, i) => str = str.replace(`\${${i}}`, arg));
            return str;
        };
        const errors = checkSubtitleErrors(subtitles, errorConfig, dummyT);
        setSubtitleErrors(errors);
        if (errors.size > 0) {
            displayNotification(`${errors.size} error(s) found. See details in table.`, 'warning');
        } else {
            displayNotification('No common errors found.', 'success');
        }
    };

    const handleFixOverlaps = () => withLoading(() => {
        let fixedCount = 0;
        const newSubtitles = [...subtitles];
        for (let i = 0; i < newSubtitles.length - 1; i++) {
            const currentSub = newSubtitles[i];
            const nextSub = newSubtitles[i+1];
            const currentEndTimeMs = srtTimeToMs(currentSub.endTime);
            const nextStartTimeMs = srtTimeToMs(nextSub.startTime);

            if (currentEndTimeMs > nextStartTimeMs) {
                const newCurrentEndTimeMs = nextStartTimeMs - errorConfig.OVERLAP_FIX_GAP_MS;
                if (newCurrentEndTimeMs > srtTimeToMs(currentSub.startTime)) { 
                    newSubtitles[i] = { ...currentSub, endTime: msToSrtTime(newCurrentEndTimeMs) };
                    fixedCount++;
                }
            }
        }
        if (fixedCount > 0) {
            setEditorState({ ...editorState, subtitles: newSubtitles });
            displayNotification(`${fixedCount} overlap(s) fixed.`, 'success');
            const dummyT = (key) => key; // Dummy t function for error check
            const newErrors = checkSubtitleErrors(newSubtitles, errorConfig, dummyT);
            setSubtitleErrors(newErrors);
        } else {
            displayNotification('No overlaps found to fix.', 'info');
        }
    });
    
    const handleFixDurations = () => withLoading(() => {
        let fixedCount = 0;
        const newSubtitles = subtitles.map((sub, index) => {
            let newEndTimeStr = sub.endTime;
            const startTimeMs = srtTimeToMs(sub.startTime);
            const endTimeMs = srtTimeToMs(sub.endTime);
            let durationMs = endTimeMs - startTimeMs;

            if (durationMs >=0 && durationMs < errorConfig.MIN_DURATION_MS) {
                let targetEndTimeMs = startTimeMs + errorConfig.MIN_DURATION_MS;
                if (index < subtitles.length - 1) {
                    const nextStartTimeMs = srtTimeToMs(subtitles[index+1].startTime);
                    if (targetEndTimeMs >= nextStartTimeMs) {
                        targetEndTimeMs = nextStartTimeMs - errorConfig.OVERLAP_FIX_GAP_MS;
                    }
                }
                if (targetEndTimeMs > startTimeMs) { 
                    newEndTimeStr = msToSrtTime(targetEndTimeMs);
                    if (newEndTimeStr !== sub.endTime) fixedCount++;
                }
            } else if (durationMs > errorConfig.MAX_DURATION_MS) {
                newEndTimeStr = msToSrtTime(startTimeMs + errorConfig.MAX_DURATION_MS);
                 if (newEndTimeStr !== sub.endTime) fixedCount++;
            }
            return { ...sub, endTime: newEndTimeStr };
        });
        if (fixedCount > 0) {
            setEditorState({ ...editorState, subtitles: newSubtitles });
            displayNotification(`${fixedCount} duration issue(s) fixed.`, 'success');
            const dummyT = (key) => key; // Dummy t function
            const newErrors = checkSubtitleErrors(newSubtitles, errorConfig, dummyT);
            setSubtitleErrors(newErrors);
        } else {
            displayNotification('No duration issues found to fix.', 'info');
        }
    });


    const handleClearErrorMarkers = () => {
        setSubtitleErrors(new Map());
        displayNotification('Error markers cleared.', 'info');
    };
    
    const handleSelectSubtitle = (id) => {
        setSelectedSubtitleIds(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
        setActiveRowId(id); 
    };

    const handleSelectAllSubtitles = (event) => {
        if (event.target.checked) {
            setSelectedSubtitleIds(new Set(subtitles.map(sub => sub.id)));
        } else {
            setSelectedSubtitleIds(new Set());
        }
        setActiveRowId(null); 
    };

    const handleDeleteSelected = () => withLoading(() => {
        if (selectedSubtitleIds.size === 0) return;
        const newSubtitles = subtitles.filter(sub => !selectedSubtitleIds.has(sub.id));
        setEditorState({ ...editorState, subtitles: newSubtitles, hasUnsavedChanges: true });
        displayNotification(`${selectedSubtitleIds.size} subtitle(s) deleted.`, 'success');
        setSelectedSubtitleIds(new Set());
        setActiveRowId(null);
    });
    
    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('application/subx-subtitle-id', id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItemId(id);
    };

    const handleDragOver = (e, targetId, targetElement) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === targetId) {
            setDragOverInfo({ id: null, position: null });
            return;
        }
        const rect = targetElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const position = e.clientY < midpoint ? 'before' : 'after';
        setDragOverInfo({ id: targetId, position });
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        const dId = e.dataTransfer.getData('application/subx-subtitle-id');
        if (!dId || (dId === targetId && targetId !== null)) { 
            setDragOverInfo({ id: null, position: null });
            setDraggedItemId(null);
            return;
        }

        const currentSubs = [...subtitles];
        const draggedItemIndex = currentSubs.findIndex(sub => sub.id === dId);
        if (draggedItemIndex === -1) return; 

        const draggedItem = currentSubs[draggedItemIndex];
        const remainingSubs = currentSubs.filter(sub => sub.id !== dId);
        let targetItemIndex = remainingSubs.findIndex(sub => sub.id === targetId);

        if (targetId === null) { 
            remainingSubs.push(draggedItem);
        } else if (targetItemIndex !== -1) {
            if (dragOverInfo.position === 'after') {
                targetItemIndex++;
            }
            remainingSubs.splice(targetItemIndex, 0, draggedItem);
        } else {
            setDragOverInfo({ id: null, position: null });
            setDraggedItemId(null);
            return;
        }
        
        setEditorState({ ...editorState, subtitles: remainingSubs, hasUnsavedChanges: true });
        setSelectedSubtitleIds(new Set()); 
        setDragOverInfo({ id: null, position: null });
        setDraggedItemId(null);
        setActiveRowId(dId); 
    };

    const handleDragEnd = (e) => {
        setDraggedItemId(null);
        setDragOverInfo({ id: null, position: null });
    };

    const handleJumpToLine = () => {
        const lineNum = parseInt(jumpToLineValue, 10);
        if (isNaN(lineNum) || lineNum < 1 || lineNum > filteredSubtitles.length) {
            displayNotification(`Line number out of range (1-${filteredSubtitles.length}).`, 'error');
            return;
        }
        const targetSub = filteredSubtitles[lineNum - 1];
        if (targetSub) {
            const targetSubId = targetSub.id;
            const targetElement = subtitleRowsRef.current[targetSubId];
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setActiveRowId(targetSubId); 
            setSelectedSubtitleIds(new Set([targetSubId]));
        }
        setJumpToLineValue("");
    };
    
    const handleShiftSelected = () => withLoading(() => {
        const ms = parseInt(shiftSelectedAmount, 10);
        if (isNaN(ms) || selectedSubtitleIds.size === 0) {
            displayNotification(selectedSubtitleIds.size === 0 ? 'No subtitle selected for this action.' : 'Invalid shift amount. Please enter a number.', 'error');
            return;
        }
        const newSubtitles = subtitles.map(sub => {
            if (selectedSubtitleIds.has(sub.id)) {
                return {
                    ...sub,
                    startTime: msToSrtTime(srtTimeToMs(sub.startTime) + ms),
                    endTime: msToSrtTime(srtTimeToMs(sub.endTime) + ms),
                };
            }
            return sub;
        });
        setEditorState({ ...editorState, subtitles: newSubtitles, hasUnsavedChanges: true });
        displayNotification(`${selectedSubtitleIds.size} selected subtitle(s) shifted by ${ms}ms.`, 'success');
        setShiftSelectedAmount('');
    });
    
    const handleSetDurationForSelected = () => withLoading(() => {
        const newDurationMs = parseInt(setDurationSelectedValue, 10);
        if (isNaN(newDurationMs) || newDurationMs < 0 || selectedSubtitleIds.size === 0) {
            displayNotification(selectedSubtitleIds.size === 0 ? 'No subtitle selected for this action.' : 'Invalid duration value. Please enter a non-negative number.', 'error');
            return;
        }
        const newSubtitles = subtitles.map(sub => {
            if (selectedSubtitleIds.has(sub.id)) {
                const startTimeMs = srtTimeToMs(sub.startTime);
                return { ...sub, endTime: msToSrtTime(startTimeMs + newDurationMs) };
            }
            return sub;
        });
        setEditorState({ ...editorState, subtitles: newSubtitles, hasUnsavedChanges: true });
        displayNotification(`Duration set for ${selectedSubtitleIds.size} selected subtitle(s).`, 'success');
        setSetDurationSelectedValue('');
    });

    const handleToggleEditRow = (rowId, isEditingNow) => {
        setEditingRowId(isEditingNow ? rowId : null);
    }; 

    React.useEffect(() => {
        const handleKeyDown = (event) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

            if (isInputFocused && event.key !== 'Escape') {
                 if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { 
                    event.preventDefault();
                    handleSaveSubtitles();
                }
                return;
            }

            let currentIndex = -1;
            if (activeRowId && filteredSubtitles) { // Ensure filteredSubtitles is defined
                currentIndex = filteredSubtitles.findIndex(sub => sub.id === activeRowId);
            }

            if (event.ctrlKey || event.metaKey) { 
                switch (event.key.toLowerCase()) {
                    case 'z': event.preventDefault(); if (canUndo) undo(); break;
                    case 'y': event.preventDefault(); if (canRedo) redo(); break;
                    case 's': event.preventDefault(); handleSaveSubtitles(); break;
                    case 'n': event.preventDefault(); handleAddSubtitle(); break;
                    case 'o': event.preventDefault(); if (fileInputRef.current) fileInputRef.current.click(); break;
                    case 'l': if (event.shiftKey) { event.preventDefault(); handleClearErrorMarkers(); } break;
                    case 'a': event.preventDefault(); handleSelectAllSubtitles({ target: { checked: selectedSubtitleIds.size !== subtitles.length }}); break;
                    case 'd': 
                        if (activeRowId && selectedSubtitleIds.size === 1 && selectedSubtitleIds.has(activeRowId)) {
                            event.preventDefault();
                            handleDeleteSubtitle(activeRowId);
                        }
                        break;
                    default: break;
                }
                if (event.shiftKey) {
                    switch (event.key.toLowerCase()) {
                        case 's': 
                            if (activeRowId && selectedSubtitleIds.size === 1 && selectedSubtitleIds.has(activeRowId)) {
                                event.preventDefault();
                                handleSplitSubtitle(activeRowId);
                            }
                            break;
                        case 'm': 
                            if (activeRowId && selectedSubtitleIds.size === 1 && selectedSubtitleIds.has(activeRowId) && currentIndex < filteredSubtitles.length -1) {
                                event.preventDefault();
                                handleMergeNextSubtitle(activeRowId);
                            }
                            break;
                        default: break;
                    }
                }
            } else { 
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        if (filteredSubtitles.length > 0) {
                            const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, filteredSubtitles.length - 1);
                            if (filteredSubtitles[nextIndex]) {
                                const nextSubId = filteredSubtitles[nextIndex].id;
                                setActiveRowId(nextSubId);
                                setSelectedSubtitleIds(new Set([nextSubId])); 
                                if (subtitleRowsRef.current[nextSubId]) {
                                    subtitleRowsRef.current[nextSubId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }
                            }
                        }
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        if (filteredSubtitles.length > 0) {
                            const prevIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
                             if (filteredSubtitles[prevIndex]) {
                                const prevSubId = filteredSubtitles[prevIndex].id;
                                setActiveRowId(prevSubId);
                                setSelectedSubtitleIds(new Set([prevSubId])); 
                                if (subtitleRowsRef.current[prevSubId]) {
                                    subtitleRowsRef.current[prevSubId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }
                            }
                        }
                        break;
                    case 'Enter':
                        if (activeRowId && selectedSubtitleIds.size === 1 && selectedSubtitleIds.has(activeRowId)) {
                            event.preventDefault();
                            handleToggleEditRow(activeRowId, editingRowId !== activeRowId);
                        }
                        break;
                    case 'Delete':
                        if (selectedSubtitleIds.size > 0 && !isInputFocused) { 
                            event.preventDefault();
                            handleDeleteSelected();
                        }
                        break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // Adding all dependencies, including `filteredSubtitles`
    }, [undo, redo, canUndo, canRedo, handleSaveSubtitles, editorState, handleAddSubtitle, handleClearErrorMarkers, selectedSubtitleIds, subtitles.length, handleDeleteSelected, filteredSubtitles, activeRowId, editingRowId, handleSplitSubtitle, handleMergeNextSubtitle, errorConfig, appearanceConfig]);


    // Define filteredSubtitles before the useEffect that uses it
    const filteredSubtitles = React.useMemo(() => {
        if (!searchTerm) return subtitles;
        return subtitles.filter(sub => 
            sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.startTime.includes(searchTerm) ||
            sub.endTime.includes(searchTerm)
        );
    }, [subtitles, searchTerm]);
    
    const hasDetectedErrors = subtitleErrors.size > 0;
    const numSelected = selectedSubtitleIds.size;
    const allSelected = subtitles.length > 0 && numSelected === subtitles.length && filteredSubtitles.length === subtitles.length;

    const totalTimelineDuration = React.useMemo(() => {
        if (subtitles.length === 0) return 60000; 
        const lastSub = subtitles[subtitles.length - 1];
        return lastSub ? srtTimeToMs(lastSub.endTime) + 5000 : 60000; 
    }, [subtitles]);
    
    const activeSubtitleForWaveform = React.useMemo(() => {
        if (activeRowId) {
            return subtitles.find(sub => sub.id === activeRowId);
        }
        if (selectedSubtitleIds.size === 1) {
            const firstSelectedId = Array.from(selectedSubtitleIds)[0];
            return subtitles.find(sub => sub.id === firstSelectedId);
        }
        return null;
    }, [subtitles, activeRowId, selectedSubtitleIds]);


    return (
        <div className="container mx-auto p-4">
            <LoadingOverlay isActive={isLoading} message={notification.isLoading ? notification.message : "Processing..."} />
            
            <div className={`fixed top-20 right-4 rtl:right-auto rtl:left-4 p-4 rounded-md shadow-lg z-[100] transition-all duration-300 ease-out ${showNotification && !notification.isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'} ${notification.type === 'success' ? 'bg-green-500 text-white' : ''} ${notification.type === 'error' ? 'bg-red-500 text-white' : ''} ${notification.type === 'info' ? 'bg-sky-500 text-white' : ''} ${notification.type === 'warning' ? 'bg-yellow-500 text-black' : ''} `}>
                {notification.message}
            </div>

            <FileUploader 
                onFileLoad={handleFileLoadInternal} 
                setNotification={displayNotification} 
                clearSubtitles={clearSubtitlesForUploader}
                fileInputRef={fileInputRef}
            />

            <div className="my-4 flex flex-wrap gap-2 items-center">
                <button onClick={undo} disabled={!canUndo} className="px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity" title="Undo (Ctrl+Z)"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg> Undo</button>
                <button onClick={redo} disabled={!canRedo} className="px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity" title="Redo (Ctrl+Y)"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" /></svg> Redo</button>
                <span className="border-l border-slate-300 dark:border-slate-600 h-8 mx-2"></span>
                <button onClick={handleAddSubtitle} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow text-sm transition-colors" title="Add New Subtitle (Ctrl+N)">Add New</button>
                <button onClick={handleSaveSubtitles} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow text-sm transition-colors" title="Save Subtitles (Ctrl+S)">
                    Save Subtitles
                    {hasUnsavedChanges && <span className="ml-1 text-red-300">*</span>}
                </button>
                <button onClick={handleClearAll} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow text-sm transition-colors">Clear All</button>
                <button onClick={() => setIsTwoPointSyncModalOpen(true)} className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-md shadow text-sm transition-colors">Two-Point Sync</button>
            </div>
            
            {numSelected > 0 && (
                <div className="my-4 p-3 bg-sky-100 dark:bg-sky-800 rounded-lg shadow space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-end md:justify-between transition-all duration-300 ease-out">
                    <div className="flex-grow"><span className="text-sm text-sky-700 dark:text-sky-200 block mb-1 md:mb-0">{numSelected} selected</span></div>
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                        <input type="number" value={shiftSelectedAmount} onChange={e => setShiftSelectedAmount(e.target.value)} placeholder="Shift selected by (ms)" className="p-2 text-sm rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-40" />
                        <button onClick={handleShiftSelected} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow text-xs flex items-center justify-center transition-colors">Shift Selected</button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch mt-2 sm:mt-0 md:ml-4">
                        <input type="number" value={setDurationSelectedValue} onChange={e => setSetDurationSelectedValue(e.target.value)} placeholder="Set duration for selected (ms)" className="p-2 text-sm rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-48" />
                        <button onClick={handleSetDurationForSelected} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow text-xs flex items-center justify-center transition-colors">Set Duration</button>
                    </div>
                    <button onClick={handleDeleteSelected} className="mt-2 md:mt-0 md:ml-4 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow text-xs flex items-center transition-colors self-start md:self-end" title="Delete Selected (Delete)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="my-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div><h3 className="text-lg font-semibold mb-2">Find and Replace</h3><div className="space-y-3"><input type="text" value={findText} onChange={e => setFindText(e.target.value)} placeholder="Text to find..." className="w-full p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500"/><input type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Text to replace with..." className="w-full p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500"/><div className="flex gap-2"><button onClick={handleCountOccurrences} className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow text-sm transition-colors">Count Occurrences</button><button onClick={handleReplaceAll} className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow text-sm transition-colors">Replace All</button></div></div></div>
                    <div><h3 className="text-lg font-semibold mb-2">Shift Times</h3><div className="space-y-3"><input type="number" value={shiftAmount} onChange={e => setShiftAmount(e.target.value)} placeholder="Shift all by (ms)" className="w-full p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500"/><button onClick={handleShiftTimes} className="w-full px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md shadow text-sm transition-colors">Apply Shift</button></div></div>
                    <div><h3 className="text-lg font-semibold mb-2">Fix Common Errors</h3><div className="space-y-3"><button onClick={handleErrorCheck} className="w-full px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow text-sm flex items-center justify-center transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>Check for Errors</button>{hasDetectedErrors && (<><button onClick={handleFixOverlaps} className="w-full px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md shadow text-sm transition-colors">Fix Overlaps</button><button onClick={handleFixDurations} className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow text-sm transition-colors">Fix Durations</button><button onClick={handleClearErrorMarkers} className="w-full px-3 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-md shadow text-sm transition-colors" title="Clear Error Markers (Ctrl+Shift+L)">Clear Error Markers</button></>)}</div></div>
                </div>
            </div>
            
            {/* Visual Timeline */}
            {subtitles.length > 0 && (
                <VisualTimeline 
                    subtitles={subtitles} 
                    onSelectSubtitle={(subId) => {
                        setActiveRowId(subId);
                        setSelectedSubtitleIds(new Set([subId]));
                        if (subtitleRowsRef.current[subId]) {
                            subtitleRowsRef.current[subId].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }}
                    activeRowId={activeRowId}
                    totalDuration={totalTimelineDuration}
                    subtitleErrors={subtitleErrors}
                />
            )}

            {/* Conceptual Waveform for Active/Selected Subtitle */}
            <WaveformDisplay subtitle={activeSubtitleForWaveform} isActive={!!activeSubtitleForWaveform} />


            {subtitles.length === 0 && !isLoading && (
                <div className="my-8 text-center text-slate-500 dark:text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-lg">No subtitles loaded yet. Upload an .srt file to get started!</p>
                </div>
            )}

            {subtitles.length > 0 && (
                <>
                    <div className="my-4 flex flex-col sm:flex-row gap-2 items-stretch">
                        <div className="relative flex-grow">
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search in subtitles..."
                                className={`w-full p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 ${searchTerm ? 'pr-8' : '' }`}
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm("")} 
                                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="Clear Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <input 
                                type="number"
                                value={jumpToLineValue}
                                onChange={(e) => setJumpToLineValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJumpToLine()}
                                placeholder="Line No."
                                className="w-24 p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-center"
                                min="1"
                            />
                            <button 
                                onClick={handleJumpToLine}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md shadow text-sm transition-colors"
                            >
                                Jump
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg">
                        <h2 className="text-xl font-semibold p-4 border-b border-slate-200 dark:border-slate-700">Subtitle List</h2>
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-20 text-center align-middle">
                                        <input 
                                            type="checkbox" 
                                            checked={allSelected} 
                                            onChange={handleSelectAllSubtitles} 
                                            className="form-checkbox h-4 w-4 text-sky-600 border-slate-400 rounded focus:ring-sky-500 cursor-pointer"
                                            title="Select All (Ctrl+A)"
                                        />
                                    </th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-40">Start Time</th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-40">End Time</th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Text</th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-48 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody 
                                className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700"
                                onDragOver={(e) => e.preventDefault()} 
                                onDrop={(e) => handleDrop(e, null)} 
                            >
                                {filteredSubtitles.map((sub, index) => (
                                    <SubtitleItem
                                        key={sub.id}
                                        subtitle={sub}
                                        index={subtitles.findIndex(s => s.id === sub.id)} 
                                        itemRef={el => { subtitleRowsRef.current[sub.id] = el; }} 
                                        onUpdate={handleUpdateSubtitle}
                                        onDelete={handleDeleteSubtitle}
                                        onSplit={handleSplitSubtitle}
                                        onMergeNext={handleMergeNextSubtitle}
                                        language="en" // Hardcoded to English
                                        isLastItem={index === filteredSubtitles.length - 1}
                                        errors={subtitleErrors.get(sub.id) || []}
                                        isSelected={selectedSubtitleIds.has(sub.id)}
                                        onSelect={handleSelectSubtitle}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onDragEnd={handleDragEnd}
                                        isBeingDragged={draggedItemId === sub.id}
                                        dragOverPosition={dragOverInfo.id === sub.id ? dragOverInfo.position : null}
                                        isActiveRow={activeRowId === sub.id}
                                        onToggleEdit={handleToggleEditRow}
                                        editingRowId={editingRowId} // Pass this down
                                        searchTerm={searchTerm}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
             <TwoPointSyncModal
                isOpen={isTwoPointSyncModalOpen}
                onClose={() => setIsTwoPointSyncModalOpen(false)}
                subtitles={subtitles}
                selectedSubtitleIds={selectedSubtitleIds}
                onSync={(syncedSubs) => {
                    setEditorState(prev => ({ ...prev, subtitles: syncedSubs, hasUnsavedChanges: true }), "edit");
                    displayNotification(`Successfully synchronized ${selectedSubtitleIds.size > 0 ? selectedSubtitleIds.size : subtitles.length} subtitle(s).`, 'success');
                }}
                setNotification={displayNotification}
                withLoading={withLoading}
            />
        </div>
    );
}
export default SubtitleEditor;

// --- File: src/App.js ---
import React from 'react';
import Header from './components/Header';
import SubtitleEditor from './components/SubtitleEditor';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
// Removed LanguageProvider import
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// All text is now hardcoded in English in the components
function AppContent() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false);

  const [notification, setNotification] = React.useState({ message: '', type: '' });
  const [showModalNotification, setShowModalNotification] = React.useState(false);

  React.useEffect(() => {
    if (notification.message && (isSettingsModalOpen || isHelpModalOpen || isTwoPointSyncModalOpen)) {
      setShowModalNotification(true);
      const timer = setTimeout(() => {
        setShowModalNotification(false);
        const clearMessageTimer = setTimeout(() => {
          setNotification({ message: '', type: '' });
        }, 300); 
        return () => clearTimeout(clearMessageTimer);
      }, 2700); 
      return () => clearTimeout(timer);
    }
  }, [notification, isSettingsModalOpen, isHelpModalOpen, isTwoPointSyncModalOpen]);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(registration => {
            console.log('SubX SW registered: ', registration.scope);
          })
          .catch(error => {
            console.log('SubX SW registration failed: ', error);
          });
      });
    }
  }, []);
  
  const openTwoPointSyncModal = () => setIsTwoPointSyncModalOpen(true);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header 
        onSettingsClick={() => setIsSettingsModalOpen(true)} 
        onHelpClick={() => setIsHelpModalOpen(true)}
      />
      <main className="flex-grow">
        <SubtitleEditor 
          openTwoPointSyncModal={openTwoPointSyncModal}
        />
      </main>
      <Footer />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
        setNotification={setNotification} 
      />
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      <TwoPointSyncModal
        isOpen={isTwoPointSyncModalOpen}
        onClose={() => setIsTwoPointSyncModalOpen(false)}
        // Pass necessary props to TwoPointSyncModal
        // For example, if it needs to modify subtitles directly:
        // subtitles={subtitles} // from SubtitleEditor state if lifted up
        // onSync={handleTwoPointSync} // callback to SubtitleEditor
        setNotification={setNotification} // To show its own notifications
      />

      {notification.message && (isSettingsModalOpen || isHelpModalOpen || isTwoPointSyncModalOpen) && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-[150] transition-all duration-300 ${showModalNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'} ${notification.type === 'success' ? 'bg-green-500 text-white' : ''} ${notification.type === 'info' ? 'bg-sky-500 text-white' : ''}  ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default function MainApp() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}
