import { useRef } from 'react';

import { useOnClickOutside } from '@hooks/useOnClickOutside';

export interface ShortcutItem {
  combo: string;
  label: string;
  description?: string;
}

interface KeyboardShortcutsPanelProps {
  shortcuts: ShortcutItem[];
  onClose: () => void;
  title: string;
  description: string;
  closeLabel: string;
}

const ShortcutBadge = ({ combo }: { combo: string }) => (
  <span className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-semibold text-foreground">
    {combo}
  </span>
);

export function KeyboardShortcutsPanel({
  shortcuts,
  onClose,
  title,
  description,
  closeLabel,
}: KeyboardShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(panelRef, onClose, true);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-start justify-center bg-background/30 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" aria-hidden="true" />
      <div
        ref={panelRef}
        className="mt-20 w-full max-w-md rounded-2xl border border-border/70 bg-background px-6 py-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            {closeLabel}
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.combo}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/10 px-3 py-2 text-sm"
            >
              <div className="pr-3">
                <p className="font-medium text-foreground">{shortcut.label}</p>
                {shortcut.description && (
                  <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                )}
              </div>
              <ShortcutBadge combo={shortcut.combo} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
