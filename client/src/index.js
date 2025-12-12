import React from 'react';
import ReactDOM from 'react-dom/client';
import * as process from 'process';
import './index.css';
import App from './App';

// --- POLYFILLS FOR SIMPLE-PEER (CRITICAL FIX) ---
// Note: Imports must be above this block.
// Assignments must be below imports but before App rendering.
window.global = window;
window.process = process;
window.Buffer = require('buffer').Buffer;
// ------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW Registered: ', reg.scope))
      .catch(err => console.log('SW Registration Failed: ', err));
  });
}