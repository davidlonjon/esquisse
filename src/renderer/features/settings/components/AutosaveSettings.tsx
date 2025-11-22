import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import { Badge, Slider, Toggle } from '@ui';

export function AutosaveSettings() {
  const { t } = useTranslation();
  const autoSave = useSettingsStore((state) => state.autoSave);
  const autoSaveInterval = useSettingsStore((state) => state.autoSaveInterval);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const autoSaveSeconds = Math.round(autoSaveInterval / 1000);

  const handleAutoSaveToggle = async () => {
    await updateSettings({ autoSave: !autoSave });
  };

  const handleAutoSaveIntervalChange = async (seconds: number) => {
    await updateSettings({ autoSaveInterval: seconds * 1000 });
  };

  return (
    <section className="space-y-10">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-base-content">
            {t('settings.fields.autoSave')}
          </label>
          <Toggle checked={autoSave} onChange={() => void handleAutoSaveToggle()} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-base-content" htmlFor="autosave-interval">
              {t('settings.fields.autoSaveInterval', { seconds: autoSaveSeconds })}
            </label>
            <Badge variant="outline" className="font-mono">
              {autoSaveSeconds}s
            </Badge>
          </div>
          <Slider
            id="autosave-interval"
            min={5}
            max={120}
            value={autoSaveSeconds}
            onChange={(event) => void handleAutoSaveIntervalChange(Number(event.target.value))}
            className="w-full"
            disabled={!autoSave}
          />
          <div className="flex justify-between text-xs text-base-content/60 font-mono">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>
      </div>
    </section>
  );
}
