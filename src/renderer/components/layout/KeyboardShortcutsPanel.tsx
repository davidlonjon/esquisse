import { X } from 'lucide-react';

import { Badge, Button, Modal } from '@ui';

export interface ShortcutItem {
  combo: string;
  label: string;
  description?: string;
}

interface KeyboardShortcutsPanelProps {
  shortcuts: ShortcutItem[];
  onClose: () => void;
  title: string;
  description: string;
  closeLabel: string;
}

const ShortcutBadge = ({ combo }: { combo: string }) => (
  <Badge
    variant="outline"
    className="border-base-300 bg-base-100 text-base-content dark:border-base-300/70 dark:bg-base-300/20"
  >
    {combo}
  </Badge>
);

export function KeyboardShortcutsPanel({
  shortcuts,
  onClose,
  title,
  description,
  closeLabel,
}: KeyboardShortcutsPanelProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      align="center"
      panelClassName="relative rounded-lg border border-base-200 bg-base-100 p-0 text-base-content"
    >
      <Button
        variant="ghost"
        size="sm"
        shape="circle"
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="px-6 pt-8 pb-5">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-base-content/70">{description}</p>
      </div>

      <div className="space-y-3 px-6 pb-6">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.combo}
            className="flex items-center justify-between rounded-2xl border border-base-200/80 bg-base-100/90 px-4 py-3 shadow-sm dark:border-base-300/60 dark:bg-base-300/10"
          >
            <div>
              <p className="font-medium">{shortcut.label}</p>
              {shortcut.description && (
                <p className="text-sm text-base-content/70">{shortcut.description}</p>
              )}
            </div>
            <ShortcutBadge combo={shortcut.combo} />
          </div>
        ))}
      </div>
    </Modal>
  );
}
