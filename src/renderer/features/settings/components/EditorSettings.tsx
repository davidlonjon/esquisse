import { Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Settings } from '@shared/types';
import { Badge } from '@ui/Badge';
import { Input } from '@ui/Input';
import { Slider } from '@ui/Slider';

interface EditorSettingsProps {
  fontSize: Settings['fontSize'];
  fontFamily: Settings['fontFamily'];
  onFontSizeChange: (value: number) => void;
  onFontFamilyChange: (value: string) => void;
}

export function EditorSettings({
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
}: EditorSettingsProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Type className="h-5 w-5 text-base-content/70" />
        <div>
          <p className="text-base font-semibold text-base-content">
            {t('settings.sections.editor')}
          </p>
          <p className="text-sm text-base-content/70">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-base-content">
                {t('settings.fields.fontSize', { size: fontSize })}
              </p>
              <p className="text-xs text-base-content/60">{t('settings.sections.editor')}</p>
            </div>
            <Badge variant="outline">{fontSize}px</Badge>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={28}
            value={fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            className="mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-base-content/60">
            <span>12px</span>
            <span>28px</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-base-content" htmlFor="font-family">
            {t('settings.fields.fontFamily')}
          </label>
          <Input
            id="font-family"
            type="text"
            value={fontFamily}
            onChange={(event) => onFontFamilyChange(event.target.value)}
            className="mt-3 w-full"
          />
        </div>
      </div>
    </section>
  );
}
