import React from 'react';

export const DEFAULT_ERROR_CONFIG = { 
    MIN_DURATION_MS: 1000, 
    MAX_DURATION_MS: 7000, 
    MAX_LINES: 2, 
    MAX_CHARS_PER_LINE: 42, 
    OVERLAP_FIX_GAP_MS: 1 
};
export const DEFAULT_APPEARANCE_CONFIG = { 
    tableFont: 'font-sans', 
    autosave: true, 
    showCharCountPerLine: true, 
    showTotalLineCount: true, 
    spellCheck: true,
    translationMode: false
}; 

const SettingsContext = React.createContext();

export function SettingsProvider({ children }) {
    const [errorConfig, setErrorConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-error-config');
        try {
            return saved ? { ...DEFAULT_ERROR_CONFIG, ...JSON.parse(saved) } : DEFAULT_ERROR_CONFIG;
        } catch (e) {
            return DEFAULT_ERROR_CONFIG;
        }
    });
    const [appearanceConfig, setAppearanceConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-appearance-config');
        try {
            return saved ? { ...DEFAULT_APPEARANCE_CONFIG, ...JSON.parse(saved) } : DEFAULT_APPEARANCE_CONFIG;
        } catch (e) {
            return DEFAULT_APPEARANCE_CONFIG;
        }
    });

    const updateErrorConfig = (newConfig) => {
        const updated = { ...errorConfig, ...newConfig };
        setErrorConfig(updated);
        localStorage.setItem('subx-error-config', JSON.stringify(updated));
    };
    const resetErrorConfigToDefaults = () => {
        setErrorConfig(DEFAULT_ERROR_CONFIG);
        localStorage.setItem('subx-error-config', JSON.stringify(DEFAULT_ERROR_CONFIG));
    };
    const updateAppearanceConfig = (newConfig) => {
        const updated = { ...appearanceConfig, ...newConfig };
        setAppearanceConfig(updated);
        localStorage.setItem('subx-appearance-config', JSON.stringify(updated));
    };
    const resetAppearanceConfigToDefaults = () => {
        setAppearanceConfig(DEFAULT_APPEARANCE_CONFIG);
        localStorage.setItem('subx-appearance-config', JSON.stringify(DEFAULT_APPEARANCE_CONFIG));
    };

    return (
        <SettingsContext.Provider value={{ 
            errorConfig, updateErrorConfig, resetErrorConfigToDefaults,
            appearanceConfig, updateAppearanceConfig, resetAppearanceConfigToDefaults
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() { 
    const context = React.useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

//
