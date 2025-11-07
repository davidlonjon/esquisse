import { useEffect, useRef, useState } from 'react';

import { AUTO_SAVE_DELAY } from '../components/Editor/constants';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<string>('');

  const trigger = (content: string) => {
    if (!enabled) return;

    // Store the content to save
    pendingContentRef.current = content;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave(pendingContentRef.current);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    trigger,
  };
}
