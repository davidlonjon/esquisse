import { useCallback, useMemo } from 'react';

import { selectCurrentEntry, selectEntries, useEntryStore } from '@features/entries';

interface UseEditorNavigationOptions {
  onNavigate?: () => void;
}

export function useEditorNavigation({ onNavigate }: UseEditorNavigationOptions = {}) {
  const entries = useEntryStore(selectEntries);
  const currentEntry = useEntryStore(selectCurrentEntry);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);

  const handleNavigatePrevious = useCallback(() => {
    if (entries.length === 0) return;

    const currentIndex = currentEntry
      ? entries.findIndex((entry) => entry.id === currentEntry.id)
      : -1;

    // From blank draft, go back to Entry 0 (most recent saved entry)
    if (currentIndex === -1) {
      const firstEntry = entries[0];
      if (!firstEntry) return;
      setCurrentEntry(firstEntry);
      onNavigate?.();
      return;
    }

    const targetIndex = currentIndex + 1; // Previous = older = higher index

    // Can't go past the last entry
    if (targetIndex >= entries.length) return;

    const targetEntry = entries[targetIndex];
    if (!targetEntry) return;
    setCurrentEntry(targetEntry);
    onNavigate?.();
  }, [entries, currentEntry, setCurrentEntry, onNavigate]);

  const handleNavigateNext = useCallback(() => {
    if (entries.length === 0) return;

    const currentIndex = currentEntry
      ? entries.findIndex((entry) => entry.id === currentEntry.id)
      : -1;

    // Don't navigate next from blank draft (already at newest position)
    if (currentIndex === -1) return;

    const targetIndex = currentIndex - 1; // Next = newer = lower index

    // From any entry, going next (towards newer)
    if (targetIndex < 0) {
      // Go to blank draft when going next from Entry 0
      setCurrentEntry(null);
      onNavigate?.();
      return;
    }

    const targetEntry = entries[targetIndex];
    if (!targetEntry) return;
    setCurrentEntry(targetEntry);
    onNavigate?.();
  }, [entries, currentEntry, setCurrentEntry, onNavigate]);

  // Determine navigation availability
  const canNavigatePrevious = useMemo(() => {
    if (entries.length === 0) return false;
    if (!currentEntry) return true; // Can go previous from blank draft to Entry 0
    const currentIndex = entries.findIndex((entry) => entry.id === currentEntry.id);
    return currentIndex < entries.length - 1; // Can go previous (older) if not at last entry
  }, [entries, currentEntry]);

  const canNavigateNext = useMemo(() => {
    if (entries.length === 0) return false;
    if (!currentEntry) return false; // Can't go next from blank draft
    // Can always go next (newer) from any entry - either to a newer entry or to blank draft
    return true;
  }, [entries, currentEntry]);

  return {
    handleNavigatePrevious,
    handleNavigateNext,
    canNavigatePrevious,
    canNavigateNext,
  };
}
