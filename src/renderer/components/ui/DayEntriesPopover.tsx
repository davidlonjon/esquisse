import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { X } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Entry } from '@shared/types';

interface DayEntriesPopoverProps {
  date: Date;
  entries: Entry[];
  onEntrySelect: (entryId: string) => void;
  onClose: () => void;
}

const entryTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const EntryItem = memo(
  ({
    entry,
    onSelect,
    emptyLabel,
  }: {
    entry: Entry;
    onSelect: (id: string) => void;
    emptyLabel: string;
  }) => {
    const plainText = useMemo(
      () => entry.content.replace(/<[^>]*>?/gm, '').trim() || emptyLabel,
      [entry.content, emptyLabel]
    );

    const time = useMemo(
      () => entryTimeFormatter.format(new Date(entry.createdAt)),
      [entry.createdAt]
    );

    return (
      <button
        onClick={() => onSelect(entry.id)}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-base-content/50 font-mono shrink-0">{time}</span>
          <span className="text-sm text-base-content truncate">{plainText}</span>
        </div>
      </button>
    );
  }
);

EntryItem.displayName = 'EntryItem';

export const DayEntriesPopover = memo(
  ({ date, entries, onEntrySelect, onClose }: DayEntriesPopoverProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'fr' ? fr : enUS;

    const formattedDate = useMemo(() => format(date, 'EEEE, MMMM d', { locale }), [date, locale]);

    const sortedEntries = useMemo(
      () =>
        [...entries].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      [entries]
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div
          className="bg-base-100 rounded-xl shadow-xl border border-base-200 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-label={t('yearlyCalendar.selectEntry')}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <div>
              <h3 className="font-medium text-base-content">{formattedDate}</h3>
              <p className="text-xs text-base-content/60">
                {t('yearlyCalendar.entriesCount', { count: entries.length })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-base-200 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-base-content/60" />
            </button>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {sortedEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onSelect={onEntrySelect}
                  emptyLabel={t('yearlyCalendar.emptyEntry')}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DayEntriesPopover.displayName = 'DayEntriesPopover';
