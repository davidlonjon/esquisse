import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import i18n from '@lib/i18n';
import { Button, Select } from '@ui';

const THEME_OPTIONS = [
  { value: 'system', labelKey: 'settings.options.theme.system' },
  { value: 'light', labelKey: 'settings.options.theme.light' },
  { value: 'dark', labelKey: 'settings.options.theme.dark' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'settings.options.language.en' },
  { value: 'fr', labelKey: 'settings.options.language.fr' },
] as const;

export function AppearanceSettings() {
  const { t } = useTranslation();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleThemeChange = async (value: 'system' | 'light' | 'dark') => {
    await updateSettings({ theme: value });
  };

  const handleLanguageChange = async (value: 'en' | 'fr') => {
    await updateSettings({ language: value });
    await i18n.changeLanguage(value);
  };

  return (
    <section className="space-y-10">
      <div className="grid gap-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-base-content">
            {t('settings.fields.theme')}
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => void handleThemeChange(option.value)}
                  className="justify-between font-normal"
                >
                  {t(option.labelKey)}
                  {isActive && <Check className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-base-content" htmlFor="language-select">
            {t('settings.fields.language')}
          </label>
          <Select
            id="language-select"
            value={language}
            onChange={(event) => void handleLanguageChange(event.target.value as 'en' | 'fr')}
            className="w-full sm:max-w-xs"
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
