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
    
    // States for inline editing
    const [editText, setEditText] = React.useState(subtitle.text);
    const [editTranslation, setEditTranslation] = React.useState(subtitle.translation || '');
    const [editStart, setEditStart] = React.useState(subtitle.startTime);
    const [editEnd, setEditEnd] = React.useState(subtitle.endTime);
    
    const textareaRef = React.useRef(null);
    const translationTextareaRef = React.useRef(null);
    const [jumpHighlight, setJumpHighlight] = React.useState(false);

    // Effect to synchronize internal editing state with external trigger
    React.useEffect(() => {
        if (editingRowId === subtitle.id && !isEditing) {
            setIsEditing(true);
        } else if (editingRowId !== subtitle.id && isEditing) {
            setIsEditing(false); 
        }
    }, [editingRowId, subtitle.id, isEditing]);

    // Effect to update local state when subtitle prop changes or when entering edit mode
    React.useEffect(() => {
        setEditText(subtitle.text);
        setEditTranslation(subtitle.translation || '');
        setEditStart(subtitle.startTime);
        setEditEnd(subtitle.endTime);
        if (isEditing) {
            if (appearanceConfig.translationMode) {
                translationTextareaRef.current?.focus();
            } else {
                textareaRef.current?.focus();
            }
        }
    }, [subtitle, isEditing, appearanceConfig.translationMode]);

    const handleSave = () => {
        onUpdate(subtitle.id, { 
            startTime: editStart, 
            endTime: editEnd, 
            text: editText,
            translation: editTranslation
        });
        setIsEditing(false);
        onToggleEdit(null, false); 
    };

    const handleCancelEdit = () => {
        setEditText(subtitle.text);
        setEditTranslation(subtitle.translation || '');
        setEditStart(subtitle.startTime);
        setEditEnd(subtitle.endTime);
        setIsEditing(false);
        onToggleEdit(null, false);
    };
    
    const handleTextareaKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const toggleSelfEdit = () => {
        const newEditingState = !isEditing;
        onToggleEdit(subtitle.id, newEditingState); 
    };
    
    // Effect for temporarily highlighting the row on jump
    React.useEffect(() => {
        if (isActiveRow && itemRef && itemRef.current) { 
            setJumpHighlight(true);
            const timer = setTimeout(() => setJumpHighlight(false), 1200); 
            return () => clearTimeout(timer);
        }
    }, [isActiveRow, itemRef]);

    const hasErrors = errors && errors.length > 0;
    
    let rowClass = `bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`;
    if (jumpHighlight) {
        rowClass += ' animate-flash'; 
    } else if (isActiveRow) {
        rowClass += ' ring-2 ring-sky-500 dark:ring-sky-400 ring-offset-1 dark:ring-offset-slate-800';
    }
    
    if (isBeingDragged) {
        rowClass = `opacity-50 bg-sky-100 dark:bg-sky-800`;
    } else if (isSelected && !isActiveRow) { 
        rowClass = `bg-sky-100 dark:bg-sky-700/50 hover:bg-sky-200 dark:hover:bg-sky-600/50 transition-colors`;
    } else if (hasErrors && !isActiveRow && !isSelected) { 
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
                                value={editText} 
                                rows="3" 
                                className={`w-full p-2 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-400 ${fontClass}`}
                                readOnly 
                            ></textarea>
                        </td>
                        <td className="p-2 border-b border-slate-200 dark:border-slate-600 align-top">
                             <textarea 
                                ref={translationTextareaRef} value={editTranslation} onChange={e => setEditTranslation(e.target.value)} onKeyDown={handleTextareaKeyDown} rows="3" spellCheck={appearanceConfig.spellCheck}
                                dir={language === 'fa' ? 'rtl' : 'ltr'}
                                className={`w-full p-2 bg-white dark:bg-slate-500 rounded border border-slate-300 dark:border-slate-400 focus:ring-1 focus:ring-sky-500 ${fontClass}`}
                            ></textarea>
                        </td>
                    </>
                ) : (
                    <td className="p-2 border-b border-slate-200 dark:border-slate-600" colSpan="2">
                        <textarea 
                            ref={textareaRef} value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={handleTextareaKeyDown} rows="3" spellCheck={appearanceConfig.spellCheck}
                            className={`w-full p-2 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 focus:ring-1 focus:ring-sky-500 ${fontClass}`}
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
                <input type="checkbox" checked={isSelected} onChange={() => onSelect(subtitle.id)} className="mr-2 rtl:ml-2 rtl:mr-0 form-checkbox h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" onClick={(e) => e.stopPropagation()}/>
                {index + 1}
                {hasErrors && ( <div className="absolute top-1 right-1 group">...</div> )}
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
                <button onClick={toggleSelfEdit} className="p-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors" title={t('edit')}>...</button>
                <button onClick={() => onDelete(subtitle.id)} className="p-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors" title={t('delete')}>...</button>
                <button onClick={() => onSplit(subtitle.id)} className="p-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors" title={t('split')}>...</button>
                {!isLastItem && (<button onClick={() => onMergeNext(subtitle.id)} className="p-1.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors" title={t('mergeNext')}>...</button>)}
            </td>
        </tr>
    );
}
export default SubtitleItem;
