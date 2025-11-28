import { useCallback, useMemo, useState } from 'react';

import { router } from '@/router';
import { useEntryStore } from '@features/entries/entries.store';
import type { Entry } from '@shared/types';

export type EntriesByDate = Map<string, Entry[]>;

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useYearlyCalendar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const entries = useEntryStore((state) => state.entries);
  const setCurrentEntryId = useEntryStore((state) => state.setCurrentEntryId);

  const entriesByDate = useMemo<EntriesByDate>(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const dateKey = toDateKey(new Date(entry.createdAt));
      const existing = map.get(dateKey) || [];
      existing.push(entry);
      map.set(dateKey, existing);
    }
    return map;
  }, [entries]);

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedDate(null);
    setYear(new Date().getFullYear());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedDate(null);
  }, []);

  const goToPreviousYear = useCallback(() => {
    setYear((y) => y - 1);
  }, []);

  const goToNextYear = useCallback(() => {
    setYear((y) => y + 1);
  }, []);

  const goToCurrentYear = useCallback(() => {
    setYear(new Date().getFullYear());
  }, []);

  const getEntriesForDate = useCallback(
    (date: Date): Entry[] => {
      const dateKey = toDateKey(date);
      return entriesByDate.get(dateKey) || [];
    },
    [entriesByDate]
  );

  const hasEntriesOnDate = useCallback(
    (date: Date): boolean => {
      const dateKey = toDateKey(date);
      return entriesByDate.has(dateKey);
    },
    [entriesByDate]
  );

  const getEntryCountForDate = useCallback(
    (date: Date): number => {
      return getEntriesForDate(date).length;
    },
    [getEntriesForDate]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      const dayEntries = getEntriesForDate(date);

      if (dayEntries.length === 0) {
        return;
      }

      if (dayEntries.length === 1) {
        setCurrentEntryId(dayEntries[0].id);
        close();
        void router.navigate({ to: '/' });
        return;
      }

      // Multiple entries - show selection
      setSelectedDate(date);
    },
    [getEntriesForDate, setCurrentEntryId, close]
  );

  const handleEntrySelect = useCallback(
    (entryId: string) => {
      setCurrentEntryId(entryId);
      close();
      void router.navigate({ to: '/' });
    },
    [setCurrentEntryId, close]
  );

  const clearSelectedDate = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return {
    isOpen,
    open,
    close,
    year,
    goToPreviousYear,
    goToNextYear,
    goToCurrentYear,
    entriesByDate,
    selectedDate,
    selectedDateEntries: selectedDate ? getEntriesForDate(selectedDate) : [],
    hasEntriesOnDate,
    getEntryCountForDate,
    handleDayClick,
    handleEntrySelect,
    clearSelectedDate,
  };
}
