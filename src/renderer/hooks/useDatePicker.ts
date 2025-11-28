import { useEffect, useRef, useState } from 'react';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';

interface UseDatePickerOptions {
  currentEntryCreatedAt?: string;
  onDateTimeChange?: (isoString: string) => void;
  onShowHud?: () => void;
  disabled: boolean;
}

export function useDatePicker({
  currentEntryCreatedAt,
  onDateTimeChange,
  onShowHud,
  disabled,
}: UseDatePickerOptions) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePillRef = useRef<HTMLDivElement>(null);
  const hudKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDatePillClick = () => {
    if (currentEntryCreatedAt && onDateTimeChange && !disabled) {
      setIsDatePickerOpen((prev) => !prev);
    }
  };

  // Register keyboard shortcut for date picker (Shift+Cmd+D)
  useGlobalHotkeys(
    'mod+shift+d',
    (event) => {
      event.preventDefault();
      if (currentEntryCreatedAt && onDateTimeChange && !disabled) {
        setIsDatePickerOpen((prev) => !prev);
      }
    },
    { preventDefault: true }
  );

  const handleDateTimeChange = (isoString: string) => {
    if (onDateTimeChange) {
      onDateTimeChange(isoString);
    }
  };

  // Keep HUD visible while date picker is open
  useEffect(() => {
    if (isDatePickerOpen && onShowHud) {
      // Show HUD immediately
      onShowHud();

      // Keep refreshing HUD visibility every 2 seconds to prevent auto-hide
      hudKeepAliveRef.current = setInterval(() => {
        onShowHud();
      }, 2000);
    } else {
      // Clean up interval when picker closes
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    }

    return () => {
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    };
  }, [isDatePickerOpen, onShowHud]);

  return {
    isDatePickerOpen,
    setIsDatePickerOpen,
    datePillRef,
    handleDatePillClick,
    handleDateTimeChange,
  };
}
