// src/App.js
import React from 'react';
import Header from './components/Header';
import SubtitleEditor from './components/SubtitleEditor';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import TwoPointSyncModal from './components/TwoPointSyncModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// All text is now hardcoded in English in the components
// LanguageContext and useTranslation are removed for a single-language (English) app.

function AppContent() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [isTwoPointSyncModalOpen, setIsTwoPointSyncModalOpen] = React.useState(false); 

  const [notification, setNotification] = React.useState({ message: '', type: '' });
  const [showModalNotification, setShowModalNotification] = React.useState(false);

  // Effect for displaying notifications within modals
  React.useEffect(() => {
    if (notification.message && (isSettingsModalOpen || isHelpModalOpen || isTwoPointSyncModalOpen)) {
      setShowModalNotification(true);
      const timer = setTimeout(() => {
        setShowModalNotification(false);
        // Delay clearing the message to allow fade-out animation
        const clearMessageTimer = setTimeout(() => {
          setNotification({ message: '', type: '' });
        }, 300); 
        return () => clearTimeout(clearMessageTimer);
      }, 2700); // Notification display time (e.g., 3 seconds - 0.3s fade)
      return () => clearTimeout(timer);
    }
  }, [notification, isSettingsModalOpen, isHelpModalOpen, isTwoPointSyncModalOpen]);

  // Service Worker registration
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js') // Path relative to public/index.html
          .then(registration => {
            console.log('SubX SW registered: ', registration.scope);
          })
          .catch(error => {
            console.log('SubX SW registration failed: ', error);
          });
      });
    }
  }, []);
  
  // Function to open the Two-Point Sync modal, passed to SubtitleEditor
  const openTwoPointSyncModal = () => setIsTwoPointSyncModalOpen(true);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header 
        onSettingsClick={() => setIsSettingsModalOpen(true)} 
        onHelpClick={() => setIsHelpModalOpen(true)}
      />
      <main className="flex-grow">
        <SubtitleEditor 
          openTwoPointSyncModal={openTwoPointSyncModal} 
        />
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
      <TwoPointSyncModal
        isOpen={isTwoPointSyncModalOpen}
        onClose={() => setIsTwoPointSyncModalOpen(false)}
        // Pass other necessary props to TwoPointSyncModal (e.g., subtitles, setEditorState)
        // This will be handled within SubtitleEditor where the state resides
        setNotification={setNotification} 
      />

      {/* Modal-specific notifications (if any) */}
      {notification.message && (isSettingsModalOpen || isHelpModalOpen || isTwoPointSyncModalOpen) && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-[150] transition-all duration-300 ${showModalNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'} ${notification.type === 'success' ? 'bg-green-500 text-white' : ''} ${notification.type === 'info' ? 'bg-sky-500 text-white' : ''}  ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}`}>
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
