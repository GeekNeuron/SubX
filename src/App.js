import React from 'react';
import Header from './components/Header.js';
import SubtitleEditor from './components/SubtitleEditor.js';
import Footer from './components/Footer.js';
import SettingsModal from './components/SettingsModal.js';
import HelpModal from './components/HelpModal.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { SettingsProvider } from './contexts/SettingsContext.js';
import { LanguageProvider, useLanguage, useTranslation } from './contexts/LanguageContext.js';

const UpdateNotification = ({ registration }) => {
    const t = useTranslation();
    const [show, setShow] = React.useState(true);

    const handleUpdate = () => {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[200] p-4 bg-sky-600 text-white rounded-lg shadow-lg flex items-center gap-4">
            <span>{t('appUpdateAvailable')}</span>
            <button 
                onClick={handleUpdate}
                className="px-3 py-1 bg-white text-sky-700 font-bold rounded hover:bg-slate-200"
            >
                {t('reload')}
            </button>
        </div>
    );
};

function AppContent() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [notification, setNotification] = React.useState({ message: '', type: '' });
  const [showUpdateNotification, setShowUpdateNotification] = React.useState(false);
  const [swRegistration, setSwRegistration] = React.useState(null);
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
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('SubX SW registered:', registration.scope);
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setSwRegistration(registration);
                            setShowUpdateNotification(true);
                        }
                    };
                }
            };
        })
        .catch(error => console.log('SubX SW registration failed:', error));

      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          window.location.reload();
          refreshing = true;
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
       {showUpdateNotification && swRegistration && (<UpdateNotification registration={swRegistration} />)}
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
