import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './App';

// This is the entry point of the React application.
// It gets the root DOM element and renders the MainApp component into it.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
