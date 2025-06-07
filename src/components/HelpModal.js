// src/components/HelpModal.js
import React from 'react';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';

function HelpModal({ isOpen, onClose }) {
    const t = useTranslation();
    const { language } = useLanguage();

    if (!isOpen) return null;

    const helpItemClass = "mb-2";
    const helpKeyClass = "font-semibold text-sky-600 dark:text-sky-400";

    const getHelpText = (key) => {
        const text = t(key);
        // This splits "Key: Value" into "Value" to avoid repeating the key
        return text.split(':').slice(1).join(':').trim();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('helpTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className={`text-sm text-slate-700 dark:text-slate-300 space-y-3 ${language === 'fa' ? 'font-vazir' : ''}`}>
                    <p>{t('helpIntro')}</p>
                    <ul className={`list-disc list-inside space-y-1 ${language === 'fa' ? 'pr-4' : 'pl-4'}`}>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpFileUpload').split(':')[0]}:</strong> {getHelpText('helpFileUpload')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpVideoPlayer').split(':')[0]}:</strong> {getHelpText('helpVideoPlayer')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpEditing').split(':')[0]}:</strong> {getHelpText('helpEditing')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpActions').split(':')[0]}:</strong> {getHelpText('helpActions')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpBulkActions').split(':')[0]}:</strong> {getHelpText('helpBulkActions')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpFindReplace').split(':')[0]}:</strong> {getHelpText('helpFindReplace')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpShiftTimes').split(':')[0]}:</strong> {getHelpText('helpShiftTimes')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpTwoPointSync').split(':')[0]}:</strong> {getHelpText('helpTwoPointSync')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpErrorChecking').split(':')[0]}:</strong> {getHelpText('helpErrorChecking')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpUndoRedo').split(':')[0]}:</strong> {getHelpText('helpUndoRedo')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpSaving').split(':')[0]}:</strong> {getHelpText('helpSaving')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('translationMode').split(':')[0]}:</strong> {getHelpText('helpTranslationMode')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpSettings').split(':')[0]}:</strong> {getHelpText('helpSettings')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{'Performance'.split(':')[0]}:</strong> {getHelpText('helpPerformance')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{'Offline & PWA'.split(':')[0]}:</strong> {getHelpText('helpOffline')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('jumpToLine').split(':')[0]}:</strong> {getHelpText('helpJumpToLine')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{'Keyboard Navigation'.split(':')[0]}:</strong> {getHelpText('helpKeyboardNav')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('visualTimeline').split(':')[0]}:</strong> {getHelpText('helpTimeline')}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('waveformDisplay').split(':')[0]}:</strong> {getHelpText('helpWaveform')}</li>
                    </ul>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow text-sm transition-colors">{t('closeHelp')}</button>
                </div>
            </div>
        </div>
    );
}

export default HelpModal;
