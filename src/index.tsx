import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { FeatureFlagsProvider } from './featureFlags';
import reportWebVitals from './reportWebVitals';

// Ensure dark mode class is applied before React renders to avoid flash
try {
  const savedDark = localStorage.getItem('darkMode') === 'true';
  document.documentElement.classList.toggle('bh-dark', savedDark);
} catch {}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <FeatureFlagsProvider>
      <App />
    </FeatureFlagsProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
