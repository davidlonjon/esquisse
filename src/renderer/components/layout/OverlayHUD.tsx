import clsx from 'clsx';

import { useKeyboardShortcutsPanel } from '@hooks/useKeyboardShortcutsPanel';
import { KeyboardShortcutsPanel } from '@layout/KeyboardShortcutsPanel';

import { HUDBottomBar } from './HUDBottomBar';
import { HUDEdgeFade } from './HUDEdgeFade';
import { HUDTopBar } from './HUDTopBar';

interface OverlayHUDProps {
  showTop: boolean;
  showBottom: boolean;
  isReadOnly?: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel?: string;
  disabled?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onToggleEditMode?: () => void;
  onShowHud?: () => void;
}

export function OverlayHUD({
  showTop,
  showBottom,
  isReadOnly = false,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  lastUpdatedLabel,
  disabled = false,
  isFavorite = false,
  onToggleFavorite,
  onToggleEditMode,
  onShowHud,
}: OverlayHUDProps) {
  const { isShortcutsOpen, openShortcuts, closeShortcuts } = useKeyboardShortcutsPanel();
  const hudSuppressed = disabled || isShortcutsOpen;

  return (
    <>
      {/* Persistent screen edge fade effects */}
      <HUDEdgeFade position="top" />
      <HUDEdgeFade position="bottom" />

      {/* Top HUD bar */}
      <div
        className={clsx(
          'pointer-events-none fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between bg-base-100 px-10 transition-all duration-300 ease-out',
          showTop && !hudSuppressed ? 'opacity-100 translate-y-0' : '-translate-y-full opacity-0'
        )}
      >
        <HUDTopBar
          dateLabel={dateLabel}
          wordCountLabel={wordCountLabel}
          isReadOnly={isReadOnly}
          disabled={disabled}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onToggleEditMode={onToggleEditMode}
          onOpenShortcuts={openShortcuts}
          onShowHud={onShowHud}
        />
      </div>

      {/* Bottom HUD bar */}
      <div
        className={clsx(
          'pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-between bg-base-100 px-10 transition-all duration-300 ease-out',
          showBottom && !hudSuppressed ? 'opacity-100 translate-y-0' : 'translate-y-full opacity-0'
        )}
      >
        <HUDBottomBar
          isReadOnly={isReadOnly}
          sessionLabel={sessionLabel}
          snapshotLabel={snapshotLabel}
          lastUpdatedLabel={lastUpdatedLabel}
        />
      </div>

      {isShortcutsOpen && <KeyboardShortcutsPanel onClose={closeShortcuts} />}
    </>
  );
}
