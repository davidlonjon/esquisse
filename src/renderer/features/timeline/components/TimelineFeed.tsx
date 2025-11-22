import { Heart } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useEntryStore } from '@features/entries/entries.store';

export function TimelineFeed() {
  const { t } = useTranslation();
  const entries = useEntryStore((state) => state.entries);
  const loadEntries = useEntryStore((state) => state.loadEntries);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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

          {entries.length === 0 ? (
            <div className="py-12 text-center text-base-content/50">
              {t('timeline.feed.empty', 'No entries found. Start writing!')}
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-xl border border-base-200 bg-base-50 p-6 transition-shadow hover:shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold text-base-content">
                    {new Intl.DateTimeFormat('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(entry.createdAt))}
                  </div>
                  <button
                    className="opacity-0 transition-all group-hover:opacity-100 p-2 rounded-full hover:bg-base-200 hover:text-error"
                    title={t('timeline.feed.favorite', 'Favorite')}
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 text-base-content/80 line-clamp-3">
                  {entry.content.replace(/<[^>]*>?/gm, '') || 'Empty entry...'}
                </div>

                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  {entry.tags?.map((tag) => (
                    <span key={tag} className="bg-base-200 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {entry.tags && entry.tags.length > 0 && <span>·</span>}
                  <span>
                    {t('timeline.feed.words', '{{count}} words', {
                      count: entry.content.split(/\s+/).length,
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
