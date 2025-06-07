import React from 'react';
import { enTranslations } from '../locales/en';
import { faTranslations } from '../locales/fa';

const translations = {
    en: enTranslations,
    fa: faTranslations,
};

const LanguageContext = React.createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = React.useState(() => localStorage.getItem('subx-language') || 'en');

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

export function useLanguage() {
    const context = React.useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function useTranslation() {
    const { language, translations: transObj } = useLanguage();

    return (key, ...args) => {
        const translation = transObj[language]?.[key] || transObj['en']?.[key] || key;

        if (typeof translation === 'function') {
            return translation(...args);
        }
        return translation;
    };
}
