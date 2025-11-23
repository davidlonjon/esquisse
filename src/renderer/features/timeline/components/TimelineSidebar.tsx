import { useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TimelineFilter } from '../Timeline';

interface TimelineSidebarProps {
  currentFilter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
}

export function TimelineSidebar({ currentFilter, onFilterChange }: TimelineSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const collections: { id: TimelineFilter; label: string }[] = [
    { id: 'all', label: t('timeline.collections.all', 'All Entries') },
    { id: 'today', label: t('timeline.collections.today', 'Today') },
    { id: 'morning', label: t('timeline.collections.morning', 'Morning Pages') },
    { id: 'work', label: t('timeline.collections.work', '#work (last 30d)') },
    { id: 'favorites', label: t('timeline.collections.favorites', 'Favorites') },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-base-200 bg-base-100/50 dark:bg-base-200/20 px-6 pt-8 pb-6 text-base-content">
      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-base-content/60 transition hover:text-base-content"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t('settings.backToApp', 'Back to app')}</span>
      </button>

      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-base-content/50">
        {t('timeline.collections.title', 'Collections')}
      </h2>
      <nav className="space-y-1">
        {collections.map((item) => (
          <button
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={clsx(
              'flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentFilter === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-xs text-base-content/50">
        <button className="flex items-center gap-2 hover:text-base-content">
          <span>{t('timeline.collections.new', '+ New collection from filter')}</span>
        </button>
      </div>
    </aside>
  );
}
