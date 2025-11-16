import { useCallback } from 'react';

import { useEntryStore } from '@features/entries';
import type { Entry } from '@shared/types';

import { useGlobalHotkeys } from './useGlobalHotkeys';

interface UseEntryNavigationProps {
  entries: Entry[];
  currentEntry: Entry | null;
  onNavigate?: () => void;
}

export function useEntryNavigation({ entries, currentEntry, onNavigate }: UseEntryNavigationProps) {
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);

  const navigateEntry = useCallback(
    (direction: -1 | 1) => {
      if (entries.length === 0) {
        if (direction === -1) {
          setCurrentEntry(null);
          onNavigate?.();
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
          onNavigate?.();
        }
        return;
      }

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0) {
        setCurrentEntry(null);
        onNavigate?.();
        return;
      }

      if (targetIndex >= entries.length) {
        return;
      }

      const targetEntry = entries[targetIndex];
      if (!targetEntry) return;
      setCurrentEntry(targetEntry);
      onNavigate?.();
    },
    [entries, currentEntry, onNavigate, setCurrentEntry]
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
