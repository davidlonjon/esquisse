import { Check, Languages, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Settings } from '@shared/types';
import { Button } from '@ui/Button';
import { Select } from '@ui/Select';

const THEME_OPTIONS: Array<{ value: 'system' | 'light' | 'dark'; labelKey: string }> = [
  { value: 'system', labelKey: 'settings.options.theme.system' },
  { value: 'light', labelKey: 'settings.options.theme.light' },
  { value: 'dark', labelKey: 'settings.options.theme.dark' },
];

const LANGUAGE_OPTIONS: Array<{ value: 'en' | 'fr'; labelKey: string }> = [
  { value: 'en', labelKey: 'settings.options.language.en' },
  { value: 'fr', labelKey: 'settings.options.language.fr' },
];

interface AppearanceSettingsProps {
  theme: Settings['theme'];
  language: Settings['language'];
  onThemeChange: (value: 'system' | 'light' | 'dark') => void;
  onLanguageChange: (value: 'en' | 'fr') => void;
}

export function AppearanceSettings({
  theme,
  language,
  onThemeChange,
  onLanguageChange,
}: AppearanceSettingsProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Palette className="h-5 w-5 text-base-content/70" />
        <div>
          <p className="text-base font-semibold text-base-content">
            {t('settings.sections.appearance')}
          </p>
          <p className="text-sm text-base-content/70">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-base-content">{t('settings.fields.theme')}</p>
          <p className="text-xs text-base-content/60">{t('settings.sections.appearance')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onThemeChange(option.value)}
                  className="justify-between shadow-sm"
                >
                  {t(option.labelKey)}
                  {isActive && <Check className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            className="flex items-center gap-3 text-sm font-medium text-base-content"
            htmlFor="language-select"
          >
            <Languages className="h-4 w-4 text-base-content/70" />
            {t('settings.fields.language')}
          </label>
          <Select
            id="language-select"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as 'en' | 'fr')}
            className="mt-3 w-full"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  );
}
