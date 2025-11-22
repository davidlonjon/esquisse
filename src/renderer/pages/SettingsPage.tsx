import { useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Palette, Type } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IpcErrorBoundary, IpcErrorFallback } from '@components/layout';
import { useSettingsStore } from '@features/settings';
import {
  AppearanceSettings,
  AutosaveSettings,
  EditorSettings,
  SectionId,
  SettingsSidebar,
} from '@features/settings/components';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadStatus = useSettingsStore((state) => state.progress.load.status);
  const loadError = useSettingsStore((state) => state.progress.load.error);
  const isLoading = loadStatus === 'loading';

  const closeSettings = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: '/' });
    }
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useGlobalHotkeys(
    'escape',
    (event) => {
      event.preventDefault();
      closeSettings();
    },
    { preventDefault: true }
  );

  useGlobalHotkeys(
    'mod+comma',
    (event) => {
      event.preventDefault();
      closeSettings();
    },
    { preventDefault: true }
  );

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
        return <AppearanceSettings />;
      case 'editor':
        return <EditorSettings />;
      case 'autosave':
      default:
        return <AutosaveSettings />;
    }
  };

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-base-200 text-base-content">
      <SettingsSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionClick={setActiveSection}
        onBack={closeSettings}
        isLoading={isLoading}
        error={loadError}
      />

      <IpcErrorBoundary
        fallback={(error, retry) => (
          <IpcErrorFallback error={error} retry={retry} variant="inline" />
        )}
      >
        <div className="flex-1 overflow-y-auto bg-base-100 px-8 py-12 sm:px-12">
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="border-b border-base-200 pb-6">
              <h2 className="text-2xl font-bold">{currentSection?.label}</h2>
              <p className="mt-1 text-sm text-base-content/60">{t('settings.description')}</p>
            </div>
            {renderActiveSection()}
          </div>
        </div>
      </IpcErrorBoundary>
    </div>
  );
}
