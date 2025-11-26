import { useTranslation } from 'react-i18next';

import { HUDPill } from './HUDPill';

interface HUDBottomBarProps {
  isReadOnly: boolean;
  sessionLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel?: string;
}

export function HUDBottomBar({
  isReadOnly,
  sessionLabel,
  snapshotLabel,
  lastUpdatedLabel,
}: HUDBottomBarProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-base-100 to-transparent" />
      {isReadOnly ? (
        <>
          <div className="flex-1" />
          <HUDPill label={lastUpdatedLabel ?? ''} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              {t('hud.session')} · {sessionLabel}
            </span>
          </div>
          <HUDPill label={snapshotLabel} />
        </>
      )}
    </>
  );
}
