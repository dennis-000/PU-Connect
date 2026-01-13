import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';
import { monitorWebVitals } from './lib/performanceMonitor';

if (import.meta.env.DEV) {
  monitorWebVitals();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
