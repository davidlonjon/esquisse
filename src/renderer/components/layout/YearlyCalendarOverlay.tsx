import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DayEntriesPopover } from '@components/ui/DayEntriesPopover';
import { YearlyCalendar } from '@components/ui/YearlyCalendar';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { Entry } from '@shared/types';

interface YearlyCalendarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
  onCurrentYear: () => void;
  focusedDate: Date;
  onFocusPreviousDay: () => void;
  onFocusNextDay: () => void;
  onFocusPreviousWeek: () => void;
  onFocusNextWeek: () => void;
  onFocusToday: () => void;
  onSelectFocusedDate: () => void;
  selectedDate: Date | null;
  selectedDateEntries: Entry[];
  hasEntriesOnDate: (date: Date) => boolean;
  getEntryCountForDate: (date: Date) => number;
  onDayClick: (date: Date) => void;
  onEntrySelect: (entryId: string) => void;
  onClearSelectedDate: () => void;
}

export function YearlyCalendarOverlay({
  isOpen,
  onClose,
  year,
  onPreviousYear,
  onNextYear,
  onCurrentYear,
  focusedDate,
  onFocusPreviousDay,
  onFocusNextDay,
  onFocusPreviousWeek,
  onFocusNextWeek,
  onFocusToday,
  onSelectFocusedDate,
  selectedDate,
  selectedDateEntries,
  hasEntriesOnDate,
  getEntryCountForDate,
  onDayClick,
  onEntrySelect,
  onClearSelectedDate,
}: YearlyCalendarOverlayProps) {
  const { t } = useTranslation();
  const { openModal, closeModal } = useHotkeysContext();

  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [isOpen, openModal, closeModal]);

  // Escape: close popover or overlay
  useGlobalHotkeys(
    'escape',
    () => {
      if (selectedDate) {
        onClearSelectedDate();
      } else {
        onClose();
      }
    },
    { enabled: isOpen },
    false
  );

  // Arrow keys for day navigation
  useGlobalHotkeys(
    'arrowleft',
    (e) => {
      e.preventDefault();
      onFocusPreviousDay();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  useGlobalHotkeys(
    'arrowright',
    (e) => {
      e.preventDefault();
      onFocusNextDay();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  useGlobalHotkeys(
    'arrowup',
    (e) => {
      e.preventDefault();
      onFocusPreviousWeek();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  useGlobalHotkeys(
    'arrowdown',
    (e) => {
      e.preventDefault();
      onFocusNextWeek();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  // Enter: select focused date
  useGlobalHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      onSelectFocusedDate();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  // t: jump to today
  useGlobalHotkeys(
    't',
    (e) => {
      e.preventDefault();
      onFocusToday();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  // Shift+arrows for year navigation
  useGlobalHotkeys(
    'shift+arrowleft',
    (e) => {
      e.preventDefault();
      onPreviousYear();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  useGlobalHotkeys(
    'shift+arrowright',
    (e) => {
      e.preventDefault();
      onNextYear();
    },
    { enabled: isOpen && !selectedDate },
    false
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base-100/95 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto px-6 py-8 overlay-panel-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onPreviousYear}
              className="p-2 rounded-lg hover:bg-base-200 transition-colors"
              aria-label={t('yearlyCalendar.previousYear')}
            >
              <ChevronLeft className="h-5 w-5 text-base-content/70" />
            </button>

            <button
              onClick={onCurrentYear}
              className="text-2xl font-semibold text-base-content hover:text-primary transition-colors"
            >
              {year}
            </button>

            <button
              onClick={onNextYear}
              disabled={year >= new Date().getFullYear()}
              className="p-2 rounded-lg hover:bg-base-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t('yearlyCalendar.nextYear')}
            >
              <ChevronRight className="h-5 w-5 text-base-content/70" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label={t('yearlyCalendar.close')}
          >
            <X className="h-5 w-5 text-base-content/70" />
          </button>
        </div>

        {/* Calendar Grid */}
        <YearlyCalendar
          year={year}
          focusedDate={focusedDate}
          hasEntriesOnDate={hasEntriesOnDate}
          getEntryCountForDate={getEntryCountForDate}
          onDayClick={onDayClick}
        />

        {/* Keyboard hints */}
        <p className="mt-6 text-center text-xs text-base-content/40">
          {t('yearlyCalendar.keyboardHints')}
        </p>
      </div>

      {/* Day entries popover */}
      {selectedDate && selectedDateEntries.length > 0 && (
        <DayEntriesPopover
          date={selectedDate}
          entries={selectedDateEntries}
          onEntrySelect={onEntrySelect}
          onClose={onClearSelectedDate}
        />
      )}
    </div>
  );
}
