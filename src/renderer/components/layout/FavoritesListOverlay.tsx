import { enUS, fr } from 'date-fns/locale';
import { Heart, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { Entry } from '@shared/types';
import { EntryCard } from '@ui';

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
  onToggleFavorite: (entryId: string) => void;
}

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
  onToggleFavorite,
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

  const keyboardHint = isEmpty
    ? t('favoritesList.keyboardHints.empty')
    : t('favoritesList.keyboardHints.withEntries');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/98 backdrop-blur-md">
      <div className="relative w-full max-w-4xl mx-auto px-6 py-8 overlay-panel-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <h2 className="text-xl font-semibold text-base-content">{t('favoritesList.title')}</h2>
            {!isEmpty && (
              <span className="text-sm text-base-content/50">({favoriteEntries.length})</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label={t('common.actions.close')}
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
          <div className="space-y-5 max-h-[70vh] overflow-y-auto p-1 -m-1">
            {favoriteEntries.map((entry, index) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isSelected={index === selectedIndex}
                locale={locale}
                emptyLabel={t('common.emptyEntry')}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Keyboard hints */}
        <p className="mt-6 text-center text-xs text-base-content/40">{keyboardHint}</p>
      </div>
    </div>
  );
}
