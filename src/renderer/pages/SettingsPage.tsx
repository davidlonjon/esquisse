import { useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Palette, Type, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@features/settings';
import {
  AppearanceSettings,
  AutosaveSettings,
  EditorSettings,
  SectionId,
  SettingsSidebar,
} from '@features/settings/components';
import { Modal } from '@ui/Modal';

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
    error,
    loadSettings,
    updateSettings,
    status,
  } = useSettingsStore();
  const isLoading = status === 'loading';

  const closeSettings = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <AppearanceSettings
            theme={theme}
            language={language}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
          />
        );
      case 'editor':
        return (
          <EditorSettings
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={handleFontSizeChange}
            onFontFamilyChange={handleFontFamilyChange}
          />
        );
      case 'autosave':
      default:
        return (
          <AutosaveSettings
            autoSave={autoSave}
            autoSaveInterval={autoSaveInterval}
            onAutoSaveToggle={handleAutoSaveToggle}
            onAutoSaveIntervalChange={handleAutoSaveIntervalChange}
          />
        );
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

      <SettingsSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionClick={setActiveSection}
        isLoading={isLoading}
        error={error}
      />

      <div className="flex-1 bg-base-100 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-8">{renderActiveSection()}</div>
      </div>
    </Modal>
  );
}
