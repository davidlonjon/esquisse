import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ShortcutId } from '@config/shortcuts';
import { useKeyboardShortcutsPanel } from '@hooks/useKeyboardShortcutsPanel';
import { KeyboardShortcutsPanel, type ShortcutItem } from '@layout/KeyboardShortcutsPanel';
import { getShortcutCombo, getShortcutDisplayList } from '@lib/shortcuts';

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

const HUD_SHORTCUT_IDS: ShortcutId[] = [
  'openSettings',
  'toggleHudPin',
  'previousEntry',
  'nextEntry',
  'searchEntries',
  'commandPalette',
  'deleteEntry',
];

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
  const translatedShortcuts = useMemo(
    () =>
      getShortcutDisplayList(HUD_SHORTCUT_IDS, t).map<ShortcutItem>((shortcut) => ({
        combo: shortcut.combo,
        label: shortcut.label,
        description: shortcut.description,
      })),
    [t]
  );
  const shortcutsButtonCombo = useMemo(() => getShortcutCombo('toggleShortcutsPanel') ?? '⌘/', []);
  const hudSuppressed = disabled || isShortcutsOpen;

  return (
    <>
      <div
        className={clsx(
          'pointer-events-none fixed left-0 right-0 top-6 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out',
          showTop && !hudSuppressed ? 'opacity-100 translate-y-0' : '-translate-y-4 opacity-0'
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
              'flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm transition',
              disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-background/80'
            )}
          >
            <span className="rounded bg-muted/30 px-2 py-0.5 text-xs font-semibold text-base-content/50">
              {shortcutsButtonCombo}
            </span>
            <span className="text-base-content/60">{t('hud.keyboard.button')}</span>
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'pointer-events-none fixed bottom-6 left-0 right-0 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out',
          showBottom && !hudSuppressed ? 'opacity-100 translate-y-0' : 'translate-y-4 opacity-0'
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

      {isShortcutsOpen && (
        <KeyboardShortcutsPanel
          shortcuts={translatedShortcuts}
          onClose={closeShortcuts}
          title={t('hud.keyboard.title')}
          description={t('hud.keyboard.subtitle')}
          closeLabel={t('hud.keyboard.close')}
        />
      )}
    </>
  );
}
