// src/components/Footer.js
import React from 'react';

function Footer() {
    return (
        <footer className="text-center p-4 mt-8 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
            <p>SubX by GeekNeuron - Fully Offline Subtitle Editor</p>
            <p>
                GitHub: <a href="https://github.com/GeekNeuron/SubX" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">GeekNeuron/SubX</a>
            </p>
        </footer>
    );
}

export default Footer;
