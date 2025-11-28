import { BookOpen, Heart, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { getShortcutCombo } from '@lib/shortcuts';
import { DateTimePicker, Tooltip } from '@ui';

import { HUDButton } from './HUDButton';
import { HUDHelpMenu } from './HUDHelpMenu';
import { HUDNavigationButtons } from './HUDNavigationButtons';
import { HUDPill } from './HUDPill';

interface HUDTopBarProps {
  dateLabel: string;
  isReadOnly: boolean;
  disabled: boolean;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  onToggleEditMode?: () => void;
  onOpenShortcuts: () => void;
  onShowHud?: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
  currentEntryCreatedAt?: string;
  onDateTimeChange?: (isoString: string) => void;
}

export function HUDTopBar({
  dateLabel,
  isReadOnly,
  disabled,
  isFavorite,
  onToggleFavorite,
  onToggleEditMode,
  onOpenShortcuts,
  onShowHud,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious = true,
  canNavigateNext = true,
  currentEntryCreatedAt,
  onDateTimeChange,
}: HUDTopBarProps) {
  const { t } = useTranslation();
  const editModeShortcut = getShortcutCombo('toggleEditMode') ?? '⇧⌘E';
  const favoriteShortcut = getShortcutCombo('toggleFavorite') ?? '⇧⌘F';
  const datePickerShortcut = '⇧⌘D';

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePillRef = useRef<HTMLDivElement>(null);
  const hudKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDatePillClick = () => {
    if (currentEntryCreatedAt && onDateTimeChange && !disabled) {
      setIsDatePickerOpen((prev) => !prev);
    }
  };

  // Register keyboard shortcut for date picker (Shift+Cmd+D)
  useGlobalHotkeys(
    'mod+shift+d',
    (event) => {
      event.preventDefault();
      if (currentEntryCreatedAt && onDateTimeChange && !disabled) {
        setIsDatePickerOpen((prev) => !prev);
      }
    },
    { preventDefault: true }
  );

  const handleDateTimeChange = (isoString: string) => {
    if (onDateTimeChange) {
      onDateTimeChange(isoString);
    }
  };

  // Keep HUD visible while date picker is open
  useEffect(() => {
    if (isDatePickerOpen && onShowHud) {
      // Show HUD immediately
      onShowHud();

      // Keep refreshing HUD visibility every 2 seconds to prevent auto-hide
      hudKeepAliveRef.current = setInterval(() => {
        onShowHud();
      }, 2000);
    } else {
      // Clean up interval when picker closes
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    }

    return () => {
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    };
  }, [isDatePickerOpen, onShowHud]);

  return (
    <>
      {/* Left - Navigation */}
      {onNavigatePrevious && onNavigateNext && (
        <HUDNavigationButtons
          onNavigatePrevious={onNavigatePrevious}
          onNavigateNext={onNavigateNext}
          disabled={disabled}
          canNavigatePrevious={canNavigatePrevious}
          canNavigateNext={canNavigateNext}
        />
      )}

      {/* Center - Date */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {currentEntryCreatedAt && onDateTimeChange && !disabled ? (
          <Tooltip
            content={t('hud.dateTooltip', 'Change entry date')}
            shortcut={datePickerShortcut}
            position="bottom"
          >
            <HUDPill ref={datePillRef} label={dateLabel} onClick={handleDatePillClick} />
          </Tooltip>
        ) : (
          <HUDPill ref={datePillRef} label={dateLabel} onClick={handleDatePillClick} />
        )}

        {currentEntryCreatedAt && onDateTimeChange && (
          <DateTimePicker
            key={currentEntryCreatedAt}
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            anchorRef={datePillRef}
            initialDate={currentEntryCreatedAt}
            onDateTimeChange={handleDateTimeChange}
          />
        )}
      </div>

      {/* Right - Buttons */}
      <div className="pointer-events-auto ml-auto flex flex-wrap gap-2">
        {onToggleEditMode && (
          <HUDButton
            onClick={onToggleEditMode}
            disabled={disabled}
            tooltip={isReadOnly ? 'Switch to edit mode' : 'Switch to read mode'}
            shortcut={editModeShortcut}
            icon={isReadOnly ? Pencil : BookOpen}
            variant="mode"
            isActive={isReadOnly}
          />
        )}
        {onToggleFavorite && (
          <HUDButton
            onClick={onToggleFavorite}
            disabled={disabled}
            tooltip={t('timeline.feed.favorite', 'Favorite')}
            shortcut={favoriteShortcut}
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
