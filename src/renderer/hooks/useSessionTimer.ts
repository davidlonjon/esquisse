import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks elapsed seconds since the last reset. Useful for session timers.
 */
export function useSessionTimer(updateInterval = 1000) {
  const startRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (startRef.current === null) {
      startRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startRef.current === null) {
        startRef.current = Date.now();
        setSeconds(0);
        return;
      }

      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return { seconds, reset };
}
