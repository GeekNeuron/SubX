import React from 'react';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';

function Footer() {
    const t = useTranslation();
    const { language } = useLanguage();

    return (
        <footer className={`text-center p-4 mt-8 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 ${language === 'fa' ? 'font-vazir' : ''}`}>
            <p>{t('footerText')}</p>
            <p>
                GitHub: <a href="https://github.com/GeekNeuron/SubX" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">GeekNeuron/SubX</a>
            </p>
        </footer>
    );
}

export default Footer;
