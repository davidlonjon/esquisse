import { useCallback } from 'react';

import { useEntryStore } from '@features/entries';
import { Entry } from '@shared/ipc-types';

import { useGlobalHotkeys } from './useGlobalHotkeys';

interface UseEntryNavigationProps {
  entries: Entry[];
  currentEntry: Entry | null;
  setContent: (content: string) => void;
  showHudTemporarily: () => void;
}

export function useEntryNavigation({
  entries,
  currentEntry,
  setContent,
  showHudTemporarily,
}: UseEntryNavigationProps) {
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);

  const navigateEntry = useCallback(
    (direction: -1 | 1) => {
      if (entries.length === 0) {
        if (direction === -1) {
          setCurrentEntry(null);
          setContent('');
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
          setContent(firstEntry.content ?? '');
          showHudTemporarily();
        }
        return;
      }

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0) {
        setCurrentEntry(null);
        setContent('');
        showHudTemporarily();
        return;
      }

      if (targetIndex >= entries.length) {
        return;
      }

      const targetEntry = entries[targetIndex];
      if (!targetEntry) return;
      setCurrentEntry(targetEntry);
      setContent(targetEntry.content ?? '');
      showHudTemporarily();
    },
    [entries, currentEntry, setCurrentEntry, setContent, showHudTemporarily]
  );

  // Register entry navigation shortcuts
  // Cmd/Ctrl+[ = navigate to next entry
  // Using 'bracketleft' instead of '[' for better compatibility
  useGlobalHotkeys(
    'mod+bracketleft',
    (event) => {
      console.log('[useEntryNavigation] Next entry shortcut triggered!');
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
      console.log('[useEntryNavigation] Previous entry shortcut triggered!');
      event.preventDefault();
      navigateEntry(-1);
    },
    { preventDefault: true }
  );
}
