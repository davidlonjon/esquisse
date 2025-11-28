import { useTranslation } from 'react-i18next';

import { Input } from './Input';

interface TimeInputProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  use24Hour: boolean;
}

export function TimeInput({ hours, minutes, onChange, use24Hour }: TimeInputProps) {
  const { t } = useTranslation();

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) return;
    const max = use24Hour ? 23 : 12;
    const clamped = Math.max(0, Math.min(max, value));
    onChange(clamped, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) return;
    const clamped = Math.max(0, Math.min(59, value));
    onChange(hours, clamped);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={hours}
        onChange={handleHoursChange}
        min={0}
        max={use24Hour ? 23 : 12}
        className="w-16 text-center"
        aria-label={t('datePicker.hours')}
      />
      <span className="text-lg">:</span>
      <Input
        type="number"
        value={minutes}
        onChange={handleMinutesChange}
        min={0}
        max={59}
        className="w-16 text-center"
        aria-label={t('datePicker.minutes')}
      />
    </div>
  );
}
