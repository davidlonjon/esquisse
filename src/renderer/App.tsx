import { useEffect } from 'react';

import { useSettingsStore } from '@features/settings';
import i18n from '@lib/i18n';
import { useTheme } from '@providers/theme-provider';

import { AppRouterProvider, router } from './router';

export default function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const { setTheme } = useTheme();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    if (language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        router.navigate({ to: '/settings' });
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return <AppRouterProvider />;
}
