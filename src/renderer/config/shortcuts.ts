/**
 * Keyboard Shortcuts Registry
 * Central documentation of all keyboard shortcuts in the application
 *
 * Note: 'mod' means Cmd on macOS and Ctrl on Windows/Linux
 */

import type { TFunction } from 'i18next';

// Extract valid translation keys from i18next
type TranslationKey = Parameters<TFunction>[0];

export type ShortcutCategory = 'navigation' | 'ui' | 'editor' | 'modal';

export type ShortcutId =
  | 'previousEntry'
  | 'nextEntry'
  | 'openSettings'
  | 'toggleHudPin'
  | 'toggleShortcutsPanel'
  | 'toggleHelpMenu'
  | 'searchEntries'
  | 'commandPalette'
  | 'closeModal'
  | 'deleteEntry'
  | 'toggleFavorite'
  | 'showTimeline'
  | 'toggleEditMode';

export interface ShortcutDisplayMetadata {
  labelKey: TranslationKey;
  descriptionKey?: TranslationKey;
  combos: {
    mac: string;
    windows: string;
  };
}

export interface Shortcut {
  /** Unique identifier used throughout the renderer */
  id: ShortcutId;
  /** Keyboard combination (e.g., 'mod+s', 'escape') */
  keys: string | string[];
  /** Human-readable description */
  description: string;
  /** Category for grouping */
  category: ShortcutCategory;
  /** Where the shortcut is registered */
  location: string;
  /** Whether it respects global enabled state */
  globallyControlled: boolean;
  /** Optional metadata for displaying the shortcut in the UI */
  display?: ShortcutDisplayMetadata;
}

export const SHORTCUTS: Shortcut[] = [
  // Navigation shortcuts
  {
    id: 'previousEntry',
    keys: 'mod+bracketleft',
    description: 'Navigate to previous entry (Cmd+[ or Ctrl+[)',
    category: 'navigation',
    location: 'hooks/useEntryNavigation.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.previousEntry.label',
      descriptionKey: 'hud.keyboard.shortcut.previousEntry.description',
      combos: {
        mac: '⌘[',
        windows: 'Ctrl [',
      },
    },
  },
  {
    id: 'nextEntry',
    keys: 'mod+bracketright',
    description: 'Navigate to next entry (Cmd+] or Ctrl+])',
    category: 'navigation',
    location: 'hooks/useEntryNavigation.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.nextEntry.label',
      descriptionKey: 'hud.keyboard.shortcut.nextEntry.description',
      combos: {
        mac: '⌘]',
        windows: 'Ctrl ]',
      },
    },
  },
  {
    id: 'openSettings',
    keys: 'mod+comma',
    description: 'Open settings (Cmd+, or Ctrl+,)',
    category: 'navigation',
    location: 'App.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.settings.label',
      descriptionKey: 'hud.keyboard.shortcut.settings.description',
      combos: {
        mac: '⌘,',
        windows: 'Ctrl ,',
      },
    },
  },
  {
    id: 'showTimeline',
    keys: 'mod+t',
    description: 'Open timeline (Cmd+T or Ctrl+T)',
    category: 'navigation',
    location: 'App.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.showTimeline.label',
      descriptionKey: 'hud.keyboard.shortcut.showTimeline.description',
      combos: {
        mac: '⌘T',
        windows: 'Ctrl T',
      },
    },
  },

  // UI shortcuts
  {
    id: 'toggleHudPin',
    keys: 'mod+period',
    description: 'Toggle HUD pin/unpin (Cmd+. or Ctrl+.)',
    category: 'ui',
    location: 'hooks/useHud.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.hudToggle.label',
      descriptionKey: 'hud.keyboard.shortcut.hudToggle.description',
      combos: {
        mac: '⌘.',
        windows: 'Ctrl .',
      },
    },
  },
  {
    id: 'toggleShortcutsPanel',
    keys: 'mod+slash',
    description: 'Toggle keyboard shortcuts panel (Cmd+/ or Ctrl+/)',
    category: 'ui',
    location: 'hooks/useKeyboardShortcutsPanel.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.shortcutsPanel.label',
      descriptionKey: 'hud.keyboard.shortcut.shortcutsPanel.description',
      combos: {
        mac: '⌘/',
        windows: 'Ctrl /',
      },
    },
  },
  {
    id: 'toggleHelpMenu',
    keys: 'mod+shift+period',
    description: 'Toggle help menu (Shift+Cmd+. or Shift+Ctrl+.)',
    category: 'ui',
    location: 'components/layout/HUDHelpMenu.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.helpMenu.label',
      descriptionKey: 'hud.keyboard.shortcut.helpMenu.description',
      combos: {
        mac: '⇧⌘.',
        windows: 'Shift+Ctrl+.',
      },
    },
  },
  {
    id: 'searchEntries',
    keys: 'mod+k',
    description: 'Open quick search (Cmd+K or Ctrl+K)',
    category: 'ui',
    location: 'components/layout/OverlayHUD.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.search.label',
      descriptionKey: 'hud.keyboard.shortcut.search.description',
      combos: {
        mac: '⌘K',
        windows: 'Ctrl K',
      },
    },
  },
  {
    id: 'commandPalette',
    keys: 'mod+p',
    description: 'Open command palette (Cmd+P or Ctrl+P)',
    category: 'ui',
    location: 'components/layout/OverlayHUD.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.commandPalette.label',
      descriptionKey: 'hud.keyboard.shortcut.commandPalette.description',
      combos: {
        mac: '⌘P',
        windows: 'Ctrl P',
      },
    },
  },

  // Modal shortcuts
  {
    id: 'closeModal',
    keys: 'escape',
    description: 'Close modal',
    category: 'modal',
    location: 'components/ui/Modal.tsx',
    globallyControlled: false, // Always works, even when global shortcuts are disabled
    display: {
      labelKey: 'hud.keyboard.shortcut.closeModal.label',
      descriptionKey: 'hud.keyboard.shortcut.closeModal.description',
      combos: {
        mac: 'Esc',
        windows: 'Esc',
      },
    },
  },

  // Editor shortcuts
  {
    id: 'deleteEntry',
    keys: 'mod+d',
    description: 'Delete or archive current entry',
    category: 'editor',
    location: 'hooks/useEntryDeletion.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.deleteEntry.label',
      descriptionKey: 'hud.keyboard.shortcut.deleteEntry.description',
      combos: {
        mac: '⌘D',
        windows: 'Ctrl D',
      },
    },
  },
  {
    id: 'toggleFavorite',
    keys: 'mod+shift+f',
    description: 'Toggle favorite status for current entry',
    category: 'editor',
    location: 'App.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.toggleFavorite.label',
      descriptionKey: 'hud.keyboard.shortcut.toggleFavorite.description',
      combos: {
        mac: '⇧⌘F',
        windows: 'Shift+Ctrl+F',
      },
    },
  },
  {
    id: 'toggleEditMode',
    keys: 'mod+shift+e',
    description: 'Toggle between read-only and edit mode',
    category: 'editor',
    location: 'hooks/useEditorController.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.toggleEditMode.label',
      descriptionKey: 'hud.keyboard.shortcut.toggleEditMode.description',
      combos: {
        mac: '⇧⌘E',
        windows: 'Shift+Ctrl+E',
      },
    },
  },

  // Note: Tiptap editor shortcuts are handled by the Editor component itself, not through useGlobalHotkeys
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

/**
 * Lookup a shortcut by its identifier
 */
export function getShortcutById(id: ShortcutId): Shortcut | undefined {
  return SHORTCUTS.find((shortcut) => shortcut.id === id);
}

/**
 * Get display metadata for a shortcut id (if provided)
 */
export function getShortcutDisplayMetadata(id: ShortcutId): ShortcutDisplayMetadata | undefined {
  return getShortcutById(id)?.display;
}

export function getShortcutBindings(id: ShortcutId): string[] {
  const shortcut = getShortcutById(id);
  if (!shortcut) {
    return [];
  }
  return Array.isArray(shortcut.keys) ? shortcut.keys : [shortcut.keys];
}
