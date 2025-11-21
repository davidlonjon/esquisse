import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useKeyboardShortcutsPanel } from './useKeyboardShortcutsPanel';

// Mock dependencies
vi.mock('@config/shortcuts', () => ({
  getShortcutBindings: vi.fn(() => ['mod+slash']),
}));

vi.mock('./useGlobalHotkeys', () => ({
  useGlobalHotkeys: vi.fn(),
}));

describe('useKeyboardShortcutsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with panel closed', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    expect(result.current.isShortcutsOpen).toBe(false);
  });

  it('should open panel', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    act(() => {
      result.current.openShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);
  });

  it('should close panel', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    act(() => {
      result.current.openShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);

    act(() => {
      result.current.closeShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(false);
  });

  it('should toggle panel from closed to open', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    expect(result.current.isShortcutsOpen).toBe(false);

    act(() => {
      result.current.toggleShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);
  });

  it('should toggle panel from open to closed', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    act(() => {
      result.current.openShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);

    act(() => {
      result.current.toggleShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(false);
  });

  it('should toggle panel multiple times', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    expect(result.current.isShortcutsOpen).toBe(false);

    act(() => {
      result.current.toggleShortcuts();
    });
    expect(result.current.isShortcutsOpen).toBe(true);

    act(() => {
      result.current.toggleShortcuts();
    });
    expect(result.current.isShortcutsOpen).toBe(false);

    act(() => {
      result.current.toggleShortcuts();
    });
    expect(result.current.isShortcutsOpen).toBe(true);
  });

  it('should keep panel closed when closing already closed panel', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    expect(result.current.isShortcutsOpen).toBe(false);

    act(() => {
      result.current.closeShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(false);
  });

  it('should keep panel open when opening already open panel', () => {
    const { result } = renderHook(() => useKeyboardShortcutsPanel());

    act(() => {
      result.current.openShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);

    act(() => {
      result.current.openShortcuts();
    });

    expect(result.current.isShortcutsOpen).toBe(true);
  });

  it('should register global hotkey for toggle', async () => {
    const { useGlobalHotkeys } = await import('./useGlobalHotkeys');

    renderHook(() => useKeyboardShortcutsPanel());

    expect(useGlobalHotkeys).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Function),
      { preventDefault: true, enableOnFormTags: true },
      false
    );
  });

  it('should return stable callback references', () => {
    const { result, rerender } = renderHook(() => useKeyboardShortcutsPanel());

    const callbacks = {
      openShortcuts: result.current.openShortcuts,
      closeShortcuts: result.current.closeShortcuts,
      toggleShortcuts: result.current.toggleShortcuts,
    };

    rerender();

    expect(result.current.openShortcuts).toBe(callbacks.openShortcuts);
    expect(result.current.closeShortcuts).toBe(callbacks.closeShortcuts);
    expect(result.current.toggleShortcuts).toBe(callbacks.toggleShortcuts);
  });
});
