import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSessionTimer } from './useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with 0 seconds', () => {
    const { result } = renderHook(() => useSessionTimer());

    expect(result.current.seconds).toBe(0);
  });

  it('should increment seconds after default interval (1000ms)', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(2);
  });

  it('should increment seconds after custom interval', () => {
    const { result } = renderHook(() => useSessionTimer(500));

    // Timer interval is set once during mount, so we still advance by 500ms
    // but the seconds update happens based on elapsed time calculation
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(2);
  });

  it('should count multiple seconds correctly', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBe(5);
  });

  it('should reset timer to 0', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.seconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(2);
  });

  it('should continue counting after reset', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(3);

    act(() => {
      result.current.reset();
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.seconds).toBe(4);
  });

  it('should handle multiple resets', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(2);

    act(() => {
      result.current.reset();
    });
    expect(result.current.seconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.seconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(3);
  });

  it('should clean up interval on unmount', () => {
    const { unmount } = renderHook(() => useSessionTimer());

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('should handle partial seconds correctly', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should floor to 1 second
    expect(result.current.seconds).toBe(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should be 2 seconds
    expect(result.current.seconds).toBe(2);
  });

  it('should update interval reference without recreating timer', () => {
    const { result, rerender } = renderHook(
      ({ interval }: { interval: number }) => useSessionTimer(interval),
      { initialProps: { interval: 1000 } }
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(1);

    // Change interval (note: this won't affect existing timer interval,
    // but ensures no error occurs and ref is updated)
    rerender({ interval: 500 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(2);
  });

  it('should handle rapid time advances', () => {
    const { result } = renderHook(() => useSessionTimer(100));

    // The interval is set once at 100ms, so after advancing 500ms,
    // the timer should have ticked 5 times, calculating elapsed seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBeGreaterThanOrEqual(5);
  });
});
