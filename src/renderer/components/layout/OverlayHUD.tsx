import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { KeyboardShortcutsPanel, type ShortcutItem } from '@layout/KeyboardShortcutsPanel';

interface OverlayHUDProps {
  showTop: boolean;
  showBottom: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  shortcuts?: ShortcutItem[];
}

const HUDPill = ({ label }: { label: string }) => (
  <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
    {label}
  </div>
);

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { combo: '⌘K', label: 'Search', description: 'Open global search' },
  { combo: '⌘P', label: 'Command Palette', description: 'Jump to any action' },
];

export function OverlayHUD({
  showTop,
  showBottom,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  shortcuts,
}: OverlayHUDProps) {
  const shortcutList = useMemo(() => shortcuts ?? DEFAULT_SHORTCUTS, [shortcuts]);
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);

  useEffect(() => {
    const handleToggleShortcutPanel = (event: KeyboardEvent) => {
      const isMetaCombo = event.metaKey || event.ctrlKey;
      if (isMetaCombo && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        setIsShortcutOpen((prev) => !prev);
      }

      if (event.key === 'Escape') {
        setIsShortcutOpen(false);
      }
    };

    window.addEventListener('keydown', handleToggleShortcutPanel);
    return () => window.removeEventListener('keydown', handleToggleShortcutPanel);
  }, []);

  return (
    <>
      <div
        className={clsx(
          'pointer-events-none fixed left-0 right-0 top-6 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out',
          showTop ? 'opacity-100 translate-y-0' : '-translate-y-4 opacity-0'
        )}
      >
        <div className="flex flex-wrap gap-2">
          <HUDPill label={dateLabel} />
          <HUDPill label={wordCountLabel} />
        </div>

        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsShortcutOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm transition hover:border-border"
          >
            <span className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-semibold text-foreground">
              ⌘/
            </span>
            <span>Keyboard shortcuts</span>
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'pointer-events-none fixed bottom-6 left-0 right-0 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out',
          showBottom ? 'opacity-100 translate-y-0' : 'translate-y-4 opacity-0'
        )}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Session · {sessionLabel}</span>
        </div>

        <HUDPill label={snapshotLabel} />
      </div>

      {isShortcutOpen && (
        <KeyboardShortcutsPanel shortcuts={shortcutList} onClose={() => setIsShortcutOpen(false)} />
      )}
    </>
  );
}
