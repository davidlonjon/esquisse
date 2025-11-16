import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type SectionId = 'appearance' | 'editor' | 'autosave';

export interface Section {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

interface SettingsSidebarProps {
  sections: Section[];
  activeSection: SectionId;
  onSectionClick: (id: SectionId) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function SettingsSidebar({
  sections,
  activeSection,
  onSectionClick,
  onBack,
  isLoading,
  error,
}: SettingsSidebarProps) {
  const { t } = useTranslation();
  const footerShortcutLabel = null;

  return (
    <aside className="flex w-64 flex-col border-r border-base-200 bg-base-200/70 dark:bg-base-200/20">
      <div className="px-6 pt-8 pb-4 space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-transparent bg-transparent px-3 py-1 text-xs font-medium text-base-content/70 transition hover:border-base-300 hover:bg-base-100 hover:text-base-content"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t('settings.backToApp', 'Back to app')}</span>
        </button>
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
              onClick={() => onSectionClick(id)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          </li>
        ))}
      </ul>

      {footerShortcutLabel && null}
    </aside>
  );
}
