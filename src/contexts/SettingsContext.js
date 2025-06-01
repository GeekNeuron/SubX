// src/contexts/SettingsContext.js
import React from 'react';

// Default configurations for error checking and appearance
export const DEFAULT_ERROR_CONFIG = { 
    MIN_DURATION_MS: 1000, 
    MAX_DURATION_MS: 7000, 
    MAX_LINES: 2, 
    MAX_CHARS_PER_LINE: 42, 
    OVERLAP_FIX_GAP_MS: 1 // Gap in ms to leave when fixing overlaps
};
export const DEFAULT_APPEARANCE_CONFIG = { 
    tableFont: 'font-sans', // Tailwind class for default sans-serif font
    autosave: true, 
    showCharCountPerLine: true, 
    showTotalLineCount: true, 
    spellCheck: true // Enable browser's native spell check by default
}; 

const SettingsContext = React.createContext();

export function SettingsProvider({ children }) {
    // Load error configuration from localStorage or use defaults
    const [errorConfig, setErrorConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-error-config');
        try {
            return saved ? { ...DEFAULT_ERROR_CONFIG, ...JSON.parse(saved) } : DEFAULT_ERROR_CONFIG;
        } catch (e) {
            console.error("Failed to parse error config from localStorage", e);
            return DEFAULT_ERROR_CONFIG;
        }
    });

    // Load appearance configuration from localStorage or use defaults
    const [appearanceConfig, setAppearanceConfig] = React.useState(() => {
        const saved = localStorage.getItem('subx-appearance-config');
        try {
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
        let needsErrorUpdate = false;
        const currentErrorCfg = JSON.parse(localStorage.getItem('subx-error-config') || '{}');
        const newErrorCfg = {...DEFAULT_ERROR_CONFIG, ...currentErrorCfg}; 
        Object.keys(DEFAULT_ERROR_CONFIG).forEach(key => {
            if (newErrorCfg[key] === undefined || typeof newErrorCfg[key] !== typeof DEFAULT_ERROR_CONFIG[key] ) {
                newErrorCfg[key] = DEFAULT_ERROR_CONFIG[key];
                needsErrorUpdate = true;
            }
        });
        if (needsErrorUpdate || JSON.stringify(newErrorCfg) !== JSON.stringify(currentErrorCfg)) {
            setErrorConfig(newErrorCfg);
            localStorage.setItem('subx-error-config', JSON.stringify(newErrorCfg));
        }

        let needsAppearanceUpdate = false;
        const currentAppearanceCfg = JSON.parse(localStorage.getItem('subx-appearance-config') || '{}');
        const newAppearanceCfg = {...DEFAULT_APPEARANCE_CONFIG, ...currentAppearanceCfg};
        Object.keys(DEFAULT_APPEARANCE_CONFIG).forEach(key => {
             if (newAppearanceCfg[key] === undefined || typeof newAppearanceCfg[key] !== typeof DEFAULT_APPEARANCE_CONFIG[key]) {
                newAppearanceCfg[key] = DEFAULT_APPEARANCE_CONFIG[key];
                needsAppearanceUpdate = true;
            }
        });
        if (needsAppearanceUpdate || JSON.stringify(newAppearanceCfg) !== JSON.stringify(currentAppearanceCfg)) {
            setAppearanceConfig(newAppearanceCfg);
            localStorage.setItem('subx-appearance-config', JSON.stringify(newAppearanceCfg));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <SettingsContext.Provider value={{ 
            errorConfig, updateErrorConfig, resetErrorConfigToDefaults, DEFAULT_ERROR_CONFIG,
            appearanceConfig, updateAppearanceConfig, resetAppearanceConfigToDefaults, DEFAULT_APPEARANCE_CONFIG 
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
