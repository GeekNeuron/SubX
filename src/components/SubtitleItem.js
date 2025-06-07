// src/components/SubtitleItem.js
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';

function SubtitleItem({ 
    subtitle, 
    index, 
    onUpdate, 
    onDelete, 
    onSplit, 
    onMergeNext, 
    isLastItem, 
    errors, 
    isSelected, 
    onSelect, 
    onDragStart, 
    onDragOver, 
    onDrop, 
    onDragEnd, 
    isBeingDragged, 
    dragOverPosition, 
    itemRef, 
    isActiveRow, 
    onToggleEdit, 
    searchTerm,
    editingRowId 
}) {
    const t = useTranslation();
    const { language } = useLanguage();
    const { appearanceConfig, errorConfig } = useSettings();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(subtitle.text);
    // Add state for the new translation text field
    const [editTranslation, setEditTranslation] = React.useState(subtitle.translation || '');

    const [editStart, setEditStart] = React.useState(subtitle.startTime);
    const [editEnd, setEditEnd] = React.useState(subtitle.endTime);
    
    const textareaRef = React.useRef(null);
    const translationTextareaRef = React.useRef(null);

    React.useEffect(() => {
        if (editingRowId === subtitle.id && !isEditing) {
            setIsEditing(true);
        } else if (editingRowId !== subtitle.id && isEditing) {
            setIsEditing(false); 
        }
    }, [editingRowId, subtitle.id, isEditing]);

    React.useEffect(() => {
        setEditText(subtitle.text);
        setEditTranslation(subtitle.translation || ''); // Ensure it's initialized
        setEditStart(subtitle.startTime);
        setEditEnd(subtitle.endTime);
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [subtitle, isEditing]);


    const handleSave = () => {
        onUpdate(subtitle.id, { 
            startTime: editStart, 
            endTime: editEnd, 
            text: editText,
            translation: editTranslation // Save the translation as well
        });
        setIsEditing(false);
        onToggleEdit(subtitle.id, false); 
    };

    const handleCancelEdit = () => {
        setEditText(subtitle.text);
        setEditTranslation(subtitle.translation || '');
        setEditStart(subtitle.startTime);
        setEditEnd(subtitle.endTime);
        setIsEditing(false);
        onToggleEdit(subtitle.id, false);
    };
    
    const handleTextareaKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const toggleSelfEdit = () => {
        const newEditingState = !isEditing;
        setIsEditing(newEditingState);
        onToggleEdit(subtitle.id, newEditingState); 
    };
    
    const hasErrors = errors && errors.length > 0;
    
    let rowClass = `bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`;
    if (isActiveRow) {
        rowClass += ' ring-2 ring-sky-500 dark:ring-sky-400 ring-offset-1 dark:ring-offset-slate-800';
    } else if (isBeingDragged) {
        rowClass = `opacity-50 bg-sky-100 dark:bg-sky-800`;
    } else if (isSelected) {
        rowClass = `bg-sky-100 dark:bg-sky-700/50 hover:bg-sky-200 dark:hover:bg-sky-600/50 transition-colors`;
    } else if (hasErrors) {
        rowClass = `bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors`;
    }

    if (!isBeingDragged && dragOverPosition === 'before') rowClass += ' border-t-2 border-dashed border-sky-500';
    if (!isBeingDragged && dragOverPosition === 'after') rowClass += ' border-b-2 border-dashed border-sky-500';
    
    const fontClass = appearanceConfig.tableFont || 'font-sans';

    const getHighlightedText = (text, highlight) => {
        if (!highlight || typeof text !== 'string') return text;
        try {
            const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
            return parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 px-0.5 rounded">{part}</mark> : part
            );
        } catch (e) {
            console.error("Error creating RegExp for highlighting:", e);
            return text; 
        }
    };

    if (isEditing) {
        return (
            <tr className={`bg-sky-50 dark:bg-sky-900/50 ${isActiveRow ? 'ring-2 ring-sky-400 dark:ring-sky-300 ring-offset-1 dark:ring-offset-slate-900' : ''}`} id={`sub-row-${subtitle.id}`} ref={itemRef}>
                <td className="p-2 border-b border-slate-200 dark:border-slate-600 text-center align-top">{index + 1}</td>
                <td className="p-2 border-b border-slate-200 dark:border-slate-600 align-top">
                    <input type="text" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full p-1 rounded bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500"/>
                </td>
                <td className="p-2 border-b border-slate-200 dark:border-slate-600 align-top">
                    <input type="text" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full p-1 rounded bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500"/>
                </td>
                {appearanceConfig.translationMode ? (
                    <>
                        <td className="p-2 border-b border-slate-200 dark:border-slate-600 align-top">
                            <textarea 
                                ref={textareaRef} 
                                value={editText} 
                                onChange={e => setEditText(e.target.value)} 
                                onKeyDown={handleTextareaKeyDown} 
                                rows="3" 
                                spellCheck={appearanceConfig.spellCheck}
                                className={`w-full p-2 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 ${fontClass}`}
                            ></textarea>
                        </td>
                        <td className="p-2 border-b border-slate-200 dark:border-slate-600 align-top">
                             <textarea 
                                ref={translationTextareaRef} 
                                value={editTranslation} 
                                onChange={e => setEditTranslation(e.target.value)} 
                                onKeyDown={handleTextareaKeyDown} 
                                rows="3" 
                                spellCheck={appearanceConfig.spellCheck}
                                dir={language === 'fa' ? 'rtl' : 'ltr'}
                                className={`w-full p-2 bg-white dark:bg-slate-500 rounded border border-slate-300 dark:border-slate-400 ${fontClass}`}
                            ></textarea>
                        </td>
                    </>
                ) : (
                    <td className="p-2 border-b border-slate-200 dark:border-slate-600" colSpan="2">
                        <textarea 
                            ref={textareaRef} 
                            value={editText} 
                            onChange={e => setEditText(e.target.value)} 
                            onKeyDown={handleTextareaKeyDown} 
                            rows="3" 
                            spellCheck={appearanceConfig.spellCheck}
                            className={`w-full p-2 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 ${fontClass}`}
                        ></textarea>
                    </td>
                )}
                <td className="p-2 border-b border-slate-200 dark:border-slate-600 text-center align-top">
                    <div className="flex flex-col space-y-1">
                        <button onClick={handleSave} className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded">{t('saveSettings')}</button>
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-slate-400 hover:bg-slate-500 text-white rounded">{t('cancel')}</button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr 
            id={`sub-row-${subtitle.id}`} 
            ref={itemRef} 
            className={rowClass}
            draggable={!isEditing}
            onDragStart={(e) => !isEditing && onDragStart(e, subtitle.id)}
            onDragOver={(e) => !isEditing && onDragOver(e, subtitle.id, itemRef.current)}
            onDrop={(e) => !isEditing && onDrop(e, subtitle.id)}
            onDragEnd={(e) => !isEditing && onDragEnd(e)}
        >
            <td className="p-3 border-b border-slate-200 dark:border-slate-700 text-center tabular-nums relative cursor-grab align-middle">
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onSelect(subtitle.id)} 
                    className="mr-2 rtl:ml-2 rtl:mr-0 form-checkbox h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    onClick={(e) => e.stopPropagation()}
                />
                {index + 1}
                {hasErrors && ( /* Error Icon */ "!" )}
            </td>
            <td className="p-3 border-b border-slate-200 dark:border-slate-700 tabular-nums align-middle">{subtitle.startTime}</td>
            <td className="p-3 border-b border-slate-200 dark:border-slate-700 tabular-nums align-middle">{subtitle.endTime}</td>
            {appearanceConfig.translationMode ? (
                <>
                    <td className={`p-3 border-b border-slate-200 dark:border-slate-700 whitespace-pre-wrap align-middle text-slate-500 dark:text-slate-400 ${fontClass}`}>
                        {getHighlightedText(subtitle.text, searchTerm)}
                    </td>
                    <td className={`p-3 border-b border-slate-200 dark:border-slate-700 whitespace-pre-wrap align-middle ${fontClass}`} dir={language === 'fa' ? 'rtl' : 'ltr'}>
                        {getHighlightedText(subtitle.translation || '', searchTerm)}
                    </td>
                </>
            ) : (
                <td className={`p-3 border-b border-slate-200 dark:border-slate-700 whitespace-pre-wrap align-middle ${fontClass}`} colSpan="2">
                    {getHighlightedText(subtitle.text, searchTerm)}
                </td>
            )}
            <td className="p-3 border-b border-slate-200 dark:border-slate-700 text-center space-x-1 rtl:space-x-reverse align-middle">
                <button onClick={toggleSelfEdit} className="p-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors" title={t('edit')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDelete(subtitle.id)} className="p-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors" title={t('delete')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => onSplit(subtitle.id)} className="p-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors" title={t('split')}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-8h8" transform="rotate(45 12 12) translate(0 -3) scale(0.8)" /></svg>
                </button>
                {!isLastItem && (
                    <button onClick={() => onMergeNext(subtitle.id)} className="p-1.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors" title={t('mergeNext')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" transform="scale(0.8) translate(3 0)"/></svg>
                    </button>
                )}
            </td>
        </tr>
    );
}
export default SubtitleItem;
