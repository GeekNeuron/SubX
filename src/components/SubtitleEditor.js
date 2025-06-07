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
                translation: '' // Initialize translation field
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

    const handleSave = (type) => {
        if (subtitles.length === 0) { setGlobalNotification({ message: "No subtitles to save.", type: 'info' }); return; }
        const srtContent = subtitlesToSRT(subtitles, type);
        const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
        const link = document.createElement('a');
        let baseName = originalFileName || 'subtitles';
        if (baseName.endsWith('.srt')) baseName = baseName.slice(0, -4);
        const suffix = type === 'translation' ? `.${language}.srt` : '.srt';
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}${suffix}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setGlobalNotification({ message: t('subtitlesSaved'), type: 'success' });
        if (type === 'original' || (type === 'translation' && !appearanceConfig.translationMode)) {
             setEditorStateWithUndo(editorState, "save_action");
        }
    };
    
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

    const filteredSubtitles = React.useMemo(() => {
        if (!searchTerm) return subtitles;
        return subtitles.filter(sub => 
            sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.translation && sub.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
            sub.startTime.includes(searchTerm) ||
            sub.endTime.includes(searchTerm)
        );
    }, [subtitles, searchTerm]);
    
    const numSelected = selectedSubtitleIds.size;
    const allSelected = subtitles.length > 0 && numSelected === subtitles.length && filteredSubtitles.length === subtitles.length;

    // ... (other handlers like handleDelete, handleShift, etc. are assumed to be complete and are omitted for brevity) ...

    return (
        <div className={`container mx-auto p-4 ${language === 'fa' ? 'font-vazir' : ''}`}>
            <LoadingOverlay isActive={isLoading} message={t('processing')} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <FileUploader onFileLoad={handleFileLoadInternal} setNotification={setGlobalNotification} clearSubtitles={() => resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false })} fileInputRef={fileInputRef} />
                </div>
                <div className="lg:col-span-1 flex flex-col justify-center">
                    <label htmlFor="video-upload" className="w-full text-center px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 cursor-pointer">{t('loadVideo')}</label>
                    <input id="video-upload" type="file" ref={videoFileRef} className="hidden" accept="video/*" onChange={handleVideoFileChange} />
                </div>
            </div>

            {videoSrc && <div className="my-4"><video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg shadow-md" onLoadedMetadata={handleVideoMetadata} onTimeUpdate={handleVideoTimeUpdate}></video></div>}
            
            {/* Action Buttons */}
            <div className="my-4 flex flex-wrap gap-2 items-center">
                <button onClick={undo} disabled={!canUndo} className="px-3 py-2 bg-slate-500 text-white rounded-md shadow text-sm disabled:opacity-50 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg> {t('undo')}</button>
                <button onClick={redo} disabled={!canRedo} className="px-3 py-2 bg-slate-500 text-white rounded-md shadow text-sm disabled:opacity-50 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" /></svg> {t('redo')}</button>
                <span className="border-l h-8 mx-2"></span>
                <button onClick={handleAddSubtitle} className="px-4 py-2 bg-green-500 text-white rounded-md shadow text-sm">{t('addSubtitle')}</button>
                {appearanceConfig.translationMode ? (
                    <div className="flex gap-2">
                        <button onClick={() => handleSave('original')} className="px-4 py-2 bg-sky-500 text-white rounded-md shadow text-sm">{t('saveOriginal')}{hasUnsavedChanges && <span className="ml-1 text-red-300">*</span>}</button>
                        <button onClick={() => handleSave('translation')} className="px-4 py-2 bg-emerald-500 text-white rounded-md shadow text-sm">{t('saveTranslation')}{hasUnsavedChanges && <span className="ml-1 text-red-300">*</span>}</button>
                    </div>
                ) : (
                    <button onClick={() => handleSave('original')} className="px-4 py-2 bg-sky-500 text-white rounded-md shadow text-sm">{t('saveSubtitles')}{hasUnsavedChanges && <span className="ml-1 text-red-300">*</span>}</button>
                )}
                {/* ... other action buttons like Two-Point Sync */}
            </div>

            {/* Other tools and the subtitle table */}
            {/* The table header needs to be conditional */}
            <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="p-3 w-20 text-center"><input type="checkbox" checked={allSelected} onChange={handleSelectAllSubtitles} /></th>
                            <th className="p-3 w-40 text-left">{t('startTime')}</th>
                            <th className="p-3 w-40 text-left">{t('endTime')}</th>
                            {appearanceConfig.translationMode ? (
                                <>
                                    <th className="p-3 text-left">{t('originalText')}</th>
                                    <th className="p-3 text-left">{t('translation')}</th>
                                </>
                            ) : (
                                <th className="p-3 text-left" colSpan="2">{t('text')}</th>
                            )}
                            <th className="p-3 w-48 text-center">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubtitles.map((sub, index) => (
                            <SubtitleItem
                                key={sub.id}
                                subtitle={sub}
                                index={subtitles.findIndex(s => s.id === sub.id)}
                                itemRef={el => { subtitleRowsRef.current[sub.id] = el; }}
                                onUpdate={handleUpdateSubtitle}
                                // ... other props
                                editingRowId={editingRowId}
                                onToggleEdit={handleToggleEditRow}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Modals */}
             <TwoPointSyncModal
                isOpen={isTwoPointSyncModalOpen}
                onClose={() => setIsTwoPointSyncModalOpen(false)}
                subtitles={subtitles}
                selectedSubtitleIds={selectedSubtitleIds}
                onSyncSubtitles={(syncedSubs) => {
                    setEditorStateWithUndo({ ...editorState, subtitles: syncedSubs });
                }}
                setNotification={setGlobalNotification}
                withLoading={withLoading}
            />
        </div>
    );
}

export default SubtitleEditor;
