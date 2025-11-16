import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { HotkeysProvider, useHotkeysContext } from './hotkeys-provider';

describe('HotkeysProvider', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <HotkeysProvider>
          <div>Child content</div>
        </HotkeysProvider>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('should start with hotkeys enabled', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current.enabled).toBe(true);
    });

    it('should start with modal count of 0', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current.modalCount).toBe(0);
    });

    it('should provide enable function', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(typeof result.current.enable).toBe('function');
    });

    it('should provide disable function', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(typeof result.current.disable).toBe('function');
    });

    it('should provide openModal function', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(typeof result.current.openModal).toBe('function');
    });

    it('should provide closeModal function', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(typeof result.current.closeModal).toBe('function');
    });
  });

  describe('Modal Count Management', () => {
    it('should increment modal count when openModal is called', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current.modalCount).toBe(0);

      act(() => {
        result.current.openModal();
      });

      expect(result.current.modalCount).toBe(1);
    });

    it('should decrement modal count when closeModal is called', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal();
      });
      expect(result.current.modalCount).toBe(1);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalCount).toBe(0);
    });

    it('should handle multiple modal opens', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal();
        result.current.openModal();
        result.current.openModal();
      });

      expect(result.current.modalCount).toBe(3);
    });

    it('should not allow modal count to go below 0', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.closeModal();
        result.current.closeModal();
      });

      expect(result.current.modalCount).toBe(0);
    });

    it('should handle open and close sequence', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal(); // count = 1
        result.current.openModal(); // count = 2
        result.current.closeModal(); // count = 1
        result.current.openModal(); // count = 2
        result.current.closeModal(); // count = 1
        result.current.closeModal(); // count = 0
      });

      expect(result.current.modalCount).toBe(0);
    });
  });

  describe('Enabled State Syncing', () => {
    it('should disable hotkeys when modal count is greater than 0', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.openModal();
      });

      expect(result.current.enabled).toBe(false);
    });

    it('should enable hotkeys when modal count returns to 0', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal();
      });
      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.enabled).toBe(true);
    });

    it('should keep hotkeys disabled while any modal is open', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal();
        result.current.openModal();
      });

      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.closeModal();
      });

      // Still one modal open, should remain disabled
      expect(result.current.enabled).toBe(false);
    });

    it('should only enable hotkeys when all modals are closed', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.openModal();
        result.current.openModal();
        result.current.openModal();
      });
      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.closeModal();
        result.current.closeModal();
      });
      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.enabled).toBe(true);
    });
  });

  describe('Manual Enable/Disable', () => {
    it('should disable hotkeys when disable is called', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.disable();
      });

      expect(result.current.enabled).toBe(false);
    });

    it('should enable hotkeys when enable is called', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      act(() => {
        result.current.disable();
      });
      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.enable();
      });

      expect(result.current.enabled).toBe(true);
    });
  });

  describe('useHotkeysContext Hook', () => {
    it('should throw error when used outside HotkeysProvider', () => {
      expect(() => {
        renderHook(() => useHotkeysContext());
      }).toThrow('useHotkeysContext must be used within a HotkeysProvider');
    });

    it('should return all context values', () => {
      const { result } = renderHook(() => useHotkeysContext(), {
        wrapper: ({ children }) => <HotkeysProvider>{children}</HotkeysProvider>,
      });

      expect(result.current).toHaveProperty('enabled');
      expect(result.current).toHaveProperty('enable');
      expect(result.current).toHaveProperty('disable');
      expect(result.current).toHaveProperty('modalCount');
      expect(result.current).toHaveProperty('openModal');
      expect(result.current).toHaveProperty('closeModal');
    });
  });
});
