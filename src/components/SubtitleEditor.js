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

function SubtitleEditor({ setGlobalNotification }) {
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
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        const baseTitle = "SubX - Subtitle Editor";
        let newTitle = originalFileName ? `${originalFileName} - ${baseTitle}` : baseTitle;
        if (hasUnsavedChanges) newTitle = `* ${newTitle}`;
        document.title = newTitle;

        if (appearanceConfig.autosave && hasUnsavedChanges) {
            if (subtitles.length > 0 || originalFileName) localStorage.setItem('subx-autosave-state', JSON.stringify(editorState));
            else localStorage.removeItem('subx-autosave-state');
        }
    }, [editorState, subtitles, originalFileName, appearanceConfig.autosave, hasUnsavedChanges]);

    React.useEffect(() => {
        const autoSavedStateString = localStorage.getItem('subx-autosave-state');
        if (autoSavedStateString) {
            try {
                const autoSavedState = JSON.parse(autoSavedStateString);
                resetEditorHistory({...autoSavedState, hasUnsavedChanges: true });
                setGlobalNotification({ message: "Restored auto-saved session. Save to confirm changes.", type: "info" });
            } catch (e) {
                console.error("Failed to parse autosaved state:", e);
                localStorage.removeItem('subx-autosave-state');
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const withLoading = (fn, loadingMessage = 'Processing...') => {
        setIsLoading(true); setGlobalNotification({ message: loadingMessage, type: 'info', isLoading: true }); 
        setTimeout(() => { 
            try { fn(); } catch (error) { console.error("Error during processing:", error); setGlobalNotification({ message: "An error occurred during processing.", type: 'error' }); } 
            finally { setIsLoading(false); } 
        }, 100); 
    };

    const parseSRT = (srtContent) => {
        const subs = [];
        const srtBlockRegex = /(\d+)\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*([\s\S]*?(?=\n\n\d+\s*\n\d{2}:\d{2}:\d{2}[,.]\d{3}|\n\n\n\d+\s*\n\d{2}:\d{2}:\d{2}[,.]\d{3}|$))/g;
        let match;
        while ((match = srtBlockRegex.exec(srtContent)) !== null) {
            subs.push({ id: crypto.randomUUID(), originalId: parseInt(match[1], 10), startTime: match[2].replace('.',','), endTime: match[3].replace('.',','), text: match[4].trim() });
        }
        return subs.sort((a, b) => srtTimeToMs(a.startTime) - srtTimeToMs(b.startTime));
    };

    const subtitlesToSRT = (subsArray) => subsArray.map((sub, index) => `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}\n`).join('\n');
    
    const handleFileLoadInternal = (content, fileName) => {
        setIsLoading(true); setGlobalNotification({ message: 'Loading file...', type: 'info', isLoading: true });
        setTimeout(() => { 
            try {
                const parsedSubtitles = parseSRT(content);
                if (parsedSubtitles.length === 0 && content.trim() !== "") throw new Error("File might be empty or not a valid SRT format.");
                resetEditorHistory({ subtitles: parsedSubtitles, originalFileName: fileName, hasUnsavedChanges: false });
                setSubtitleErrors(new Map()); setSelectedSubtitleIds(new Set()); setSearchTerm(""); setActiveRowId(null);
                setGlobalNotification({ message: 'Subtitles loaded successfully.', type: 'success' });
            } catch (error) {
                console.error("Error parsing SRT:", error);
                setGlobalNotification({ message: `Error: Invalid SRT file format or encoding issue. ${error.message}`, type: 'error' });
                resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false });
            } finally { setIsLoading(false); } 
        }, 500); 
    };

    const handleVideoFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
        if (event.target) event.target.value = null;
    };

    const handleVideoMetadata = (e) => {
        setVideoDuration(e.target.duration * 1000); // in ms
    };

    const handleAddSubtitle = () => {
        const lastSub = subtitles[subtitles.length -1];
        const newStartTime = lastSub ? msToSrtTime(srtTimeToMs(lastSub.endTime) + 100) : "00:00:00,000";
        const newEndTime = msToSrtTime(srtTimeToMs(newStartTime) + 2000); 
        const newSub = { id: crypto.randomUUID(), startTime: newStartTime, endTime: newEndTime, text: "New subtitle..." };
        setEditorStateWithUndo({ ...editorState, subtitles: [...subtitles, newSub] });
        setActiveRowId(newSub.id); 
        setTimeout(() => { if (subtitleRowsRef.current[newSub.id]) subtitleRowsRef.current[newSub.id].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 0);
    };

    const handleSaveSubtitles = React.useCallback(() => {
        if (subtitles.length === 0) { setGlobalNotification({ message: "No subtitles to save.", type: 'info' }); return; }
        const srtContent = subtitlesToSRT(subtitles);
        const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
        const link = document.createElement('a');
        const fileNameToSave = originalFileName || 'subtitles.srt';
        link.href = URL.createObjectURL(blob); link.download = fileNameToSave.endsWith('.srt') ? fileNameToSave : `${fileNameToSave}.srt`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setGlobalNotification({ message: 'Subtitles saved successfully.', type: 'success' });
        setEditorStateWithUndo(editorState, "save_action"); 
    }, [subtitles, originalFileName, setGlobalNotification, setEditorStateWithUndo, editorState]);
    
    // ... all other handler functions (handleUpdateSubtitle, handleDeleteSubtitle, etc.) remain here ...

    // Filtered subtitles for display
    const filteredSubtitles = React.useMemo(() => {
        if (!searchTerm) return subtitles;
        return subtitles.filter(sub => sub.text.toLowerCase().includes(searchTerm.toLowerCase()) || sub.startTime.includes(searchTerm) || sub.endTime.includes(searchTerm));
    }, [subtitles, searchTerm]);

    const activeSubtitleForWaveform = React.useMemo(() => {
        if (activeRowId) return subtitles.find(sub => sub.id === activeRowId);
        if (selectedSubtitleIds.size === 1) return subtitles.find(sub => sub.id === Array.from(selectedSubtitleIds)[0]);
        return null;
    }, [subtitles, activeRowId, selectedSubtitleIds]);

    return (
        <div className="container mx-auto p-4">
            <LoadingOverlay isActive={isLoading} message="Processing..." />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <FileUploader 
                        onFileLoad={handleFileLoadInternal} 
                        setNotification={setGlobalNotification} 
                        clearSubtitles={() => resetEditorHistory({ subtitles: [], originalFileName: '', hasUnsavedChanges: false })}
                        fileInputRef={fileInputRef}
                    />
                </div>
                <div>
                     <label htmlFor="video-upload" className="w-full inline-block px-4 py-2 text-center bg-green-600 text-white rounded-md shadow hover:bg-green-700 cursor-pointer">
                        Load Video
                    </label>
                    <input id="video-upload" type="file" ref={videoFileRef} className="hidden" accept="video/*" onChange={handleVideoFileChange} />
                </div>
            </div>

            {videoSrc && (
                <div className="my-4">
                    <video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg shadow-md" onLoadedMetadata={handleVideoMetadata}></video>
                </div>
            )}

             {/* All other tool sections and subtitle table would go here... */}
             {/* For brevity, I'm only showing the newly added components and layout logic. */}
             {/* The existing JSX for tools, selected actions bar, and table should be placed here. */}

            {subtitles.length > 0 && (
                <VisualTimeline 
                    subtitles={subtitles} 
                    onSelectSubtitle={(subId) => {
                        setActiveRowId(subId); setSelectedSubtitleIds(new Set([subId]));
                        if (subtitleRowsRef.current[subId]) subtitleRowsRef.current[subId].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if(videoRef.current) videoRef.current.currentTime = srtTimeToMs(subtitles.find(s=>s.id === subId).startTime) / 1000;
                    }}
                    activeRowId={activeRowId}
                    totalDuration={videoDuration > 0 ? videoDuration : (subtitles.length > 0 ? srtTimeToMs(subtitles[subtitles.length-1].endTime) + 5000 : 60000)}
                    subtitleErrors={subtitleErrors}
                    currentTime={videoRef.current?.currentTime * 1000}
                />
            )}

            <WaveformDisplay subtitle={activeSubtitleForWaveform} isActive={!!activeSubtitleForWaveform} />

            {/* Subtitle Table and other components */}
            {/* The rest of the SubtitleEditor JSX would follow... */}

        </div>
    );
}

export default SubtitleEditor;
