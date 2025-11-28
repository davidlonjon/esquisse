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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base-100/95 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onPreviousYear}
              className="p-2 rounded-lg hover:bg-base-200 transition-colors"
              aria-label="Previous year"
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
              aria-label="Next year"
            >
              <ChevronRight className="h-5 w-5 text-base-content/70" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-base-content/70" />
          </button>
        </div>

        {/* Calendar Grid */}
        <YearlyCalendar
          year={year}
          hasEntriesOnDate={hasEntriesOnDate}
          getEntryCountForDate={getEntryCountForDate}
          onDayClick={onDayClick}
        />

        {/* Hint */}
        <p className="mt-6 text-center text-xs text-base-content/40">
          {t('hud.keyboard.shortcut.closeModal.label')}: Esc
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
