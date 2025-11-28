import { enUS, fr } from 'date-fns/locale';
import { useState, useMemo, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { createPortal } from 'react-dom';
import 'react-day-picker/dist/style.css';
import { useTranslation } from 'react-i18next';

import {
  parseISODate,
  toISOString,
  getMaxSelectableDate,
  combineDateAndTime,
  extractTime,
} from '@lib/date';

import { Button } from './Button';
import { Popover } from './Popover';
import { TimeInput } from './TimeInput';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  initialDate: string; // ISO string
  onDateTimeChange: (isoString: string) => void;
}

export function DateTimePicker({
  isOpen,
  onClose,
  anchorRef,
  initialDate,
  onDateTimeChange,
}: DateTimePickerProps) {
  const { t, i18n } = useTranslation();
  const use24Hour = i18n.language === 'fr';

  // Derive date and time from initialDate prop
  const parsedDate = useMemo(() => parseISODate(initialDate), [initialDate]);
  const parsedTime = useMemo(() => extractTime(parsedDate), [parsedDate]);

  const [selectedHours, setSelectedHours] = useState(parsedTime.hours);
  const [selectedMinutes, setSelectedMinutes] = useState(parsedTime.minutes);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      const combined = combineDateAndTime(date, selectedHours, selectedMinutes);
      const isoString = toISOString(combined);

      onDateTimeChange(isoString);
      onClose();
    },
    [selectedHours, selectedMinutes, onDateTimeChange, onClose]
  );

  const handleTimeChange = useCallback(
    (hours: number, minutes: number) => {
      setSelectedHours(hours);
      setSelectedMinutes(minutes);

      const combined = combineDateAndTime(parsedDate, hours, minutes);
      const isoString = toISOString(combined);

      onDateTimeChange(isoString);
    },
    [parsedDate, onDateTimeChange]
  );

  const content = (
    <Popover isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} className="p-0">
      <div className="flex flex-col gap-4 p-4">
        <DayPicker
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          disabled={{ after: getMaxSelectableDate() }}
          locale={i18n.language === 'fr' ? fr : enUS}
          className="rdp-custom"
        />

        <div className="border-t border-base-200 pt-4 dark:border-base-300/50">
          <label className="mb-2 block text-sm font-medium">{t('datePicker.time')}</label>
          <TimeInput
            hours={selectedHours}
            minutes={selectedMinutes}
            onChange={handleTimeChange}
            use24Hour={use24Hour}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const now = new Date();
            const isoString = toISOString(now);
            onDateTimeChange(isoString);
            onClose();
          }}
        >
          {t('datePicker.now')}
        </Button>
      </div>
    </Popover>
  );

  // Render in a portal to avoid being hidden when HUD hides
  return createPortal(content, document.body);
}
