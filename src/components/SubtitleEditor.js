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

const { FixedSizeList } = window.ReactWindow; // Accessing from CDN

function SubtitleEditor({ setGlobalNotification }) {
    const t = useTranslation();
    const { language } = useLanguage();
    const { errorConfig, appearanceConfig } = useSettings();
    const { 
        presentState: editorState, 
        setPresentState: setEditorStateWithUndo, 
        undo, redo, canUndo, canRedo, 
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
    const [searchTerm, setSearchTerm] = React.useState("");
    const [jumpToLineValue, setJumpToLineValue] = React.useState("");
    const [activeRowId, setActiveRowId] = React.useState(null); 
    const [editingRowId, setEditingRowId] = React.useState(null); 
    const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false);
    const [videoSrc, setVideoSrc] = React.useState(null);
    const [videoDuration, setVideoDuration] = React.useState(0);
    const [videoCurrentTime, setVideoCurrentTime] = React.useState(0);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = React.useState(false);
    
    const fileInputRef = React.useRef(null);
    const videoFileRef = React.useRef(null);
    const videoRef = React.useRef(null);
    const listRef = React.useRef(null);
    const saveButtonRef = React.useRef(null);

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
            const textToUse = sourceTextKey === 'translation' ? (sub.translation || '') : sub.text;
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

    const handleSave = (type) => {
        if (subtitles.length === 0) { setGlobalNotification({ message: "No subtitles to save.", type: 'info' }); return; }
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
        setEditorStateWithUndo(editorState, "save_action");
        setIsSaveMenuOpen(false);
    };

    const handleUpdateSubtitle = (id, updatedPart) => {
        const newSubtitles = subtitles.map(sub => (sub.id === id ? { ...sub, ...updatedPart } : sub));
        setEditorStateWithUndo({ ...editorState, subtitles: newSubtitles });
    };

    const filteredSubtitles = React.useMemo(() => {
        if (!searchTerm) return subtitles;
        return subtitles.filter(sub => 
            sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.translation && sub.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
            sub.startTime.includes(searchTerm) ||
            sub.endTime.includes(searchTerm)
        );
    }, [subtitles, searchTerm]);

    const handleJumpToLine = () => {
        const lineNum = parseInt(jumpToLineValue, 10);
        const index = subtitles.findIndex(sub => sub.id === filteredSubtitles[lineNum - 1]?.id);
        if (listRef.current && index !== -1) {
            listRef.current.scrollToItem(index, 'center');
            const subId = subtitles[index].id;
            setActiveRowId(subId);
            setSelectedSubtitleIds(new Set([subId]));
        } else {
            setGlobalNotification({ message: t('lineNumOutOfRange', subtitles.length), type: 'error' });
        }
        setJumpToLineValue("");
    };

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
                    onDelete={()=>{}} // Will be added
                    onSplit={()=>{}} // Will be added
                    onMergeNext={()=>{}} // Will be added
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
    }, [filteredSubtitles, subtitles, selectedSubtitleIds, activeRowId, editingRowId, searchTerm, handleUpdateSubtitle]);
    
    // ... all other handler functions ...

    return (
        <div className={`container mx-auto p-4 ${language === 'fa' ? 'font-vazir' : ''}`}>
             <LoadingOverlay isActive={isLoading} message={t('processing')} />

            {/* Video and File Uploaders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-1">
                    <FileUploader onFileLoad={handleFileLoadInternal} setNotification={setGlobalNotification} clearSubtitles={() => resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false })} fileInputRef={fileInputRef} />
                </div>
                <div className="lg:col-span-1 flex flex-col justify-center">
                     <label htmlFor="video-upload" className="w-full text-center px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 cursor-pointer">
                        {t('loadVideo')}
                    </label>
                    <input id="video-upload" type="file" ref={videoFileRef} className="hidden" accept="video/*" onChange={handleVideoFileChange} />
                </div>
            </div>

            {videoSrc && <div className="my-4"><video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg shadow-md" onLoadedMetadata={handleVideoMetadata} onTimeUpdate={handleVideoTimeUpdate}></video></div>}
            
            {/* Action Buttons */}
            <div className="my-4 flex flex-wrap gap-2 items-center">
                {/* ... other buttons like Undo, Redo, Add New, etc. ... */}
            </div>
            
            {/* Visual Timeline & Waveform */}
            {/* ... */}
            
            {/* Subtitle List */}
            {subtitles.length > 0 && (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
                            <tr>
                                {/* ... table headers ... */}
                            </tr>
                        </thead>
                    </table>
                     <div className="virtual-list-container">
                        <FixedSizeList
                            ref={listRef}
                            height={Math.max(window.innerHeight * 0.5, 400)}
                            itemCount={filteredSubtitles.length}
                            itemSize={editingRowId ? (appearanceConfig.translationMode ? 200 : 160) : (appearanceConfig.translationMode ? 90 : 80)} // Dynamic row height
                            width="100%"
                            itemData={filteredSubtitles}
                        >
                            {Row}
                        </FixedSizeList>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubtitleEditor;
