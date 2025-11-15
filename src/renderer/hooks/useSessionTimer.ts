import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks elapsed seconds since the last reset. Useful for session timers.
 */
export function useSessionTimer(updateInterval = 1000) {
  const startRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const updateIntervalRef = useRef(updateInterval);

  // Update interval ref without recreating the effect
  useEffect(() => {
    updateIntervalRef.current = updateInterval;
  }, [updateInterval]);

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setSeconds(0);
  }, []);

  // Initialize start time
  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  // Set up timer interval (only once on mount)
  useEffect(() => {
    const interval = setInterval(() => {
      if (startRef.current === null) {
        return;
      }

      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, updateIntervalRef.current);

    return () => clearInterval(interval);
  }, []); // Empty deps - interval only created once

  return { seconds, reset };
}
