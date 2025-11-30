import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import { Badge, Button, Slider } from '@ui';

export function EditorSettings() {
  const { t } = useTranslation();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleFontSizeChange = async (value: number) => {
    await updateSettings({ fontSize: value });
  };

  const handleResetTypography = async () => {
    await updateSettings({ fontSize: 16, fontFamily: 'system-ui' });
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

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-base-content/60">
            {t('settings.actions.resetEditorTypography')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleResetTypography()}
          >
            {t('common.actions.reset')}
          </Button>
        </div>
      </div>
    </section>
  );
}
