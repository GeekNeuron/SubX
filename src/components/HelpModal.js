// src/components/HelpModal.js
import React from 'react';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';

function HelpModal({ isOpen, onClose }) {
    const t = useTranslation();
    const { language } = useLanguage();

    if (!isOpen) return null;

    const helpItemClass = "mb-2";
    const helpKeyClass = "font-semibold text-sky-600 dark:text-sky-400";

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
                        {/* ... (previous help items) ... */}
                        <li className={helpItemClass}><strong className={helpKeyClass}>{'Performance'.split(':')[0]}:</strong> {t('helpPerformance').split(':').slice(1).join(':').trim()}</li>
                        <li className={helpItemClass}><strong className={helpKeyClass}>{t('helpVideoPlayer').split(':')[0]}:</strong> {t('helpVideoPlayer').split(':').slice(1).join(':').trim()}</li>
                        {/* ... (other help items) ... */}
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
