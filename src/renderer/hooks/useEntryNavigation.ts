import { useCallback } from 'react';

import { useEntryStore } from '@features/entries';
import type { Entry } from '@shared/types';

import { useGlobalHotkeys } from './useGlobalHotkeys';
import { useHud } from './useHud'; // Import useHud

interface UseEntryNavigationProps {
  entries: Entry[];
  currentEntry: Entry | null;
}

export function useEntryNavigation({ entries, currentEntry }: UseEntryNavigationProps) {
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);
  const { showHudTemporarily } = useHud(); // Use useHud directly

  const navigateEntry = useCallback(
    (direction: -1 | 1) => {
      if (entries.length === 0) {
        if (direction === -1) {
          setCurrentEntry(null);
          showHudTemporarily();
        }
        return;
      }

      const currentIndex = currentEntry
        ? entries.findIndex((entry) => entry.id === currentEntry.id)
        : -1;

      if (currentIndex === -1) {
        if (direction === 1) {
          const firstEntry = entries[0];
          setCurrentEntry(firstEntry);
          showHudTemporarily();
        }
        return;
      }

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0) {
        setCurrentEntry(null);
        showHudTemporarily();
        return;
      }

      if (targetIndex >= entries.length) {
        return;
      }

      const targetEntry = entries[targetIndex];
      if (!targetEntry) return;
      setCurrentEntry(targetEntry);
      showHudTemporarily();
    },
    [entries, currentEntry, setCurrentEntry, showHudTemporarily]
  );

  // Register entry navigation shortcuts
  // Cmd/Ctrl+[ = navigate to next entry
  // Using 'bracketleft' instead of '[' for better compatibility
  useGlobalHotkeys(
    'mod+bracketleft',
    (event) => {
      event.preventDefault();
      navigateEntry(1);
    },
    { preventDefault: true }
  );

  // Cmd/Ctrl+] = navigate to previous entry
  // Using 'bracketright' instead of ']' for better compatibility
  useGlobalHotkeys(
    'mod+bracketright',
    (event) => {
      event.preventDefault();
      navigateEntry(-1);
    },
    { preventDefault: true }
  );
}
