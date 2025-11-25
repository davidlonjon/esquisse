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
    />
  );
}
