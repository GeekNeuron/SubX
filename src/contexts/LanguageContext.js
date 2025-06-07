// src/contexts/LanguageContext.js
import React from 'react';
// Importing all translation files
import { enTranslations } from '../locales/en';
import { faTranslations } from '../locales/fa';
import { esTranslations } from '../locales/es';
import { frTranslations } from '../locales/fr';
import { deTranslations } from '../locales/de';
import { itTranslations } from '../locales/it';
import { ptTranslations } from '../locales/pt';
import { jaTranslations } from '../locales/ja';
import { zhCNTranslations } from '../locales/zh-CN';

// Combining all translations into one object
const translations = {
    en: enTranslations,
    fa: faTranslations,
    es: esTranslations,
    fr: frTranslations,
    de: deTranslations,
    it: itTranslations,
    pt: ptTranslations,
    ja: jaTranslations,
    'zh-CN': zhCNTranslations,
};

const LanguageContext = React.createContext();

export function LanguageProvider({ children }) {
    // Get language from localStorage or default to English
    const [language, setLanguage] = React.useState(() => localStorage.getItem('subx-language') || 'en');

    // Effect to update localStorage and document attributes when language changes
    React.useEffect(() => {
        localStorage.setItem('subx-language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    }, [language]);

    const setLang = (lang) => setLanguage(lang);

    return (
        <LanguageContext.Provider value={{ language, setLang, translations }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Custom hook to use the language context
export function useLanguage() {
    const context = React.useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Custom hook for getting translated strings
export function useTranslation() {
    const { language, translations: transObj } = useLanguage();

    // The 't' function finds the key in the current language, or falls back to English, then to the key itself.
    return (key, ...args) => {
        const translation = transObj[language]?.[key] || transObj['en']?.[key] || key;

        // If the translation is a function (for dynamic strings), call it with provided arguments.
        if (typeof translation === 'function') {
            return translation(...args);
        }
        return translation;
    };
}
