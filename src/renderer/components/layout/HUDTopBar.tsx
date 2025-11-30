import { BookOpen, Heart, Pencil, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDatePicker } from '@hooks/useDatePicker';
import { useMoodPicker } from '@hooks/useMoodPicker';
import { getShortcutCombo } from '@lib/shortcuts';
import { DateTimePicker, Tooltip } from '@ui';

import { HUDButton } from './HUDButton';
import { HUDNavigationButtons } from './HUDNavigationButtons';
import { HUDPill } from './HUDPill';
import { MoodPicker } from './MoodPicker';

interface HUDTopBarProps {
  dateLabel: string;
  isReadOnly: boolean;
  disabled: boolean;
  isFavorite: boolean;
  sessionLabel: string;
  onToggleFavorite?: () => void;
  onToggleEditMode?: () => void;
  onShowHud?: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
  currentEntryCreatedAt?: string;
  onDateTimeChange?: (isoString: string) => void;
  onOpenSearch?: () => void;
}

export function HUDTopBar({
  dateLabel,
  isReadOnly,
  disabled,
  isFavorite,
  sessionLabel,
  onToggleFavorite,
  onToggleEditMode,
  onShowHud,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious = true,
  canNavigateNext = true,
  currentEntryCreatedAt,
  onDateTimeChange,
  onOpenSearch,
}: HUDTopBarProps) {
  const { t } = useTranslation();
  const editModeShortcut = getShortcutCombo('toggleEditMode') ?? '⇧⌘E';
  const favoriteShortcut = getShortcutCombo('toggleFavorite') ?? '⇧⌘F';
  const moodShortcut = getShortcutCombo('openMoodPicker') ?? '⌘M';
  const searchShortcut = getShortcutCombo('search') ?? '⌘K';
  const datePickerShortcut = '⇧⌘D';

  // Mood picker state
  const moodPicker = useMoodPicker();

  // Date picker state and logic
  const {
    isDatePickerOpen,
    setIsDatePickerOpen,
    datePillRef,
    handleDatePillClick,
    handleDateTimeChange,
  } = useDatePicker({
    currentEntryCreatedAt,
    onDateTimeChange,
    onShowHud,
    disabled,
  });

  return (
    <>
      <div className="flex w-full flex-col items-center gap-0">
        {/* Center - Date and Session */}
        <div className="flex flex-col items-center gap-1">
          {currentEntryCreatedAt && onDateTimeChange && !disabled ? (
            <Tooltip
              content={t('hud.dateTooltip', 'Change entry date')}
              shortcut={datePickerShortcut}
              position="bottom"
            >
              <HUDPill
                ref={datePillRef}
                label={dateLabel}
                onClick={handleDatePillClick}
                className="px-4 py-1.5 text-sm md:text-base"
              />
            </Tooltip>
          ) : (
            <HUDPill
              ref={datePillRef}
              label={dateLabel}
              onClick={handleDatePillClick}
              className="px-4 py-1.5 text-sm md:text-base"
            />
          )}

          {/* Key forces component reset when entry changes - simple but remounts tree */}
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

        <div className="mt-0 flex w-full items-center gap-4">
          {/* Left - Search and Navigation */}
          <div className="pointer-events-auto flex flex-1 items-center gap-2">
            {onOpenSearch && (
              <HUDButton
                onClick={onOpenSearch}
                disabled={disabled}
                tooltip="Search"
                shortcut={searchShortcut}
                icon={Search}
                variant="default"
              />
            )}
            {onNavigatePrevious && onNavigateNext && (
              <HUDNavigationButtons
                onNavigatePrevious={onNavigatePrevious}
                onNavigateNext={onNavigateNext}
                disabled={disabled}
                canNavigatePrevious={canNavigatePrevious}
                canNavigateNext={canNavigateNext}
              />
            )}
          </div>

          {/* Session indicator (edit mode only) */}
          {!isReadOnly && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-base-content/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>
                {t('hud.session')} · {sessionLabel}
              </span>
            </div>
          )}

          {/* Right - Buttons */}
          <div className="pointer-events-auto flex flex-1 justify-end flex-wrap gap-2">
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
                tooltip={t('tagsOverlay.favorite', 'Favorite')}
                shortcut={favoriteShortcut}
                icon={Heart}
                variant="favorite"
                isActive={isFavorite}
              />
            )}
            <MoodPicker
              isOpen={moodPicker.isOpen}
              onClose={moodPicker.close}
              onToggle={moodPicker.toggle}
              selectedIndex={moodPicker.selectedIndex}
              currentMood={moodPicker.currentMood}
              onSelectPrevious={moodPicker.selectPrevious}
              onSelectNext={moodPicker.selectNext}
              onSelectCurrent={moodPicker.selectCurrentMood}
              onSelectByNumber={moodPicker.selectByNumber}
              onClear={moodPicker.clearMood}
              disabled={disabled || !moodPicker.hasEntry}
              shortcut={moodShortcut}
              onShowHud={onShowHud}
            />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-base-100 to-transparent" />
    </>
  );
}
