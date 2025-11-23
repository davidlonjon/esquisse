import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { router } from '@/router';
import { useEntryStore } from '@features/entries/entries.store';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import type { Entry } from '@shared/types';

import type { TimelineFilter } from '../Timeline';

interface TimelineFeedProps {
  filter: TimelineFilter;
}

// Memoize DateTimeFormat to avoid creating it for every entry render
const entryDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const TimelineEntry = memo(
  ({
    entry,
    index,
    isSelected,
    onSelect,
    onToggleFavorite,
  }: {
    entry: Entry;
    index: number;
    isSelected: boolean;
    onSelect: (index: number, entryId: string) => void;
    onToggleFavorite: (id: string) => void;
  }) => {
    const { t } = useTranslation();

    // Memoize plain text content to avoid regex on every render
    const plainText = useMemo(
      () => entry.content.replace(/<[^>]*>?/gm, '') || 'Empty entry...',
      [entry.content]
    );

    const wordCount = useMemo(() => entry.content.split(/\s+/).length, [entry.content]);

    return (
      <div
        id={`timeline-entry-${index}`}
        onClick={() => onSelect(index, entry.id)}
        className={clsx(
          'group relative rounded-xl border p-6 transition-all hover:shadow-sm cursor-pointer',
          isSelected
            ? 'border-primary ring-1 ring-primary bg-base-50 shadow-sm'
            : 'border-base-200 bg-base-50 hover:border-primary/50'
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold text-base-content">
            {entryDateFormatter.format(new Date(entry.createdAt))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(entry.id);
            }}
            className={clsx(
              'transition-all p-2 rounded-full z-10 relative',
              entry.isFavorite
                ? 'opacity-100 text-error bg-error/10 hover:bg-error/20'
                : 'opacity-0 group-hover:opacity-100 hover:bg-base-200 hover:text-error',
              isSelected && !entry.isFavorite && 'opacity-50' // Show empty heart hint when selected
            )}
            title={t('timeline.feed.favorite', 'Favorite')}
          >
            <Heart className={clsx('h-4 w-4', entry.isFavorite && 'fill-current')} />
          </button>
        </div>

        <div className="mb-4 text-base-content/80 line-clamp-3">{plainText}</div>

        <div className="flex items-center gap-3 text-xs text-base-content/60">
          {entry.tags?.map((tag) => (
            <span key={tag} className="bg-base-200 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {entry.tags && entry.tags.length > 0 && <span>·</span>}
          <span>{t('timeline.feed.words', '{{count}} words', { count: wordCount })}</span>
        </div>
      </div>
    );
  }
);

TimelineEntry.displayName = 'TimelineEntry';

export function TimelineFeed({ filter }: TimelineFeedProps) {
  const { t } = useTranslation();
  const entries = useEntryStore((state) => state.entries);
  const loadEntries = useEntryStore((state) => state.loadEntries);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);
  const setCurrentEntryId = useEntryStore((state) => state.setCurrentEntryId);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    switch (filter) {
      case 'favorites':
        return entries.filter((entry) => entry.isFavorite);
      case 'today':
        return entries.filter((entry) => {
          const entryDate = new Date(entry.createdAt);
          const today = new Date();
          return (
            entryDate.getDate() === today.getDate() &&
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getFullYear() === today.getFullYear()
          );
        });
      default:
        return entries;
    }
  }, [entries, filter]);

  // Scroll selected entry into view
  const scrollToEntry = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const element = document.getElementById(`timeline-entry-${index}`);
    if (element) {
      element.scrollIntoView({ behavior, block: 'nearest' });
    }
  }, []);

  useGlobalHotkeys(
    'arrowdown',
    useCallback(
      (e) => {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(filteredEntries.length - 1, prev + 1);
          scrollToEntry(next, 'auto'); // Instant scroll for keyboard nav
          return next;
        });
      },
      [filteredEntries.length, scrollToEntry]
    ),
    { enabled: filteredEntries.length > 0 }
  );

  useGlobalHotkeys(
    'arrowup',
    useCallback(
      (e) => {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.max(0, prev - 1);
          scrollToEntry(next, 'auto'); // Instant scroll for keyboard nav
          return next;
        });
      },
      [scrollToEntry]
    ),
    { enabled: filteredEntries.length > 0 }
  );

  useGlobalHotkeys(
    'enter',
    useCallback(
      (e) => {
        if (filteredEntries[selectedIndex]) {
          e.preventDefault();
          setCurrentEntryId(filteredEntries[selectedIndex].id);
          void router.navigate({ to: '/' });
        }
      },
      [filteredEntries, selectedIndex, setCurrentEntryId]
    ),
    { enabled: filteredEntries.length > 0 }
  );

  const handleSelect = useCallback(
    (index: number, entryId: string) => {
      setSelectedIndex(index);
      setCurrentEntryId(entryId);
      void router.navigate({ to: '/' });
    },
    [setCurrentEntryId]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      void toggleFavorite(id);
    },
    [toggleFavorite]
  );

  return (
    <main className="flex-1 overflow-y-auto bg-base-100 px-8 pt-8 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Spacer to align with Sidebar "Collections" header (Button height + mb-6) */}
        <div className="mb-6 h-5" aria-hidden="true" />

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
            {t('timeline.title', 'Timeline')}
          </h1>
          <div className="text-xs text-base-content/50">
            {t('timeline.navigation', '↑ ↓ Navigate · Enter open')}
          </div>
        </div>

        <div className="space-y-6">
          <div className="mb-6 text-sm font-medium text-base-content">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
              new Date()
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-base-content/50">
              {t('timeline.feed.empty', 'No entries found. Start writing!')}
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                index={index}
                isSelected={index === selectedIndex}
                onSelect={handleSelect}
                onToggleFavorite={handleToggleFavorite}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
