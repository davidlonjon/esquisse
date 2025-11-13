import { useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { Check, Clock3, Languages, Palette, Type, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import { Modal } from '@layout/Modal';

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
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={clsx('btn btn-sm justify-between shadow-sm', {
                    'btn-primary text-base-100': isActive,
                    'btn-outline border-base-300 text-base-content/80 hover:text-base-content':
                      !isActive,
                  })}
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
            className="flex items-center gap-3 text-sm font-medium text-base-content"
            htmlFor="language-select"
          >
            <Languages className="h-4 w-4 text-base-content/70" />
            {t('settings.fields.language')}
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value as 'en' | 'fr')}
            className="select select-bordered mt-3 w-full"
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
  );

  const renderEditorSection = () => (
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
            <span className="badge badge-outline">{fontSize}px</span>
          </div>
          <input
            id="font-size"
            type="range"
            min={12}
            max={28}
            value={fontSize}
            onChange={(event) => handleFontSizeChange(Number(event.target.value))}
            className="range range-primary mt-4"
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
          <input
            id="font-family"
            type="text"
            value={fontFamily}
            onChange={(event) => handleFontFamilyChange(event.target.value)}
            className="input input-bordered mt-3 w-full"
          />
        </div>
      </div>
    </section>
  );

  const renderAutosaveSection = () => (
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
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={autoSave}
            onChange={handleAutoSaveToggle}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-base-content">
                {t('settings.fields.autoSaveInterval', { seconds: autoSaveSeconds })}
              </p>
              <p className="text-xs text-base-content/60">{t('settings.sections.autosave')}</p>
            </div>
            <span className="badge badge-outline">{autoSaveSeconds}s</span>
          </div>
          <input
            id="autosave-interval"
            type="range"
            min={5}
            max={120}
            value={autoSaveSeconds}
            onChange={(event) => handleAutoSaveIntervalChange(Number(event.target.value))}
            className="range range-primary mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-base-content/60">
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
    <Modal
      isOpen
      onClose={closeSettings}
      size="lg"
      panelClassName="flex h-[min(90vh,760px)] w-full overflow-hidden rounded-lg border border-base-200 bg-base-100 text-base-content shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
    >
      <button
        type="button"
        onClick={closeSettings}
        aria-label={t('settings.back')}
        className="btn btn-ghost btn-circle btn-sm absolute right-4 top-4 z-20"
      >
        <X className="h-4 w-4" />
      </button>

      <aside className="flex w-64 flex-col border-r border-base-200 bg-base-200/70 dark:bg-base-200/20">
        <div className="px-6 pt-8 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-base-content/70">
            {t('settings.title')}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-base-content">
            {t('settings.description')}
          </h2>
        </div>

        {(isLoading || error) && (
          <div className="px-6 pb-3 text-xs text-error">
            {isLoading ? t('settings.loading') : error}
          </div>
        )}

        <ul className="menu flex-1 gap-1 px-2 text-sm">
          {sections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                className={clsx('justify-start gap-3 rounded-2xl', {
                  'bg-base-100 text-base-content shadow-sm': activeSection === id,
                  'text-base-content/70 hover:bg-base-100': activeSection !== id,
                })}
                onClick={() => handleSectionClick(id)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-base-200 px-6 py-4 text-xs text-base-content/70">
          ⌘ , · Esc
        </div>
      </aside>

      <div className="flex-1 bg-base-100 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-8">{renderActiveSection()}</div>
      </div>
    </Modal>
  );
}
