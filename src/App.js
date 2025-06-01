// src/App.js
import React from 'react';
import Header from './components/Header';
import SubtitleEditor from './components/SubtitleEditor';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
// TwoPointSyncModal is now managed within SubtitleEditor
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// All text is now hardcoded in English in the components.
// LanguageContext and useTranslation have been removed.

function AppContent() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  // isTwoPointSyncModalOpen state is managed within SubtitleEditor

  const [notification, setNotification] = React.useState({ message: '', type: '' });
  const [showModalNotification, setShowModalNotification] = React.useState(false);

  // Effect for displaying notifications (e.g., settings saved)
  React.useEffect(() => {
    // This effect is for notifications triggered by modals within AppContent (Settings, Help)
    if (notification.message && (isSettingsModalOpen || isHelpModalOpen)) { 
      setShowModalNotification(true);
      const timer = setTimeout(() => {
        setShowModalNotification(false);
        const clearMessageTimer = setTimeout(() => {
          setNotification({ message: '', type: '' });
        }, 300); 
        return () => clearTimeout(clearMessageTimer);
      }, 2700); 
      return () => clearTimeout(timer);
    }
  }, [notification, isSettingsModalOpen, isHelpModalOpen]);

  // Service Worker registration
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js') 
          .then(registration => {
            console.log('SubX SW registered: ', registration.scope);
          })
          .catch(error => {
            console.log('SubX SW registration failed: ', error);
          });
      });
    }
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Header 
        onSettingsClick={() => setIsSettingsModalOpen(true)} 
        onHelpClick={() => setIsHelpModalOpen(true)}
      />
      <main className="flex-grow">
        {/* Pass setNotification for SubtitleEditor to show global notifications if needed */}
        <SubtitleEditor 
            setGlobalNotification={setNotification} 
        />
      </main>
      <Footer />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
        setNotification={setNotification} // Allows SettingsModal to show notifications via AppContent
      />
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      {/* Display notifications managed by AppContent (e.g., for Settings/Help modals) */}
       {notification.message && showModalNotification && !notification.isLoading && (
         <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-[150] transition-all duration-300 ${showModalNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'} ${notification.type === 'success' ? 'bg-green-500 text-white' : ''} ${notification.type === 'info' ? 'bg-sky-500 text-white' : ''}  ${notification.type === 'error' ? 'bg-red-500 text-white' : ''} ${notification.type === 'warning' ? 'bg-yellow-500 text-black' : ''}`}>
            {notification.message}
         </div>
       )}
    </div>
  );
}

export default function MainApp() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}
