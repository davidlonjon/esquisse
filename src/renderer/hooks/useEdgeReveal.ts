import { useEffect, useState } from 'react';

/**
 * Returns true when the pointer is near the top or bottom edge of the viewport.
 */
export function useEdgeReveal(threshold = 120) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const distanceFromTop = event.clientY;
      const distanceFromBottom = window.innerHeight - event.clientY;
      setIsVisible(distanceFromTop <= threshold || distanceFromBottom <= threshold);
    };

    const handleLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, [threshold]);

  return isVisible;
}
