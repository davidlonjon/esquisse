import clsx from 'clsx';
import type { Locale } from 'date-fns';
import { eachDayOfInterval, endOfMonth, format, getDay, isToday, startOfMonth } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface YearlyCalendarProps {
  year: number;
  hasEntriesOnDate: (date: Date) => boolean;
  getEntryCountForDate: (date: Date) => number;
  onDayClick: (date: Date) => void;
}

const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FR = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const MonthGrid = memo(
  ({
    month,
    year,
    locale,
    weekdays,
    hasEntriesOnDate,
    getEntryCountForDate,
    onDayClick,
  }: {
    month: number;
    year: number;
    locale: Locale;
    weekdays: string[];
    hasEntriesOnDate: (date: Date) => boolean;
    getEntryCountForDate: (date: Date) => number;
    onDayClick: (date: Date) => void;
  }) => {
    const monthDate = new Date(year, month, 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDay = getDay(monthStart);

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(startDay).fill(null);

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="flex flex-col">
        <h3 className="mb-2 text-center text-xs font-medium text-base-content/70">
          {format(monthDate, 'MMMM', { locale })}
        </h3>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
          {weekdays.map((day, i) => (
            <div key={i} className="text-base-content/40 font-medium py-0.5">
              {day}
            </div>
          ))}

          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-5 w-5" />;
              }

              const hasEntries = hasEntriesOnDate(day);
              const entryCount = hasEntries ? getEntryCountForDate(day) : 0;
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => hasEntries && onDayClick(day)}
                  disabled={!hasEntries}
                  className={clsx(
                    'relative h-5 w-5 rounded text-[10px] transition-colors',
                    hasEntries
                      ? 'cursor-pointer hover:bg-primary/20 text-base-content'
                      : 'cursor-default text-base-content/30',
                    today && 'ring-1 ring-primary/50'
                  )}
                  title={
                    hasEntries
                      ? `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`
                      : undefined
                  }
                >
                  {format(day, 'd')}
                  {hasEntries && (
                    <span
                      className={clsx(
                        'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                        entryCount > 1 ? 'bg-primary' : 'bg-primary/60'
                      )}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

MonthGrid.displayName = 'MonthGrid';

export const YearlyCalendar = memo(
  ({ year, hasEntriesOnDate, getEntryCountForDate, onDayClick }: YearlyCalendarProps) => {
    const { i18n } = useTranslation();
    const locale = i18n.language === 'fr' ? fr : enUS;
    const weekdays = i18n.language === 'fr' ? WEEKDAYS_FR : WEEKDAYS_EN;

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

    return (
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 lg:gap-8">
        {months.map((month) => (
          <MonthGrid
            key={month}
            month={month}
            year={year}
            locale={locale}
            weekdays={weekdays}
            hasEntriesOnDate={hasEntriesOnDate}
            getEntryCountForDate={getEntryCountForDate}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    );
  }
);

YearlyCalendar.displayName = 'YearlyCalendar';
