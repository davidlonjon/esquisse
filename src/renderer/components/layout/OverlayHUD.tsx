import clsx from 'clsx';

interface OverlayHUDProps {
  showTop: boolean;
  showBottom: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  searchShortcut?: string;
  commandShortcut?: string;
}

const HUDPill = ({ label }: { label: string }) => (
  <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
    {label}
  </div>
);

const HUDShortcut = ({ combo, label }: { combo: string; label: string }) => (
  <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
    <span className="rounded bg-muted/30 px-1.5 py-0.5 font-semibold text-foreground">{combo}</span>
    <span>{label}</span>
  </div>
);

export function OverlayHUD({
  showTop,
  showBottom,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  searchShortcut = '⌘K',
  commandShortcut = '⌘P',
}: OverlayHUDProps) {
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

        <div className="flex flex-wrap gap-2">
          <HUDShortcut combo={searchShortcut} label="Search" />
          <HUDShortcut combo={commandShortcut} label="Command Palette" />
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
    </>
  );
}
