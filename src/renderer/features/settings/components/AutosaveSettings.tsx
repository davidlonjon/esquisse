import { Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Settings } from '@shared/ipc-types';
import { Badge } from '@ui/Badge';
import { Slider } from '@ui/Slider';
import { Toggle } from '@ui/Toggle';

interface AutosaveSettingsProps {
  autoSave: Settings['autoSave'];
  autoSaveInterval: Settings['autoSaveInterval'];
  onAutoSaveToggle: () => void;
  onAutoSaveIntervalChange: (seconds: number) => void;
}

export function AutosaveSettings({
  autoSave,
  autoSaveInterval,
  onAutoSaveToggle,
  onAutoSaveIntervalChange,
}: AutosaveSettingsProps) {
  const { t } = useTranslation();
  const autoSaveSeconds = Math.round(autoSaveInterval / 1000);

  return (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Clock3 className="h-5 w-5 text-base-content/70" />
        <div>
          <p className="text-base font-semibold text-base-content">
            {t('settings.sections.autosave')}
          </p>
          <p className="text-sm text-base-content/70">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-base-content">{t('settings.fields.autoSave')}</p>
            <p className="text-xs text-base-content/60">{t('settings.sections.autosave')}</p>
          </div>
          <Toggle checked={autoSave} onChange={onAutoSaveToggle} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-base-content">
                {t('settings.fields.autoSaveInterval', { seconds: autoSaveSeconds })}
              </p>
              <p className="text-xs text-base-content/60">{t('settings.sections.autosave')}</p>
            </div>
            <Badge variant="outline">{autoSaveSeconds}s</Badge>
          </div>
          <Slider
            id="autosave-interval"
            min={5}
            max={120}
            value={autoSaveSeconds}
            onChange={(event) => onAutoSaveIntervalChange(Number(event.target.value))}
            className="mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-base-content/60">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>
      </div>
    </section>
  );
}
