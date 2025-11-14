import {
  useHotkeys,
  type HotkeyCallback,
  type Options as HotkeysOptions,
} from 'react-hotkeys-hook';

import { useHotkeysContext } from '@providers/hotkeys-provider';

/**
 * Centralized hook for registering global keyboard shortcuts
 * Automatically respects the global hotkeys enabled/disabled state
 *
 * @param keys - Keyboard shortcut (e.g., 'cmd+s', 'ctrl+shift+p')
 * @param callback - Function to call when shortcut is pressed
 * @param options - Additional options from react-hotkeys-hook
 * @param respectGlobalState - Whether to respect global enabled/disabled state (default: true)
 *
 * @example
 * ```tsx
 * // Basic usage
 * useGlobalHotkeys('cmd+s', () => console.log('Save'));
 *
 * // Modal-specific shortcut (always enabled)
 * useGlobalHotkeys('escape', handleClose, {}, false);
 *
 * // With dependencies
 * useGlobalHotkeys('cmd+enter', handleSubmit, { enabled: canSubmit });
 * ```
 */
export function useGlobalHotkeys(
  keys: string | string[],
  callback: HotkeyCallback,
  options: Omit<HotkeysOptions, 'enabled'> & { enabled?: boolean } = {},
  respectGlobalState = true
) {
  const { enabled: globalEnabled } = useHotkeysContext();

  // Determine if this specific hotkey should be enabled
  const localEnabled = options.enabled !== undefined ? options.enabled : true;
  const finalEnabled = respectGlobalState ? globalEnabled && localEnabled : localEnabled;

  useHotkeys(keys, callback, {
    enableOnContentEditable: true, // Enable shortcuts in editor (Tiptap)
    enableOnFormTags: false, // Disable in actual form inputs
    ...options,
    enabled: finalEnabled,
  });
}
