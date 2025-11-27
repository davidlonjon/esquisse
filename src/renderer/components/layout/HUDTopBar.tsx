import { BookOpen, Heart, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HUDButton } from './HUDButton';
import { HUDHelpMenu } from './HUDHelpMenu';
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
  onShowHud?: () => void;
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
  onShowHud,
}: HUDTopBarProps) {
  const { t } = useTranslation();

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

        <HUDHelpMenu disabled={disabled} onOpenShortcuts={onOpenShortcuts} onShowHud={onShowHud} />
      </div>
      <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-base-100 to-transparent" />
    </>
  );
}
