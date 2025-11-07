import { useEffect, useRef, useState } from 'react';

export interface UseAutoSaveOptions {
  delay?: number; // Delay in milliseconds before saving
  onSave: (content: string) => void | Promise<void>;
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  trigger: (content: string) => void;
}

/**
 * Hook for auto-saving content with debouncing
 * Waits for user to stop typing before saving
 */
export function useAutoSave({
  delay = 2000,
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
