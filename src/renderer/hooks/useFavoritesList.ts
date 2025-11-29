import { useCallback, useMemo, useState } from 'react';

import { router } from '@/router';
import { useEntryStore } from '@features/entries/entries.store';
import type { Entry } from '@shared/types';

export function useFavoritesList() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const entries = useEntryStore((state) => state.entries);
  const currentEntryId = useEntryStore((state) => state.currentEntryId);
  const setCurrentEntryId = useEntryStore((state) => state.setCurrentEntryId);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);

  const favoriteEntries = useMemo<Entry[]>(
    () =>
      entries
        .filter((entry) => entry.isFavorite)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries]
  );

  const open = useCallback(() => {
    setIsOpen(true);

    // Find current entry in favorites list and select it
    if (currentEntryId) {
      const index = favoriteEntries.findIndex((e) => e.id === currentEntryId);
      setSelectedIndex(index >= 0 ? index : 0);
    } else {
      setSelectedIndex(0);
    }
  }, [currentEntryId, favoriteEntries]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((current) => Math.max(0, current - 1));
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex((current) => Math.min(favoriteEntries.length - 1, current + 1));
  }, [favoriteEntries.length]);

  const navigateToSelected = useCallback(() => {
    const entry = favoriteEntries[selectedIndex];
    if (entry) {
      setCurrentEntryId(entry.id);
      close();
      void router.navigate({ to: '/' });
    }
  }, [favoriteEntries, selectedIndex, setCurrentEntryId, close]);

  const unfavoriteSelected = useCallback(() => {
    const entry = favoriteEntries[selectedIndex];
    if (entry) {
      void toggleFavorite(entry.id);
      // Adjust selection if we removed the last item
      if (selectedIndex >= favoriteEntries.length - 1 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
  }, [favoriteEntries, selectedIndex, toggleFavorite]);

  const selectedEntry = favoriteEntries[selectedIndex] ?? null;

  return {
    isOpen,
    open,
    close,
    favoriteEntries,
    selectedIndex,
    selectedEntry,
    selectPrevious,
    selectNext,
    navigateToSelected,
    unfavoriteSelected,
    isEmpty: favoriteEntries.length === 0,
  };
}
