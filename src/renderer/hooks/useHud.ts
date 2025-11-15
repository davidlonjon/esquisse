import { useCallback, useEffect, useRef, useState } from 'react';

import { HUD_AUTO_HIDE_DELAY } from '@features/editor/constants';

import { useEdgeReveal } from './useEdgeReveal';
import { useGlobalHotkeys } from './useGlobalHotkeys';

export function useHud() {
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [hudTemporaryVisible, setHudTemporaryVisible] = useState(false);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudEdgeVisible = useEdgeReveal();

  const clearHudTimeout = useCallback(() => {
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
      hudTimeoutRef.current = null;
    }
  }, []);

  const showHudTemporarily = useCallback(() => {
    setHudTemporaryVisible(true);
    clearHudTimeout();
    hudTimeoutRef.current = setTimeout(() => {
      setHudTemporaryVisible(false);
      hudTimeoutRef.current = null;
    }, HUD_AUTO_HIDE_DELAY);
  }, [clearHudTimeout]);

  const hideTemporaryHud = useCallback(() => {
    clearHudTimeout();
    setHudTemporaryVisible(false);
  }, [clearHudTimeout]);

  // Register HUD toggle shortcut (Cmd/Ctrl+.)
  // Using 'period' instead of '.' for better compatibility
  useGlobalHotkeys(
    'mod+period',
    (event) => {
      event.preventDefault();
      setIsHudPinned((prev) => !prev);
    },
    { preventDefault: true }
  );

  const isHudVisible = isHudPinned || hudEdgeVisible || hudTemporaryVisible;

  useEffect(() => clearHudTimeout, [clearHudTimeout]);

  return {
    isHudVisible,
    isHudPinned,
    showHudTemporarily,
    hideTemporaryHud,
    toggleHudPin: () => setIsHudPinned((prev) => !prev),
    setHudPinned: setIsHudPinned,
  };
}
