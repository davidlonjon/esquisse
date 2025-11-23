import { useEffect } from 'react';

import { useEntryStore } from '@features/entries/entries.store';
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
  const currentEntryId = useEntryStore((state) => state.currentEntryId);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);

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
      event.preventDefault();
      router.navigate({ to: '/settings' });
    },
    { preventDefault: true }
  );

  // Register timeline shortcut (Cmd/Ctrl+T)
  useGlobalHotkeys(
    'mod+t',
    (event) => {
      event.preventDefault();
      router.navigate({ to: '/timeline' });
    },
    { preventDefault: true }
  );

  // Register toggle favorite shortcut (Cmd+Shift+F)
  useGlobalHotkeys(
    'mod+shift+f',
    (event) => {
      event.preventDefault();
      if (currentEntryId) {
        void toggleFavorite(currentEntryId);
      }
    },
    { preventDefault: true }
  );

  return <AppRouterProvider />;
}
