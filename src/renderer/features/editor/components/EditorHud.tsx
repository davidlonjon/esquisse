import { OverlayHUD } from '@layout/OverlayHUD';

interface EditorHUDProps {
  isVisible: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  disabled: boolean;
}

export function EditorHud({
  isVisible,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  disabled,
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
    />
  );
}
