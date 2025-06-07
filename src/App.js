// src/App.js
import React from 'react';
import Header from './components/Header';
import SubtitleEditor from './components/SubtitleEditor';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [notification, setNotification] = React.useState({ message: '', type: '' });
  const { language } = useLanguage();

  React.useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(registration => console.log('SubX SW registered: ', registration.scope))
          .catch(error => console.log('SubX SW registration failed: ', error));
      });
    }
  }, []);
  
  return (
    <div className={`flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans ${language === 'fa' ? 'font-vazir' : ''}`}>
      <Header 
        onSettingsClick={() => setIsSettingsModalOpen(true)} 
        onHelpClick={() => setIsHelpModalOpen(true)}
      />
      <main className="flex-grow">
        <SubtitleEditor setGlobalNotification={setNotification} />
      </main>
      <Footer />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
        setNotification={setNotification} 
      />
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      {notification.message && !notification.isLoading && (
         <div className={`fixed top-20 p-4 rounded-md shadow-lg z-[150] transition-all duration-300 ${notification.message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'} ${language === 'fa' ? 'left-4' : 'right-4'} ${notification.type === 'success' ? 'bg-green-500 text-white' : ''} ${notification.type === 'error' ? 'bg-red-500 text-white' : ''} ${notification.type === 'info' ? 'bg-sky-500 text-white' : ''} ${notification.type === 'warning' ? 'bg-yellow-500 text-black' : ''} `}>
            {notification.message}
         </div>
       )}
    </div>
  );
}

export default function MainApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
