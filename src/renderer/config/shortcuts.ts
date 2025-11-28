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
  | 'toggleEditMode'
  | 'changeDatePicker'
  | 'bold'
  | 'italic'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'inlineCode'
  | 'insertLink';

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
    keys: 'mod+shift+h',
    description: 'Toggle help menu (Shift+Cmd+H or Shift+Ctrl+H)',
    category: 'ui',
    location: 'components/layout/HUDHelpMenu.tsx',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.helpMenu.label',
      descriptionKey: 'hud.keyboard.shortcut.helpMenu.description',
      combos: {
        mac: '⇧⌘H',
        windows: 'Shift+Ctrl+H',
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
  {
    id: 'changeDatePicker',
    keys: 'mod+shift+d',
    description: 'Open date/time picker to change entry date',
    category: 'editor',
    location: 'hooks/useDatePicker.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.changeDatePicker.label',
      descriptionKey: 'hud.keyboard.shortcut.changeDatePicker.description',
      combos: {
        mac: '⇧⌘D',
        windows: 'Shift+Ctrl+D',
      },
    },
  },

  // Editor formatting (Tiptap keymaps)
  {
    id: 'bold',
    keys: 'mod+b',
    description: 'Toggle bold formatting',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.bold.label',
      descriptionKey: 'hud.keyboard.shortcut.bold.description',
      combos: {
        mac: '⌘B',
        windows: 'Ctrl B',
      },
    },
  },
  {
    id: 'italic',
    keys: 'mod+i',
    description: 'Toggle italic formatting',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.italic.label',
      descriptionKey: 'hud.keyboard.shortcut.italic.description',
      combos: {
        mac: '⌘I',
        windows: 'Ctrl I',
      },
    },
  },
  {
    id: 'heading1',
    keys: 'mod+alt+1',
    description: 'Toggle heading level 1',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.heading1.label',
      descriptionKey: 'hud.keyboard.shortcut.heading1.description',
      combos: {
        mac: '⌘⌥1',
        windows: 'Ctrl+Alt+1',
      },
    },
  },
  {
    id: 'heading2',
    keys: 'mod+alt+2',
    description: 'Toggle heading level 2',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.heading2.label',
      descriptionKey: 'hud.keyboard.shortcut.heading2.description',
      combos: {
        mac: '⌘⌥2',
        windows: 'Ctrl+Alt+2',
      },
    },
  },
  {
    id: 'heading3',
    keys: 'mod+alt+3',
    description: 'Toggle heading level 3',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.heading3.label',
      descriptionKey: 'hud.keyboard.shortcut.heading3.description',
      combos: {
        mac: '⌘⌥3',
        windows: 'Ctrl+Alt+3',
      },
    },
  },
  {
    id: 'bulletList',
    keys: 'mod+shift+8',
    description: 'Toggle bullet list',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.bulletList.label',
      descriptionKey: 'hud.keyboard.shortcut.bulletList.description',
      combos: {
        mac: '⇧⌘8',
        windows: 'Shift+Ctrl+8',
      },
    },
  },
  {
    id: 'orderedList',
    keys: 'mod+shift+7',
    description: 'Toggle numbered list',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.orderedList.label',
      descriptionKey: 'hud.keyboard.shortcut.orderedList.description',
      combos: {
        mac: '⇧⌘7',
        windows: 'Shift+Ctrl+7',
      },
    },
  },
  {
    id: 'blockquote',
    keys: 'mod+shift+b',
    description: 'Toggle blockquote',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.blockquote.label',
      descriptionKey: 'hud.keyboard.shortcut.blockquote.description',
      combos: {
        mac: '⇧⌘B',
        windows: 'Shift+Ctrl+B',
      },
    },
  },
  {
    id: 'inlineCode',
    keys: 'mod+e',
    description: 'Toggle inline code',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.inlineCode.label',
      descriptionKey: 'hud.keyboard.shortcut.inlineCode.description',
      combos: {
        mac: '⌘E',
        windows: 'Ctrl E',
      },
    },
  },
  {
    id: 'insertLink',
    keys: 'mod+k',
    description: 'Insert or edit a link',
    category: 'editor',
    location: 'Tiptap editor',
    globallyControlled: false,
    display: {
      labelKey: 'hud.keyboard.shortcut.insertLink.label',
      descriptionKey: 'hud.keyboard.shortcut.insertLink.description',
      combos: {
        mac: '⌘K',
        windows: 'Ctrl K',
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
