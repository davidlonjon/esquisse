import clsx from 'clsx';
import { BookOpen, Heart, Pencil } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getShortcutCombo } from '@lib/shortcuts';
import { ShortcutKeys } from '@ui';

import { HUDButton } from './HUDButton';
import { HUDPill } from './HUDPill';

interface HUDTopBarProps {
  dateLabel: string;
  wordCountLabel: string;
  isReadOnly: boolean;
  disabled: boolean;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  onToggleEditMode?: () => void;
  onOpenShortcuts: () => void;
}

export function HUDTopBar({
  dateLabel,
  wordCountLabel,
  isReadOnly,
  disabled,
  isFavorite,
  onToggleFavorite,
  onToggleEditMode,
  onOpenShortcuts,
}: HUDTopBarProps) {
  const { t } = useTranslation();
  const shortcutsButtonCombo = useMemo(() => getShortcutCombo('toggleShortcutsPanel') ?? '⌘/', []);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <HUDPill label={dateLabel} />
        <HUDPill label={wordCountLabel} />
      </div>

      <div className="pointer-events-auto flex flex-wrap gap-2">
        {onToggleEditMode && (
          <HUDButton
            onClick={onToggleEditMode}
            disabled={disabled}
            title={isReadOnly ? 'Switch to edit mode (⇧⌘E)' : 'Switch to read mode (⇧⌘E)'}
            icon={isReadOnly ? Pencil : BookOpen}
            variant="mode"
            isActive={isReadOnly}
          />
        )}
        {onToggleFavorite && (
          <HUDButton
            onClick={onToggleFavorite}
            disabled={disabled}
            title={t('timeline.feed.favorite', 'Favorite')}
            icon={Heart}
            variant="favorite"
            isActive={isFavorite}
          />
        )}

        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              onOpenShortcuts();
            }
          }}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-2 rounded-full bg-base-200/50 px-3 py-1 text-xs font-medium text-base-content/60 transition',
            disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-base-200'
          )}
        >
          <ShortcutKeys combo={shortcutsButtonCombo} />
          <span className="text-base-content/60">{t('hud.keyboard.button')}</span>
        </button>
      </div>
      <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-base-100 to-transparent" />
    </>
  );
}
