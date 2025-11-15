import { useCallback, useState } from 'react';

import { getShortcutBindings } from '@config/shortcuts';

import { useGlobalHotkeys } from './useGlobalHotkeys';

const TOGGLE_SHORTCUTS = (() => {
  const bindings = getShortcutBindings('toggleShortcutsPanel');
  return bindings.length > 0 ? bindings : ['mod+slash'];
})();

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
