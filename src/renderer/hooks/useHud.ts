import { useCallback, useEffect, useRef, useState } from 'react';

import { HUD_AUTO_HIDE_DELAY } from '@features/editor/constants';

import { useEdgeReveal } from './useEdgeReveal';

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

  useEffect(() => {
    const handleHudToggle = (event: KeyboardEvent) => {
      const isMetaCombo = event.metaKey || event.ctrlKey;
      if (isMetaCombo && event.key === '.') {
        event.preventDefault();
        setIsHudPinned((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleHudToggle);
    return () => {
      window.removeEventListener('keydown', handleHudToggle);
    };
  }, []);

  const isHudVisible = isHudPinned || hudEdgeVisible || hudTemporaryVisible;

  return { isHudVisible, showHudTemporarily };
}
