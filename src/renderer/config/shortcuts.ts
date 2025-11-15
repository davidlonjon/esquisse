/**
 * Keyboard Shortcuts Registry
 * Central documentation of all keyboard shortcuts in the application
 *
 * Note: 'mod' means Cmd on macOS and Ctrl on Windows/Linux
 */

export interface Shortcut {
  /** Keyboard combination (e.g., 'mod+s', 'escape') */
  keys: string;
  /** Human-readable description */
  description: string;
  /** Category for grouping */
  category: 'navigation' | 'ui' | 'editor' | 'modal';
  /** Where the shortcut is registered */
  location: string;
  /** Whether it respects global enabled state */
  globallyControlled: boolean;
}

export const SHORTCUTS: Shortcut[] = [
  // Navigation shortcuts
  {
    keys: 'mod+bracketleft',
    description: 'Navigate to next entry (Cmd+[ or Ctrl+[)',
    category: 'navigation',
    location: 'hooks/useEntryNavigation.ts',
    globallyControlled: true,
  },
  {
    keys: 'mod+bracketright',
    description: 'Navigate to previous entry (Cmd+] or Ctrl+])',
    category: 'navigation',
    location: 'hooks/useEntryNavigation.ts',
    globallyControlled: true,
  },
  {
    keys: 'mod+comma',
    description: 'Open settings (Cmd+, or Ctrl+,)',
    category: 'navigation',
    location: 'App.tsx',
    globallyControlled: true,
  },

  // UI shortcuts
  {
    keys: 'mod+period',
    description: 'Toggle HUD pin/unpin (Cmd+. or Ctrl+.)',
    category: 'ui',
    location: 'hooks/useHud.ts',
    globallyControlled: true,
  },
  {
    keys: 'mod+slash',
    description: 'Toggle keyboard shortcuts panel (Cmd+/ or Ctrl+/)',
    category: 'ui',
    location: 'hooks/useKeyboardShortcutsPanel.ts',
    globallyControlled: true,
  },

  // Modal shortcuts
  {
    keys: 'escape',
    description: 'Close modal',
    category: 'modal',
    location: 'components/ui/Modal.tsx',
    globallyControlled: false, // Always works, even when global shortcuts are disabled
  },

  // Editor shortcuts (from Tiptap/Editor component)
  // Note: These are handled by the Editor component itself, not through useGlobalHotkeys
  // Listed here for documentation purposes
];

/**
 * Get all shortcuts grouped by category
 */
export function getShortcutsByCategory(): Record<Shortcut['category'], Shortcut[]> {
  return SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<Shortcut['category'], Shortcut[]>
  );
}

/**
 * Get all globally controlled shortcuts
 * These are disabled when modals are open
 */
export function getGloballyControlledShortcuts(): Shortcut[] {
  return SHORTCUTS.filter((s) => s.globallyControlled);
}

/**
 * Get all modal-specific shortcuts
 * These always work, even when global shortcuts are disabled
 */
export function getModalShortcuts(): Shortcut[] {
  return SHORTCUTS.filter((s) => s.category === 'modal');
}
