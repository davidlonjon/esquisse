import { HUDHelpMenu } from './HUDHelpMenu';
import { HUDPill } from './HUDPill';

interface HUDBottomBarProps {
  isReadOnly: boolean;
  wordCountLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel?: string;
  disabled: boolean;
  onOpenShortcuts: () => void;
  onShowHud?: () => void;
}

export function HUDBottomBar({
  isReadOnly,
  wordCountLabel,
  snapshotLabel,
  lastUpdatedLabel,
  disabled,
  onOpenShortcuts,
  onShowHud,
}: HUDBottomBarProps) {
  return (
    <>
      <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />

      {/* Left - Help Menu */}
      <div className="pointer-events-auto">
        <HUDHelpMenu disabled={disabled} onOpenShortcuts={onOpenShortcuts} onShowHud={onShowHud} />
      </div>

      {/* Center - Word count */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <HUDPill label={wordCountLabel} />
      </div>

      {/* Right - Snapshot or Last Updated */}
      <div className="ml-auto">
        <HUDPill label={isReadOnly ? (lastUpdatedLabel ?? '') : snapshotLabel} />
      </div>
    </>
  );
}
