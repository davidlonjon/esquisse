import { useEffect } from 'react';

import { FavoritesListOverlay } from '@components/layout/FavoritesListOverlay';
import { TagsOverlay } from '@components/layout/TagsOverlay';
import { YearlyCalendarOverlay } from '@components/layout/YearlyCalendarOverlay';
import { SearchOverlay } from '@components/search/SearchOverlay';
import { useEntryStore } from '@features/entries/entries.store';
import { useSettingsStore } from '@features/settings';
import { useFavoritesList } from '@hooks/useFavoritesList';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useSearch } from '@hooks/useSearch';
import { useTagsOverlay } from '@hooks/useTagsOverlay';
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
  const favoritesList = useFavoritesList();
  const tagsOverlay = useTagsOverlay();
  const search = useSearch();

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

  // Register tags overlay shortcut (Cmd/Ctrl+Shift+T)
  useGlobalHotkeys(
    'mod+shift+t',
    (event) => {
      event.preventDefault();
      tagsOverlay.open();
    },
    { preventDefault: true }
  );

  // Register toggle favorite shortcut (Cmd+F)
  useGlobalHotkeys(
    'mod+f',
    (event) => {
      event.preventDefault();
      if (currentEntryId) {
        void toggleFavorite(currentEntryId);
      }
    },
    { preventDefault: true }
  );

  // Register favorites list shortcut (Cmd+Shift+F)
  useGlobalHotkeys(
    'mod+shift+f',
    (event) => {
      event.preventDefault();
      favoritesList.open();
    },
    { preventDefault: true }
  );

  // Register yearly calendar shortcut (Cmd/Ctrl+Shift+Y)
  useGlobalHotkeys(
    'mod+shift+y',
    (event) => {
      event.preventDefault();
      const initialDate = currentEntry ? new Date(currentEntry.createdAt) : undefined;
      yearlyCalendar.open(initialDate);
    },
    { preventDefault: true }
  );

  // Register search shortcut (Cmd+K)
  useGlobalHotkeys(
    'mod+k',
    (event) => {
      event.preventDefault();
      search.open();
    },
    { preventDefault: true }
  );

  return (
    <>
      <AppRouterProvider searchOpen={search.open} />
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
      <FavoritesListOverlay
        isOpen={favoritesList.isOpen}
        onClose={favoritesList.close}
        favoriteEntries={favoritesList.favoriteEntries}
        selectedIndex={favoritesList.selectedIndex}
        isEmpty={favoritesList.isEmpty}
        onSelectPrevious={favoritesList.selectPrevious}
        onSelectNext={favoritesList.selectNext}
        onNavigateToSelected={favoritesList.navigateToSelected}
        onUnfavoriteSelected={favoritesList.unfavoriteSelected}
        onToggleFavorite={favoritesList.toggleFavoriteEntry}
      />
      <TagsOverlay
        isOpen={tagsOverlay.isOpen}
        onClose={tagsOverlay.close}
        tagsWithCounts={tagsOverlay.tagsWithCounts}
        selectedTags={tagsOverlay.selectedTags}
        onToggleTag={tagsOverlay.toggleTag}
        onClearSelectedTags={tagsOverlay.clearSelectedTags}
        filteredEntries={tagsOverlay.filteredEntries}
        selectedEntryIndex={tagsOverlay.selectedEntryIndex}
        focusedTagIndex={tagsOverlay.focusedTagIndex}
        focusArea={tagsOverlay.focusArea}
        onFocusPreviousTag={tagsOverlay.focusPreviousTag}
        onFocusNextTag={tagsOverlay.focusNextTag}
        onSelectFocusedTag={tagsOverlay.selectFocusedTag}
        onSelectPreviousEntry={tagsOverlay.selectPreviousEntry}
        onSelectNextEntry={tagsOverlay.selectNextEntry}
        onNavigateToSelectedEntry={tagsOverlay.navigateToSelectedEntry}
        onSwitchFocusToEntries={tagsOverlay.switchFocusToEntries}
        onSwitchFocusToTags={tagsOverlay.switchFocusToTags}
        onToggleFavorite={tagsOverlay.handleToggleFavorite}
        onEntryClick={tagsOverlay.handleEntryClick}
        hasNoTags={tagsOverlay.hasNoTags}
        hasNoEntries={tagsOverlay.hasNoEntries}
      />
      <SearchOverlay
        isOpen={search.isOpen}
        onClose={search.close}
        inputValue={search.inputValue}
        onInputChange={search.handleInputChange}
        filters={search.filters}
        onFiltersChange={search.handleFiltersChange}
        availableTags={search.availableTags}
        searchResults={search.searchResults}
        selectedIndex={search.selectedIndex}
        isEmpty={search.isEmpty}
        isLoading={search.isLoading}
        hasError={search.hasError}
        errorMessage={search.errorMessage}
        onSelectPrevious={search.selectPrevious}
        onSelectNext={search.selectNext}
        onNavigateToSelected={search.navigateToSelected}
      />
    </>
  );
}
