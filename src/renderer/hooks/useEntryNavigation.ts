import { useCallback, useEffect } from 'react';

import { useEntryStore } from '@features/entries';
import { Entry } from '@shared/ipc-types';

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

  useEffect(() => {
    const handleEntryNavigation = (event: KeyboardEvent) => {
      const isMetaCombo = event.metaKey || event.ctrlKey;
      if (!isMetaCombo) return;
      if (event.key === '[') {
        event.preventDefault();
        navigateEntry(1);
      } else if (event.key === ']') {
        event.preventDefault();
        navigateEntry(-1);
      }
    };

    window.addEventListener('keydown', handleEntryNavigation);
    return () => {
      window.removeEventListener('keydown', handleEntryNavigation);
    };
  }, [navigateEntry]);
}
