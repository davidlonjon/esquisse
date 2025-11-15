import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { ErrorBoundary } from '@layout/ErrorBoundary';
import i18n from '@lib/i18n';
import { HotkeysProvider } from '@providers/hotkeys-provider';
import { ThemeProvider } from '@providers/theme-provider';

import '../index.css';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
        <HotkeysProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </HotkeysProvider>
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>
);
