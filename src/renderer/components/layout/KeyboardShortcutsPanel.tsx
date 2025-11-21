import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SHORTCUTS, type ShortcutCategory } from '@config/shortcuts';
import { getShortcutDisplayInfo } from '@lib/shortcuts';
import { Badge, Drawer, Input } from '@ui';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

const ShortcutBadge = ({ combo }: { combo: string }) => (
  <Badge
    variant="outline"
    className="border-base-300 bg-base-100 font-mono text-xs text-base-content dark:border-base-300/70 dark:bg-base-300/20"
  >
    {combo}
  </Badge>
);

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const displayShortcuts = useMemo(() => {
    return SHORTCUTS.map((shortcut) => {
      const display = getShortcutDisplayInfo(shortcut.id, t);
      return {
        ...shortcut,
        displayLabel: display?.label || '',
        displayDescription: display?.description || '',
        combo: display?.combo || '',
      };
    });
  }, [t]);

  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return displayShortcuts;

    return displayShortcuts.filter(
      (s) =>
        s.displayLabel.toLowerCase().includes(query) ||
        s.displayDescription.toLowerCase().includes(query) ||
        s.combo.toLowerCase().includes(query)
    );
  }, [displayShortcuts, searchQuery]);

  const groupedShortcuts = useMemo(() => {
    const groups: Partial<Record<ShortcutCategory, typeof filteredShortcuts>> = {};

    filteredShortcuts.forEach((shortcut) => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category]!.push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  const categories: ShortcutCategory[] = ['navigation', 'ui', 'editor', 'modal'];

  return (
    <Drawer isOpen onClose={onClose} title={t('hud.keyboard.title')} className="w-80">
      <div className="flex flex-col space-y-6 p-6">
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
            <Search className="h-4 w-4 text-base-content/50" />
          </div>
          <Input
            autoFocus
            placeholder={t('hud.keyboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-8 pb-10">
          {categories.map((category) => {
            const shortcuts = groupedShortcuts[category];
            if (!shortcuts?.length) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                  {t(`hud.keyboard.categories.${category}`)}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-base-content">{shortcut.displayLabel}</span>
                      <ShortcutBadge combo={shortcut.combo} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="py-8 text-center text-sm text-base-content/50">
              {t('entry.archived.empty')}{' '}
              {/* Reusing "No entries" or similar if available, otherwise falling back or adding new key? Actually let's just use a generic message or leave empty for now. */}
              No shortcuts found
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
