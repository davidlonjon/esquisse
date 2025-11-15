import { useCallback, useState } from 'react';

import { useGlobalHotkeys } from './useGlobalHotkeys';

const TOGGLE_SHORTCUTS = ['mod+slash', 'shift+mod+slash'];

export function useKeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Respect global hotkey enablement so modals can suppress this shortcut
  useGlobalHotkeys(
    TOGGLE_SHORTCUTS,
    (event) => {
      event.preventDefault();
      togglePanel();
    },
    { preventDefault: true }
  );

  return {
    isShortcutsOpen: isOpen,
    openShortcuts: openPanel,
    closeShortcuts: closePanel,
    toggleShortcuts: togglePanel,
  };
}
