import { Link } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';

const THEME_OPTIONS: Array<{ value: 'system' | 'light' | 'dark'; labelKey: string }> = [
  { value: 'system', labelKey: 'settings.options.theme.system' },
  { value: 'light', labelKey: 'settings.options.theme.light' },
  { value: 'dark', labelKey: 'settings.options.theme.dark' },
];

const LANGUAGE_OPTIONS: Array<{ value: 'en' | 'fr'; labelKey: string }> = [
  { value: 'en', labelKey: 'settings.options.language.en' },
  { value: 'fr', labelKey: 'settings.options.language.fr' },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const {
    theme,
    language,
    fontSize,
    fontFamily,
    autoSave,
    autoSaveInterval,
    isLoading,
    error,
    loadSettings,
    updateSettings,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const autoSaveSeconds = useMemo(() => Math.round(autoSaveInterval / 1000), [autoSaveInterval]);

  const handleThemeChange = async (value: 'system' | 'light' | 'dark') => {
    await updateSettings({ theme: value });
  };

  const handleLanguageChange = async (value: 'en' | 'fr') => {
    await updateSettings({ language: value });
    await i18n.changeLanguage(value);
  };

  const handleFontSizeChange = async (value: number) => {
    await updateSettings({ fontSize: value });
  };

  const handleFontFamilyChange = async (value: string) => {
    await updateSettings({ fontFamily: value });
  };

  const handleAutoSaveToggle = async () => {
    await updateSettings({ autoSave: !autoSave });
  };

  const handleAutoSaveIntervalChange = async (seconds: number) => {
    await updateSettings({ autoSaveInterval: seconds * 1000 });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-border"
          >
            {t('settings.back')}
          </Link>
        </div>
        {(isLoading || error) && (
          <p className="text-xs text-muted-foreground">
            {isLoading ? t('settings.loading') : error}
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {t('settings.sections.appearance')}
        </h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-foreground">{t('settings.fields.theme')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={`rounded-full border px-4 py-1 text-sm transition ${
                    theme === option.value
                      ? 'border-foreground text-foreground'
                      : 'border-border/60 text-muted-foreground hover:border-border'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="language-select">
              {t('settings.fields.language')}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value as 'en' | 'fr')}
              className="mt-2 w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {t('settings.sections.editor')}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="font-size">
              {t('settings.fields.fontSize', { size: fontSize })}
            </label>
            <input
              id="font-size"
              type="range"
              min={12}
              max={28}
              value={fontSize}
              onChange={(event) => handleFontSizeChange(Number(event.target.value))}
              className="mt-3 w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="font-family">
              {t('settings.fields.fontFamily')}
            </label>
            <input
              id="font-family"
              type="text"
              value={fontFamily}
              onChange={(event) => handleFontFamilyChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {t('settings.sections.autosave')}
        </h2>

        <div className="space-y-6">
          <label className="flex items-center justify-between text-sm font-medium text-foreground">
            <span>{t('settings.fields.autoSave')}</span>
            <button
              type="button"
              onClick={handleAutoSaveToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                autoSave ? 'bg-foreground' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="autosave-interval">
              {t('settings.fields.autoSaveInterval', { seconds: autoSaveSeconds })}
            </label>
            <input
              id="autosave-interval"
              type="range"
              min={5}
              max={120}
              value={autoSaveSeconds}
              onChange={(event) => handleAutoSaveIntervalChange(Number(event.target.value))}
              className="mt-3 w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
