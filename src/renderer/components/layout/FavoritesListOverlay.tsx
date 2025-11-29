import clsx from 'clsx';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Heart, X } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { Entry } from '@shared/types';

interface FavoritesListOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteEntries: Entry[];
  selectedIndex: number;
  isEmpty: boolean;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
  onNavigateToSelected: () => void;
  onUnfavoriteSelected: () => void;
}

const FavoriteEntryItem = memo(
  ({ entry, isSelected, locale }: { entry: Entry; isSelected: boolean; locale: Locale }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, [isSelected]);

    const plainText = entry.content.replace(/<[^>]*>?/gm, '').trim() || 'Empty entry';
    const formattedDate = format(new Date(entry.createdAt), 'MMM d, yyyy · HH:mm', { locale });

    return (
      <div
        ref={itemRef}
        className={clsx(
          'px-4 py-3 rounded-lg transition-colors',
          isSelected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-base-200'
        )}
      >
        <div className="flex items-start gap-3">
          <Heart className="h-4 w-4 mt-1 text-error fill-error shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-base-content line-clamp-3">{plainText}</p>
            <p className="text-xs text-base-content/50 mt-1.5">{formattedDate}</p>
          </div>
        </div>
      </div>
    );
  }
);

FavoriteEntryItem.displayName = 'FavoriteEntryItem';

export function FavoritesListOverlay({
  isOpen,
  onClose,
  favoriteEntries,
  selectedIndex,
  isEmpty,
  onSelectPrevious,
  onSelectNext,
  onNavigateToSelected,
  onUnfavoriteSelected,
}: FavoritesListOverlayProps) {
  const { t, i18n } = useTranslation();
  const { openModal, closeModal } = useHotkeysContext();
  const locale = i18n.language === 'fr' ? fr : enUS;

  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [isOpen, openModal, closeModal]);

  // Escape to close
  useGlobalHotkeys('escape', onClose, { enabled: isOpen }, false);

  // Arrow navigation
  useGlobalHotkeys(
    'arrowup',
    (e) => {
      e.preventDefault();
      onSelectPrevious();
    },
    { enabled: isOpen && !isEmpty },
    false
  );

  useGlobalHotkeys(
    'arrowdown',
    (e) => {
      e.preventDefault();
      onSelectNext();
    },
    { enabled: isOpen && !isEmpty },
    false
  );

  // Enter to navigate
  useGlobalHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      onNavigateToSelected();
    },
    { enabled: isOpen && !isEmpty },
    false
  );

  // u to unfavorite
  useGlobalHotkeys(
    'u',
    (e) => {
      e.preventDefault();
      onUnfavoriteSelected();
    },
    { enabled: isOpen && !isEmpty },
    false
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base-100/95 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-error fill-error" />
            <h2 className="text-xl font-semibold text-base-content">{t('favoritesList.title')}</h2>
            {!isEmpty && (
              <span className="text-sm text-base-content/50">({favoriteEntries.length})</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-base-content/70" />
          </button>
        </div>

        {/* List or empty state */}
        {isEmpty ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto mb-4 text-base-content/20" />
            <p className="text-base-content/60 mb-2">{t('favoritesList.empty')}</p>
            <p className="text-sm text-base-content/40">{t('favoritesList.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto p-1 -m-1">
            {favoriteEntries.map((entry, index) => (
              <FavoriteEntryItem
                key={entry.id}
                entry={entry}
                isSelected={index === selectedIndex}
                locale={locale}
              />
            ))}
          </div>
        )}

        {/* Keyboard hints */}
        <p className="mt-6 text-center text-xs text-base-content/40">
          {isEmpty ? 'Esc close' : '↑ ↓ navigate · Enter select · u unfavorite · Esc close'}
        </p>
      </div>
    </div>
  );
}
