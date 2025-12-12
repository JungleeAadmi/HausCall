import React from 'react';
import ReactDOM from 'react-dom/client';

// --- POLYFILLS FOR SIMPLE-PEER (CRITICAL FIX) ---
import * as process from 'process';
window.global = window;
window.process = process;
window.Buffer = require('buffer').Buffer;
// ------------------------------------------------

import './index.css';
import App from './App';

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