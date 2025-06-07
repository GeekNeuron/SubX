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

// This is a workaround for react-window being loaded from CDN
const { FixedSizeList } = window.ReactWindow || { FixedSizeList: ({ children }) => <div className="overflow-y-auto">{children}</div> };

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

    // State Management
    const [isLoading, setIsLoading] = React.useState(false);
    const [findText, setFindText] = React.useState('');
    const [replaceText, setReplaceText] = React.useState('');
    const [shiftAmount, setShiftAmount] = React.useState('');
    const [shiftSelectedAmount, setShiftSelectedAmount] = React.useState('');
    const [setDurationSelectedValue, setSetDurationSelectedValue] = React.useState('');
    const [subtitleErrors, setSubtitleErrors] = React.useState(new Map());
    const [selectedSubtitleIds, setSelectedSubtitleIds] = React.useState(new Set());
    const [searchTerm, setSearchTerm] = React.useState("");
    const [jumpToLineValue, setJumpToLineValue] = React.useState("");
    const [activeRowId, setActiveRowId] = React.useState(null); 
    const [editingRowId, setEditingRowId] = React.useState(null); 
    const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false);
    const [videoSrc, setVideoSrc] = React.useState(null);
    const [videoDuration, setVideoDuration] = React.useState(0);
    const [videoCurrentTime, setVideoCurrentTime] = React.useState(0);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = React.useState(false);

    // Refs for DOM elements
    const fileInputRef = React.useRef(null);
    const videoFileRef = React.useRef(null);
    const videoRef = React.useRef(null);
    const listRef = React.useRef(null);
    const saveButtonRef = React.useRef(null);

    // --- Effects ---

    React.useEffect(() => {
        const baseTitle = t('appTitle');
        let newTitle = originalFileName ? `${originalFileName} - ${baseTitle}` : baseTitle;
        if (hasUnsavedChanges) newTitle = `* ${newTitle}`;
        document.title = newTitle;
    }, [hasUnsavedChanges, originalFileName, t]);

    React.useEffect(() => {
        if (appearanceConfig.autosave && hasUnsavedChanges) {
            localStorage.setItem('subx-autosave-state', JSON.stringify(editorState));
        }
    }, [editorState, hasUnsavedChanges, appearanceConfig.autosave]);

    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);
    
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (saveButtonRef.current && !saveButtonRef.current.contains(event.target)) {
                setIsSaveMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [saveButtonRef]);

    // --- Core Handlers ---

    const withLoading = (fn, loadingMessageKey = 'processing') => {
        setIsLoading(true);
        setGlobalNotification({ message: t(loadingMessageKey), type: 'info', isLoading: true });
        setTimeout(() => { 
            try { fn(); } 
            catch (error) { console.error("Error during processing:", error); setGlobalNotification({ message: "An error occurred during processing.", type: 'error' }); } 
            finally { setIsLoading(false); } 
        }, 50); 
    };

    const parseSRT = (srtContent) => {
        const subs = [];
        const srtBlockRegex = /(\d+)\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*([\s\S]*?(?=\n\n\d+|\n\n\n\d+|$))/g;
        let match;
        while ((match = srtBlockRegex.exec(srtContent)) !== null) {
            subs.push({ 
                id: crypto.randomUUID(), 
                startTime: match[2].replace('.',','), 
                endTime: match[3].replace('.',','), 
                text: match[4].trim(),
                translation: "" 
            });
        }
        return subs.sort((a, b) => srtTimeToMs(a.startTime) - srtTimeToMs(b.startTime));
    };

    const subtitlesToSRT = (subsArray, sourceTextKey) => {
        return subsArray.map((sub, index) => {
            const textToUse = sourceTextKey === 'translation' && sub.translation ? sub.translation : sub.text;
            return `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${textToUse}\n`;
        }).join('\n');
    };
    
    const handleFileLoadInternal = (content, fileName) => {
        withLoading(() => {
            const parsedSubtitles = parseSRT(content);
            if (parsedSubtitles.length === 0 && content.trim() !== "") throw new Error(t('errorInvalidSRT'));
            resetEditorHistory({ subtitles: parsedSubtitles, originalFileName: fileName });
            setSubtitleErrors(new Map());
            setSelectedSubtitleIds(new Set());
            setSearchTerm("");
            setActiveRowId(null);
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

    const handleSave = (type = 'primary') => {
        if (subtitles.length === 0) { setGlobalNotification({ message: t('noSubtitlesToSave'), type: 'info' }); return; }
        
        const sourceTextKey = (type === 'translation' && appearanceConfig.translationMode) ? 'translation' : 'text';
        const srtContent = subtitlesToSRT(subtitles, sourceTextKey);
        const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
        const link = document.createElement('a');
        let baseName = originalFileName || 'subtitles';
        if (baseName.endsWith('.srt')) baseName = baseName.slice(0, -4);
        
        const suffix = sourceTextKey === 'translation' ? `.${language}.srt` : '.srt';
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}${suffix}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setGlobalNotification({ message: t('subtitlesSaved'), type: 'success' });
        setEditorStateWithUndo({ ...editorState }, "save_action");
        setIsSaveMenuOpen(false);
    };

    const handleUpdateSubtitle = (id, updatedPart) => {
        const newSubtitles = subtitles.map(sub => (sub.id === id ? { ...sub, ...updatedPart } : sub));
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
    };

    const handleAddSubtitle = () => {
        const lastSub = subtitles.length > 0 ? subtitles[subtitles.length - 1] : null;
        const newStartTime = lastSub ? msToSrtTime(srtTimeToMs(lastSub.endTime) + 100) : "00:00:00,000";
        const newEndTime = msToSrtTime(srtTimeToMs(newStartTime) + 2000); 
        const newSub = { id: crypto.randomUUID(), startTime: newStartTime, endTime: newEndTime, text: "New text...", translation: "" };
        setEditorStateWithUndo({ ...editorState, subtitles: [...subtitles, newSub] });
        setActiveRowId(newSub.id);
        setTimeout(() => listRef.current?.scrollToItem(subtitles.length, 'center'), 0);
    };

    const handleDeleteSubtitle = (id) => {
        const newSubtitles = subtitles.filter(sub => sub.id !== id);
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
        if (activeRowId === id) setActiveRowId(null);
    };
    
    const handleSplitSubtitle = (id) => {
        const subIndex = subtitles.findIndex(s => s.id === id);
        if (subIndex === -1) return;
        const subToSplit = subtitles[subIndex];
        if (subToSplit.text.trim().length < 2) { setGlobalNotification({ message: t('cannotSplitEmpty'), type: 'warning' }); return; }
        let splitPoint = Math.floor(subToSplit.text.length / 2);
        const firstNewline = subToSplit.text.indexOf('\n');
        if (firstNewline !== -1 && firstNewline > 0 && firstNewline < subToSplit.text.length - 1) { splitPoint = firstNewline; }
        const text1 = subToSplit.text.substring(0, splitPoint).trim();
        const text2 = subToSplit.text.substring(splitPoint).trim();
        if (!text1 || !text2) { setGlobalNotification({ message: t('cannotSplitEmpty'), type: 'warning' }); return; }
        const originalStartTimeMs = srtTimeToMs(subToSplit.startTime);
        const originalEndTimeMs = srtTimeToMs(subToSplit.endTime);
        const originalDurationMs = originalEndTimeMs - originalStartTimeMs;
        if (originalDurationMs <= 100) { setGlobalNotification({ message: "Subtitle duration too short to split meaningfully.", type: 'warning' }); return; }
        let duration1Ratio = text1.length / (text1.length + text2.length);
        if (duration1Ratio < 0.1 || duration1Ratio > 0.9) duration1Ratio = 0.5;
        const splitTimeMs = originalStartTimeMs + Math.floor(originalDurationMs * duration1Ratio);
        const updatedSub1 = { ...subToSplit, text: text1, endTime: msToSrtTime(splitTimeMs) };
        const newSub2 = { id: crypto.randomUUID(), startTime: msToSrtTime(splitTimeMs), endTime: subToSplit.endTime, text: text2, translation: "" };
        const newSubtitles = [...subtitles];
        newSubtitles.splice(subIndex, 1, updatedSub1, newSub2);
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
        setGlobalNotification({ message: t('splitConfirm'), type: 'success' });
    };

    const handleMergeNextSubtitle = (id) => {
        const subIndex = subtitles.findIndex(s => s.id === id);
        if (subIndex === -1 || subIndex >= subtitles.length - 1) { setGlobalNotification({ message: t('cannotMergeLast'), type: 'warning' }); return; }
        const sub1 = subtitles[subIndex];
        const sub2 = subtitles[subIndex + 1];
        const mergedSub = { ...sub1, text: `${sub1.text.trim()} ${sub2.text.trim()}`.trim(), translation: `${sub1.translation || ''} ${sub2.translation || ''}`.trim(), endTime: sub2.endTime };
        const newSubtitles = [...subtitles];
        newSubtitles.splice(subIndex, 2, mergedSub);
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
        setGlobalNotification({ message: t('mergeConfirm'), type: 'success' });
    };

    const handleClearAll = () => {
        if (window.confirm(t('confirmClear'))) {
            resetEditorHistory({ subtitles: [], originalFileName: editorState.originalFileName });
            setSubtitleErrors(new Map()); setSelectedSubtitleIds(new Set()); setSearchTerm(""); setActiveRowId(null);
            setGlobalNotification({ message: "All subtitles cleared.", type: 'info' });
        }
    };
    
    // ... all other handlers ...

    const filteredSubtitles = React.useMemo(() => {
        if (!searchTerm) return subtitles;
        return subtitles.filter(sub => 
            sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.translation && sub.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
            sub.startTime.includes(searchTerm) ||
            sub.endTime.includes(searchTerm)
        );
    }, [subtitles, searchTerm]);

    const Row = React.useCallback(({ index, style }) => {
        const sub = filteredSubtitles[index];
        if (!sub) return null;
        const originalIndex = subtitles.findIndex(s => s.id === sub.id);
        
        return (
            <div style={style}>
                <SubtitleItem
                    key={sub.id}
                    subtitle={sub}
                    index={originalIndex}
                    onUpdate={handleUpdateSubtitle}
                    onDelete={handleDeleteSubtitle}
                    onSplit={handleSplitSubtitle}
                    onMergeNext={handleMergeNextSubtitle}
                    isLastItem={originalIndex === subtitles.length - 1}
                    errors={subtitleErrors.get(sub.id) || []}
                    isSelected={selectedSubtitleIds.has(sub.id)}
                    onSelect={(id) => {
                        setActiveRowId(id);
                        setSelectedSubtitleIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(id)) newSet.delete(id);
                            else newSet.add(id);
                            return newSet;
                        });
                    }}
                    isActiveRow={activeRowId === sub.id}
                    editingRowId={editingRowId}
                    onToggleEdit={(id, isEditing) => setEditingRowId(isEditing ? id : null)}
                    searchTerm={searchTerm}
                />
            </div>
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredSubtitles, subtitles, selectedSubtitleIds, activeRowId, editingRowId, searchTerm]);

    return (
        <div className={`container mx-auto p-4 ${language === 'fa' ? 'font-vazir' : ''}`}>
            {/* JSX for the component... */}
        </div>
    );
}

export default SubtitleEditor;
