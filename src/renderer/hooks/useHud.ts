import { useCallback, useRef, useState } from 'react';

import { HUD_AUTO_HIDE_DELAY } from '@features/editor/constants';

import { useEdgeReveal } from './useEdgeReveal';
import { useGlobalHotkeys } from './useGlobalHotkeys';

export function useHud() {
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [hudTemporaryVisible, setHudTemporaryVisible] = useState(false);
  const hudTimeoutRef = useRef<number | null>(null);
  const hudEdgeVisible = useEdgeReveal();

  const showHudTemporarily = useCallback(() => {
    setHudTemporaryVisible(true);
    if (hudTimeoutRef.current) {
      window.clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = window.setTimeout(() => {
      setHudTemporaryVisible(false);
      hudTimeoutRef.current = null;
    }, HUD_AUTO_HIDE_DELAY);
  }, []);

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

  return { isHudVisible, showHudTemporarily };
}
