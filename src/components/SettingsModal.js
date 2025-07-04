// src/components/SettingsModal.js
import React from 'react';
import { useSettings, DEFAULT_ERROR_CONFIG, DEFAULT_APPEARANCE_CONFIG } from '../contexts/SettingsContext';
import { useTranslation } from '../contexts/LanguageContext';

function SettingsModal({ isOpen, onClose, setNotification }) {
    const { 
        errorConfig, updateErrorConfig, resetErrorConfigToDefaults,
        appearanceConfig, updateAppearanceConfig, resetAppearanceConfigToDefaults
    } = useSettings();
    const t = useTranslation();
    
    // Local state to manage form inputs before saving
    const [localErrorConfig, setLocalErrorConfig] = React.useState(errorConfig);
    const [localAppearanceConfig, setLocalAppearanceConfig] = React.useState(appearanceConfig);

    // Sync local state if the global context changes while the modal is open
    React.useEffect(() => {
        setLocalErrorConfig(errorConfig);
    }, [errorConfig, isOpen]);

    React.useEffect(() => {
        setLocalAppearanceConfig(appearanceConfig);
    }, [appearanceConfig, isOpen]);

    if (!isOpen) return null;

    // Handle changes in number inputs for error config
    const handleErrorChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = parseInt(value, 10);
        setLocalErrorConfig(prev => ({ 
            ...prev, 
            [name]: isNaN(parsedValue) ? '' : parsedValue // Allow empty input temporarily
        }));
    };

    // Handle changes in appearance settings (checkboxes, selects)
    const handleAppearanceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLocalAppearanceConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = () => {
        // Validate and clean up error config before saving
        const validErrorConfig = { ...localErrorConfig };
        for (const key in validErrorConfig) {
            if (typeof validErrorConfig[key] !== 'number' || isNaN(validErrorConfig[key])) {
                validErrorConfig[key] = DEFAULT_ERROR_CONFIG[key]; // Revert to default if invalid
            }
        }
        updateErrorConfig(validErrorConfig);
        updateAppearanceConfig(localAppearanceConfig);
        setNotification({ message: t('settingsSaved'), type: 'success' });
        onClose();
    };

    const handleReset = () => {
        resetErrorConfigToDefaults();
        resetAppearanceConfigToDefaults();
        // Update local state to reflect the reset
        setLocalErrorConfig(DEFAULT_ERROR_CONFIG);
        setLocalAppearanceConfig(DEFAULT_APPEARANCE_CONFIG);
        setNotification({ message: t('settingsReset'), type: 'info' });
    };
    
    const inputClass = `w-full p-2 rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500`;
    const checkboxLabelClass = "flex items-center text-sm font-medium text-slate-700 dark:text-slate-300";
    const checkboxClass = "h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 mr-2 rtl:ml-2 rtl:mr-0";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('settings')}</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-medium mb-3 text-sky-600 dark:text-sky-400">{t('generalSettings')}</h3>
                        <div className="space-y-2">
                             <label className={checkboxLabelClass}><input type="checkbox" name="autosave" checked={localAppearanceConfig.autosave} onChange={handleAppearanceChange} className={checkboxClass} />{t('autosaveEnabled')}</label>
                             <label className={checkboxLabelClass}><input type="checkbox" name="translationMode" checked={localAppearanceConfig.translationMode} onChange={handleAppearanceChange} className={checkboxClass} />{t('translationMode')}</label>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-lg font-medium mb-3 text-sky-600 dark:text-sky-400">{t('errorCheckingSettings')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label htmlFor="MIN_DURATION_MS" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('minDuration')}</label><input type="number" name="MIN_DURATION_MS" id="MIN_DURATION_MS" value={localErrorConfig.MIN_DURATION_MS} onChange={handleErrorChange} className={inputClass} /></div>
                            <div><label htmlFor="MAX_DURATION_MS" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('maxDuration')}</label><input type="number" name="MAX_DURATION_MS" id="MAX_DURATION_MS" value={localErrorConfig.MAX_DURATION_MS} onChange={handleErrorChange} className={inputClass} /></div>
                            <div><label htmlFor="MAX_LINES" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('maxLines')}</label><input type="number" name="MAX_LINES" id="MAX_LINES" value={localErrorConfig.MAX_LINES} onChange={handleErrorChange} className={inputClass} /></div>
                            <div><label htmlFor="MAX_CHARS_PER_LINE" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('maxCharsPerLine')}</label><input type="number" name="MAX_CHARS_PER_LINE" id="MAX_CHARS_PER_LINE" value={localErrorConfig.MAX_CHARS_PER_LINE} onChange={handleErrorChange} className={inputClass} /></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-lg font-medium mb-3 text-sky-600 dark:text-sky-400">{t('editorSettings')}</h3>
                        <div className="space-y-2">
                            <label className={checkboxLabelClass}><input type="checkbox" name="showTotalLineCount" checked={localAppearanceConfig.showTotalLineCount} onChange={handleAppearanceChange} className={checkboxClass} />{t('showTotalLineCount')}</label>
                            <label className={checkboxLabelClass}><input type="checkbox" name="showCharCountPerLine" checked={localAppearanceConfig.showCharCountPerLine} onChange={handleAppearanceChange} className={checkboxClass} />{t('showCharCountPerLine')}</label>
                            <label className={checkboxLabelClass}><input type="checkbox" name="spellCheck" checked={localAppearanceConfig.spellCheck} onChange={handleAppearanceChange} className={checkboxClass} />{t('enableSpellCheck')}</label>
                        </div>
                    </section>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button onClick={handleSave} className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow text-sm transition-colors">{t('saveSettings')}</button>
                    <button onClick={handleReset} className="flex-1 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md shadow text-sm transition-colors">{t('resetToDefaults')}</button>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
