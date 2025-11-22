import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import { Badge, Input, Slider } from '@ui';

export function EditorSettings() {
  const { t } = useTranslation();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const fontFamily = useSettingsStore((state) => state.fontFamily);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleFontSizeChange = async (value: number) => {
    await updateSettings({ fontSize: value });
  };

  const handleFontFamilyChange = async (value: string) => {
    await updateSettings({ fontFamily: value });
  };

  return (
    <section className="space-y-10">
      <div className="grid gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-base-content" htmlFor="font-size">
              {t('settings.fields.fontSize', { size: fontSize })}
            </label>
            <Badge variant="outline" className="font-mono">
              {fontSize}px
            </Badge>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={28}
            value={fontSize}
            onChange={(event) => void handleFontSizeChange(Number(event.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-base-content/60 font-mono">
            <span>12px</span>
            <span>28px</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-base-content" htmlFor="font-family">
            {t('settings.fields.fontFamily')}
          </label>
          <Input
            id="font-family"
            type="text"
            value={fontFamily}
            onChange={(event) => void handleFontFamilyChange(event.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>
      </div>
    </section>
  );
}
