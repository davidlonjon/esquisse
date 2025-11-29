import { useCallback, useState } from 'react';

import { selectCurrentEntry, useEntryStore } from '@features/entries/entries.store';
import type { MoodValue } from '@shared/types';
import { MOOD_VALUES } from '@shared/types';

export function useMoodPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(2); // Default to neutral (index 2 = value 3)
  const currentEntry = useEntryStore(selectCurrentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const currentMood = currentEntry?.mood ?? null;

  const open = useCallback(() => {
    setIsOpen(true);
    // Set selection to current mood or neutral
    if (currentMood) {
      const index = MOOD_VALUES.indexOf(currentMood);
      setSelectedIndex(index >= 0 ? index : 2);
    } else {
      setSelectedIndex(2); // Neutral
    }
  }, [currentMood]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // When mood is set, allow navigating to clear option (index 5)
  const maxIndex = currentMood !== null ? MOOD_VALUES.length : MOOD_VALUES.length - 1;

  const selectPrevious = useCallback(() => {
    setSelectedIndex((current) => Math.max(0, current - 1));
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex((current) => Math.min(maxIndex, current + 1));
  }, [maxIndex]);

  const selectMood = useCallback(
    async (mood: MoodValue | null) => {
      if (currentEntry) {
        await updateEntry(currentEntry.id, { mood });
      }
      close();
    },
    [currentEntry, updateEntry, close]
  );

  const selectCurrentMood = useCallback(async () => {
    // Index 5 is the clear option
    if (selectedIndex === MOOD_VALUES.length) {
      await selectMood(null);
    } else {
      const mood = MOOD_VALUES[selectedIndex];
      await selectMood(mood);
    }
  }, [selectedIndex, selectMood]);

  const selectByNumber = useCallback(
    async (num: number) => {
      if (num >= 1 && num <= 5) {
        await selectMood(num as MoodValue);
      }
    },
    [selectMood]
  );

  const clearMood = useCallback(async () => {
    await selectMood(null);
  }, [selectMood]);

  return {
    isOpen,
    open,
    close,
    toggle,
    selectedIndex,
    currentMood,
    selectPrevious,
    selectNext,
    selectMood,
    selectCurrentMood,
    selectByNumber,
    clearMood,
    hasEntry: !!currentEntry,
  };
}
