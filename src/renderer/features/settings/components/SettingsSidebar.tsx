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
    <aside className="flex w-64 flex-col border-r border-base-200 bg-base-100/50 dark:bg-base-200/20">
      <div className="px-6 pt-8 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-base-content/60 transition hover:text-base-content"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t('settings.backToApp', 'Back to app')}</span>
        </button>
        <h1 className="text-2xl font-bold text-base-content">{t('settings.title')}</h1>
      </div>

      {(isLoading || error) && (
        <div className="px-6 pb-3 text-xs text-error">
          {isLoading ? t('settings.loading') : error}
        </div>
      )}

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  {
                    'bg-primary/10 text-primary': activeSection === id,
                    'text-base-content/70 hover:bg-base-200 hover:text-base-content':
                      activeSection !== id,
                  }
                )}
                onClick={() => onSectionClick(id)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {footerShortcutLabel && null}
    </aside>
  );
}
