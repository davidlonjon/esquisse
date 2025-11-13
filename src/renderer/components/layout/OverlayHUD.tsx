import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KeyboardShortcutsPanel, type ShortcutItem } from '@layout/KeyboardShortcutsPanel';

interface ShortcutDefinition {
  combo: string;
  labelKey: string;
  descriptionKey?: string;
}

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

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    combo: '⌘,',
    labelKey: 'hud.keyboard.shortcut.settings.label',
    descriptionKey: 'hud.keyboard.shortcut.settings.description',
  },
  {
    combo: '⌘.',
    labelKey: 'hud.keyboard.shortcut.hudToggle.label',
    descriptionKey: 'hud.keyboard.shortcut.hudToggle.description',
  },
  {
    combo: '⌘[',
    labelKey: 'hud.keyboard.shortcut.previousEntry.label',
    descriptionKey: 'hud.keyboard.shortcut.previousEntry.description',
  },
  {
    combo: '⌘]',
    labelKey: 'hud.keyboard.shortcut.nextEntry.label',
    descriptionKey: 'hud.keyboard.shortcut.nextEntry.description',
  },
  {
    combo: '⌘K',
    labelKey: 'hud.keyboard.shortcut.search.label',
    descriptionKey: 'hud.keyboard.shortcut.search.description',
  },
  {
    combo: '⌘P',
    labelKey: 'hud.keyboard.shortcut.commandPalette.label',
    descriptionKey: 'hud.keyboard.shortcut.commandPalette.description',
  },
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
  const translatedDefaults = useMemo<ShortcutItem[]>(
    () =>
      DEFAULT_SHORTCUTS.map((shortcut) => ({
        combo: shortcut.combo,
        label: t(shortcut.labelKey),
        description: shortcut.descriptionKey ? t(shortcut.descriptionKey) : undefined,
      })),
    [t]
  );

  const shortcutList = translatedDefaults;
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const hudSuppressed = disabled || isShortcutOpen;

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
            onClick={() => !disabled && setIsShortcutOpen(true)}
            disabled={disabled}
            className={clsx(
              'flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm transition',
              disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-background/80'
            )}
          >
            <span className="rounded bg-muted/30 px-2 py-0.5 text-xs font-semibold text-base-content/50">
              ⌘/
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

      {isShortcutOpen && (
        <KeyboardShortcutsPanel
          shortcuts={shortcutList}
          onClose={() => setIsShortcutOpen(false)}
          title={t('hud.keyboard.title')}
          description={t('hud.keyboard.subtitle')}
          closeLabel={t('hud.keyboard.close')}
        />
      )}
    </>
  );
}
