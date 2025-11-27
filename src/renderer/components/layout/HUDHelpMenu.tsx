import clsx from 'clsx';
import { Keyboard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getShortcutBindings } from '@config/shortcuts';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { getShortcutCombo } from '@lib/shortcuts';
import { ShortcutKeys, Tooltip } from '@ui';

interface HUDHelpMenuProps {
  disabled: boolean;
  onOpenShortcuts: () => void;
  onShowHud?: () => void;
}

export function HUDHelpMenu({ disabled, onOpenShortcuts, onShowHud }: HUDHelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shortcutsCombo = getShortcutCombo('toggleShortcutsPanel') ?? '⌘/';

  // Get the actual key bindings for the help menu shortcut
  const helpMenuBindings = getShortcutBindings('toggleHelpMenu');

  // Register keyboard shortcut to toggle help menu
  useGlobalHotkeys(helpMenuBindings, () => {
    if (!disabled) {
      // Show HUD if it's hidden
      onShowHud?.();
      setIsOpen((prev) => !prev);
    }
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleShortcutsClick = () => {
    setIsOpen(false);
    if (!disabled) {
      onOpenShortcuts();
    }
  };

  const button = (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          setIsOpen(!isOpen);
        }
      }}
      disabled={disabled}
      className={clsx(
        'group flex items-center justify-center rounded-full px-2 py-1 transition',
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      )}
    >
      <div className="flex h-[17px] w-[17px] items-center justify-center rounded-full border border-base-content/30 text-xs font-medium text-base-content/50 transition-colors group-hover:border-base-content group-hover:text-base-content">
        ?
      </div>
    </button>
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* Help button */}
      {disabled ? (
        button
      ) : (
        <Tooltip content="Help" shortcut="⇧⌘H">
          {button}
        </Tooltip>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-xl">
          <button
            type="button"
            onClick={handleShortcutsClick}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-base-content transition-colors hover:bg-base-200/80"
          >
            <div className="flex items-center gap-3">
              <Keyboard className="h-4 w-4 text-base-content/60" />
              <span>Shortcuts</span>
            </div>
            <ShortcutKeys combo={shortcutsCombo} />
          </button>
        </div>
      )}
    </div>
  );
}
