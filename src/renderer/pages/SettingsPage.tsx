import { useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { Check, Clock3, Languages, Palette, Type, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';

type SectionId = 'appearance' | 'editor' | 'autosave';

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
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
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

  const closeSettings = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSettings]);

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

  const sections = useMemo<Array<{ id: SectionId; label: string; icon: LucideIcon }>>(
    () => [
      { id: 'appearance', label: t('settings.sections.appearance'), icon: Palette },
      { id: 'editor', label: t('settings.sections.editor'), icon: Type },
      { id: 'autosave', label: t('settings.sections.autosave'), icon: Clock3 },
    ],
    [t]
  );

  const handleSectionClick = (id: SectionId) => {
    setActiveSection(id);
  };

  const renderAppearanceSection = () => (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-base font-semibold text-foreground">
            {t('settings.sections.appearance')}
          </p>
          <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-foreground">{t('settings.fields.theme')}</p>
          <p className="text-xs text-muted-foreground">{t('settings.sections.appearance')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {t(option.labelKey)}
                  {isActive && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            className="flex items-center gap-3 text-sm font-medium text-foreground"
            htmlFor="language-select"
          >
            <Languages className="h-4 w-4 text-muted-foreground" />
            {t('settings.fields.language')}
          </label>
          <div className="mt-3">
            <select
              id="language-select"
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value as 'en' | 'fr')}
              className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground focus:border-foreground/40 focus:outline-none"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-card text-foreground">
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );

  const renderEditorSection = () => (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Type className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-base font-semibold text-foreground">{t('settings.sections.editor')}</p>
          <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('settings.fields.fontSize', { size: fontSize })}
              </p>
              <p className="text-xs text-muted-foreground">{t('settings.sections.editor')}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {fontSize}px
            </span>
          </div>
          <input
            id="font-size"
            type="range"
            min={12}
            max={28}
            value={fontSize}
            onChange={(event) => handleFontSizeChange(Number(event.target.value))}
            className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>12px</span>
            <span>28px</span>
          </div>
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
            className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );

  const renderAutosaveSection = () => (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <Clock3 className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-base font-semibold text-foreground">
            {t('settings.sections.autosave')}
          </p>
          <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t('settings.fields.autoSave')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.sections.autosave')}</p>
          </div>
          <button
            type="button"
            onClick={handleAutoSaveToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              autoSave ? 'bg-foreground' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-card shadow transition ${
                autoSave ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('settings.fields.autoSaveInterval', { seconds: autoSaveSeconds })}
              </p>
              <p className="text-xs text-muted-foreground">{t('settings.sections.autosave')}</p>
            </div>
            <span className="text-sm font-semibold text-foreground">{autoSaveSeconds}s</span>
          </div>
          <input
            id="autosave-interval"
            type="range"
            min={5}
            max={120}
            value={autoSaveSeconds}
            onChange={(event) => handleAutoSaveIntervalChange(Number(event.target.value))}
            className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>
      </div>
    </section>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearanceSection();
      case 'editor':
        return renderEditorSection();
      case 'autosave':
      default:
        return renderAutosaveSection();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-xl transition-opacity"
        onClick={closeSettings}
      />

      <div className="relative z-10 flex h-[min(90vh,760px)] w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card text-foreground shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={closeSettings}
          aria-label={t('settings.back')}
          className="absolute right-5 top-5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <aside className="flex w-64 flex-col border-r border-border bg-muted/40 dark:bg-muted/20">
          <div className="px-6 pt-8 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {t('settings.title')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {t('settings.description')}
            </h2>
          </div>

          {(isLoading || error) && (
            <div className="px-6 pb-3 text-xs text-muted-foreground">
              {isLoading ? t('settings.loading') : error}
            </div>
          )}

          <nav className="mt-2 flex-1 space-y-1 px-2">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSectionClick(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activeSection === id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-border px-6 py-4 text-xs text-muted-foreground">
            ⌘ , · Esc
          </div>
        </aside>

        <div className="flex-1 bg-card px-10 py-12">
          <div className="mx-auto max-w-3xl">{renderActiveSection()}</div>
        </div>
      </div>
    </div>
  );
}
