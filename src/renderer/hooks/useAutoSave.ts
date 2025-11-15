import { useCallback, useEffect, useRef, useState } from 'react';

import { AUTO_SAVE_DELAY } from '@features/editor';

export interface UseAutoSaveOptions {
  /** Delay in milliseconds before saving (default: AUTO_SAVE_DELAY constant) */
  delay?: number;
  /** Callback to save content */
  onSave: (content: string) => void | Promise<void>;
  /** Enable/disable auto-save */
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Trigger a save operation (debounced) */
  trigger: (content: string) => void;
  /** Immediately flush any pending auto-save */
  flush: () => Promise<void>;
  /** Cancel any pending auto-save */
  cancel: () => void;
}

/**
 * Hook for auto-saving content with debouncing
 * Waits for user to stop typing before saving
 *
 * @example
 * ```tsx
 * const { isSaving, lastSaved, trigger } = useAutoSave({
 *   delay: 2000,
 *   onSave: async (content) => {
 *     await api.saveEntry(content);
 *   },
 * });
 * ```
 */
export function useAutoSave({
  delay = AUTO_SAVE_DELAY,
  onSave,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string>('');

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await onSave(pendingContentRef.current);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const trigger = useCallback(
    (content: string) => {
      if (!enabled) return;

      pendingContentRef.current = content;
      clearPendingTimeout();
      timeoutRef.current = setTimeout(async () => {
        clearPendingTimeout();
        await executeSave();
      }, delay);
    },
    [clearPendingTimeout, delay, enabled, executeSave]
  );

  const flush = useCallback(async () => {
    if (!enabled) {
      clearPendingTimeout();
      return;
    }

    if (timeoutRef.current) {
      clearPendingTimeout();
      await executeSave();
    }
  }, [clearPendingTimeout, enabled, executeSave]);

  const cancel = useCallback(() => {
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (!enabled) {
      cancel();
    }
  }, [cancel, enabled]);

  return {
    isSaving,
    lastSaved,
    trigger,
    flush,
    cancel,
  };
}
