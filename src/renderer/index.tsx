import React from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '@layout/ErrorBoundary';

import '../index.css';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
