import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useKeyboardShortcutsPanel } from '@hooks/useKeyboardShortcutsPanel';
import { KeyboardShortcutsPanel } from '@layout/KeyboardShortcutsPanel';
import { getShortcutCombo } from '@lib/shortcuts';
import { ShortcutKeys } from '@ui';

interface OverlayHUDProps {
  showTop: boolean;
  showBottom: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  disabled?: boolean;
}

const HUDPill = ({ label }: { label: string }) => (
  <div className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm">
    {label}
  </div>
);

export function OverlayHUD({
  showTop,
  showBottom,
  dateLabel,
  wordCountLabel,
  sessionLabel,
  snapshotLabel,
  disabled = false,
}: OverlayHUDProps) {
  const { t } = useTranslation();
  const { isShortcutsOpen, openShortcuts, closeShortcuts } = useKeyboardShortcutsPanel();

  const shortcutsButtonCombo = useMemo(() => getShortcutCombo('toggleShortcutsPanel') ?? '⌘/', []);
  const hudSuppressed = disabled || isShortcutsOpen;

  return (
    <>
      <div
        className={clsx(
          'pointer-events-none fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between bg-base-100 px-10 transition-all duration-300 ease-out',
          showTop && !hudSuppressed ? 'opacity-100 translate-y-0' : '-translate-y-full opacity-0'
        )}
      >
        <div className="flex flex-wrap gap-2">
          <HUDPill label={dateLabel} />
          <HUDPill label={wordCountLabel} />
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                openShortcuts();
              }
            }}
            disabled={disabled}
            className={clsx(
              'flex items-center gap-2 rounded-full bg-base-200/50 px-3 py-1 text-xs font-medium text-base-content/60 transition',
              disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-base-200'
            )}
          >
            <ShortcutKeys combo={shortcutsButtonCombo} />
            <span className="text-base-content/60">{t('hud.keyboard.button')}</span>
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-between bg-base-100 px-10 transition-all duration-300 ease-out',
          showBottom && !hudSuppressed ? 'opacity-100 translate-y-0' : 'translate-y-full opacity-0'
        )}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>
            {t('hud.session')} · {sessionLabel}
          </span>
        </div>

        <HUDPill label={snapshotLabel} />
      </div>

      {isShortcutsOpen && <KeyboardShortcutsPanel onClose={closeShortcuts} />}
    </>
  );
}
