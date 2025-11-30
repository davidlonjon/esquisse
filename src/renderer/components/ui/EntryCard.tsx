import clsx from 'clsx';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { Heart } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { Entry } from '@shared/types';

interface EntryCardProps {
  entry: Entry;
  isSelected: boolean;
  locale: Locale;
  emptyLabel: string;
  onClick?: (entryId: string) => void;
  onToggleFavorite?: (entryId: string) => void;
  showFavoriteToggle?: boolean;
}

export const EntryCard = memo(
  ({
    entry,
    isSelected,
    locale,
    emptyLabel,
    onClick,
    onToggleFavorite,
    showFavoriteToggle = true,
  }: EntryCardProps) => {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isSelected && cardRef.current) {
        cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, [isSelected]);

    const plainText = useMemo(
      () => entry.content.replace(/<[^>]*>?/gm, '').trim() || emptyLabel,
      [entry.content, emptyLabel]
    );

    const wordCount = useMemo(() => {
      const text = entry.content.replace(/<[^>]*>?/gm, '').trim();
      return text ? text.split(/\s+/).length : 0;
    }, [entry.content]);

    const formattedDate = format(new Date(entry.createdAt), 'EEE, MMM d · HH:mm', { locale });

    const shouldShowFavoriteButton = showFavoriteToggle && typeof onToggleFavorite === 'function';

    return (
      <div
        ref={cardRef}
        onClick={onClick ? () => onClick(entry.id) : undefined}
        className={clsx(
          'group relative rounded-xl border p-5 transition-all',
          onClick && 'cursor-pointer',
          isSelected
            ? 'border-primary ring-2 ring-primary/20 bg-card shadow-warm-lg'
            : 'border-border bg-card hover:border-primary/30 hover:shadow-warm-lg'
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-base-content">{formattedDate}</div>
          {shouldShowFavoriteButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(entry.id);
              }}
              className={clsx(
                'transition-transform duration-150 ease-out p-1.5 rounded-full z-10 relative transform',
                entry.isFavorite
                  ? 'opacity-100 text-primary bg-primary/10 hover:bg-primary/20 heart-pop'
                  : 'opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-primary',
                isSelected && !entry.isFavorite && 'opacity-50'
              )}
              title={t('tagsOverlay.favorite', 'Favorite')}
            >
              <Heart className={clsx('h-4 w-4', entry.isFavorite && 'fill-current')} />
            </button>
          )}
        </div>

        <div className="mb-3 text-sm text-base-content/80 line-clamp-3 font-serif leading-relaxed">
          {plainText}
        </div>

        <div className="flex items-center gap-2 text-xs text-base-content/50">
          {entry.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-primary/5 text-primary/80 border border-primary/20 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {entry.tags && entry.tags.length > 3 && (
            <span className="text-base-content/40">+{entry.tags.length - 3}</span>
          )}
          <span className="ml-auto">
            {t('tagsOverlay.words', '{{count}} words', { count: wordCount })}
          </span>
        </div>
      </div>
    );
  }
);

EntryCard.displayName = 'EntryCard';
