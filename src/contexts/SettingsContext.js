// src/contexts/SettingsContext.js
import React from 'react';

// Default configurations for error checking and appearance
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
    translationMode: false // New setting for translation mode
}; 

const SettingsContext = React.createContext();

export function SettingsProvider({ children }) {
    // Load error configuration from localStorage or use defaults
    const [errorConfig, setErrorConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-error-config');
        try {
            // Merge saved config with defaults to ensure all keys are present
            return saved ? { ...DEFAULT_ERROR_CONFIG, ...JSON.parse(saved) } : DEFAULT_ERROR_CONFIG;
        } catch (e) {
            console.error("Failed to parse error config from localStorage", e);
            return DEFAULT_ERROR_CONFIG;
        }
    });
    const [appearanceConfig, setAppearanceConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-appearance-config');
        try {
            // Merge saved config with defaults
            return saved ? { ...DEFAULT_APPEARANCE_CONFIG, ...JSON.parse(saved) } : DEFAULT_APPEARANCE_CONFIG;
        } catch (e) {
            console.error("Failed to parse appearance config from localStorage", e);
            return DEFAULT_APPEARANCE_CONFIG;
        }
    });

    // Function to update error configuration
    const updateErrorConfig = (newConfig) => {
        const updated = { ...errorConfig, ...newConfig };
        setErrorConfig(updated);
        localStorage.setItem('subx-error-config', JSON.stringify(updated));
    };

    // Function to reset error configuration to defaults
    const resetErrorConfigToDefaults = () => {
        setErrorConfig(DEFAULT_ERROR_CONFIG);
        localStorage.setItem('subx-error-config', JSON.stringify(DEFAULT_ERROR_CONFIG));
    };

    // Function to update appearance configuration
    const updateAppearanceConfig = (newConfig) => {
        const updated = { ...appearanceConfig, ...newConfig };
        setAppearanceConfig(updated);
        localStorage.setItem('subx-appearance-config', JSON.stringify(updated));
    };

    // Function to reset appearance configuration to defaults
    const resetAppearanceConfigToDefaults = () => {
        setAppearanceConfig(DEFAULT_APPEARANCE_CONFIG);
        localStorage.setItem('subx-appearance-config', JSON.stringify(DEFAULT_APPEARANCE_CONFIG));
    };

    // Effect to ensure all default keys exist in the loaded config on initial mount
    React.useEffect(() => {
        // For Error Config
        const currentErrorCfg = JSON.parse(localStorage.getItem('subx-error-config') || '{}');
        const newErrorCfg = {...DEFAULT_ERROR_CONFIG, ...currentErrorCfg};
        if (JSON.stringify(newErrorCfg) !== JSON.stringify(currentErrorCfg)) {
            localStorage.setItem('subx-error-config', JSON.stringify(newErrorCfg));
            setErrorConfig(newErrorCfg); // Update state if migration occurred
        }

        // For Appearance Config
        const currentAppearanceCfg = JSON.parse(localStorage.getItem('subx-appearance-config') || '{}');
        const newAppearanceCfg = {...DEFAULT_APPEARANCE_CONFIG, ...currentAppearanceCfg};
        if (JSON.stringify(newAppearanceCfg) !== JSON.stringify(currentAppearanceCfg)) {
            localStorage.setItem('subx-appearance-config', JSON.stringify(newAppearanceCfg));
            setAppearanceConfig(newAppearanceCfg); // Update state if migration occurred
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

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
