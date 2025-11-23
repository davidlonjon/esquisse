import { OverlayHUD } from '@layout/OverlayHUD';

interface EditorHUDProps {
  isVisible: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  disabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function EditorHud({
  isVisible,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  disabled,
  isFavorite,
  onToggleFavorite,
}: EditorHUDProps) {
  return (
    <OverlayHUD
      showTop={isVisible}
      showBottom={isVisible}
      dateLabel={dateLabel}
      wordCountLabel={wordCountLabel}
      sessionLabel={sessionLabel}
      snapshotLabel={snapshotLabel}
      disabled={disabled}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    />
  );
}
