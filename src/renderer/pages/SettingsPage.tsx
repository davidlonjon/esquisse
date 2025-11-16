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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadStatus = useSettingsStore((state) => state.progress.load.status);
  const loadError = useSettingsStore((state) => state.progress.load.error);
  const isLoading = loadStatus === 'loading';

  const closeSettings = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
        error={loadError}
      />

      <div className="flex-1 bg-base-100 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-8">{renderActiveSection()}</div>
      </div>
    </Modal>
  );
}
