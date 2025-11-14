import { useEffect } from 'react';

import { useSettingsStore } from '@features/settings';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
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

  // Register settings shortcut (Cmd/Ctrl+,)
  // Using 'comma' instead of ',' for better compatibility
  useGlobalHotkeys(
    'mod+comma',
    (event) => {
      console.log('[App] Settings shortcut triggered!');
      event.preventDefault();
      router.navigate({ to: '/settings' });
    },
    { preventDefault: true }
  );

  return <AppRouterProvider />;
}
