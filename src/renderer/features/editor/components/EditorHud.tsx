import { OverlayHUD } from '@layout/OverlayHUD';

interface EditorHUDProps {
  isVisible: boolean;
  isReadOnly: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel: string;
  disabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
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

export function EditorHud({
  isVisible,
  isReadOnly,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  lastUpdatedLabel,
  disabled,
  isFavorite,
  onToggleFavorite,
  onToggleEditMode,
  onShowHud,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious,
  canNavigateNext,
  currentEntryCreatedAt,
  onDateTimeChange,
  onOpenSearch,
}: EditorHUDProps) {
  return (
    <OverlayHUD
      showTop={isVisible}
      showBottom={isVisible}
      isReadOnly={isReadOnly}
      dateLabel={dateLabel}
      wordCountLabel={wordCountLabel}
      sessionLabel={sessionLabel}
      snapshotLabel={snapshotLabel}
      lastUpdatedLabel={lastUpdatedLabel}
      disabled={disabled}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onToggleEditMode={onToggleEditMode}
      onShowHud={onShowHud}
      onNavigatePrevious={onNavigatePrevious}
      onNavigateNext={onNavigateNext}
      canNavigatePrevious={canNavigatePrevious}
      canNavigateNext={canNavigateNext}
      currentEntryCreatedAt={currentEntryCreatedAt}
      onDateTimeChange={onDateTimeChange}
      onOpenSearch={onOpenSearch}
    />
  );
}
