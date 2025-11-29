import { useEffect } from 'react';

import { YearlyCalendarOverlay } from '@components/layout/YearlyCalendarOverlay';
import { useEntryStore } from '@features/entries/entries.store';
import { useSettingsStore } from '@features/settings';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useYearlyCalendar } from '@hooks/useYearlyCalendar';
import i18n from '@lib/i18n';
import { useTheme } from '@providers/theme-provider';

import { AppRouterProvider, router } from './router';

export default function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const { setTheme } = useTheme();
  const currentEntryId = useEntryStore((state) => state.currentEntryId);
  const entryLookup = useEntryStore((state) => state.entryLookup);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);
  const currentEntry = currentEntryId ? entryLookup[currentEntryId] : null;

  const yearlyCalendar = useYearlyCalendar();

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

  // Register yearly calendar shortcut (Cmd/Ctrl+Y)
  useGlobalHotkeys(
    'mod+y',
    (event) => {
      event.preventDefault();
      const initialDate = currentEntry ? new Date(currentEntry.createdAt) : undefined;
      yearlyCalendar.open(initialDate);
    },
    { preventDefault: true }
  );

  return (
    <>
      <AppRouterProvider />
      <YearlyCalendarOverlay
        isOpen={yearlyCalendar.isOpen}
        onClose={yearlyCalendar.close}
        year={yearlyCalendar.year}
        onPreviousYear={yearlyCalendar.goToPreviousYear}
        onNextYear={yearlyCalendar.goToNextYear}
        onCurrentYear={yearlyCalendar.goToCurrentYear}
        focusedDate={yearlyCalendar.focusedDate}
        onFocusPreviousDay={yearlyCalendar.focusPreviousDay}
        onFocusNextDay={yearlyCalendar.focusNextDay}
        onFocusPreviousWeek={yearlyCalendar.focusPreviousWeek}
        onFocusNextWeek={yearlyCalendar.focusNextWeek}
        onFocusToday={yearlyCalendar.focusToday}
        onSelectFocusedDate={yearlyCalendar.selectFocusedDate}
        selectedDate={yearlyCalendar.selectedDate}
        selectedDateEntries={yearlyCalendar.selectedDateEntries}
        hasEntriesOnDate={yearlyCalendar.hasEntriesOnDate}
        getEntryCountForDate={yearlyCalendar.getEntryCountForDate}
        onDayClick={yearlyCalendar.handleDayClick}
        onEntrySelect={yearlyCalendar.handleEntrySelect}
        onClearSelectedDate={yearlyCalendar.clearSelectedDate}
      />
    </>
  );
}
