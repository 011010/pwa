/**
 * Main Entry Point
 *
 * Initializes the React application and renders the root component.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
