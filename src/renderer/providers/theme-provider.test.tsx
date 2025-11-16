import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ThemeProvider, useTheme } from './theme-provider';

describe('ThemeProvider', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
        clear: () => {
          localStorageMock = {};
        },
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Clear document classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Child content</div>
        </ThemeProvider>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('Default Theme', () => {
    it('should use system as default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('system');
    });

    it('should use custom default theme when provided', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should load theme from localStorage if available', () => {
      localStorageMock['vite-ui-theme'] = 'light';

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Theme Application', () => {
    it('should apply dark theme class to document', () => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should apply light theme class to document', () => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should apply system theme based on matchMedia', () => {
      // matchMedia mocked to return dark
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should remove old theme classes when theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Theme Setting', () => {
    it('should update theme when setTheme is called', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('system');

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should save theme to localStorage when setTheme is called', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorageMock['vite-ui-theme']).toBe('light');
    });

    it('should use custom storage key when provided', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider storageKey="custom-theme">{children}</ThemeProvider>
        ),
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock['custom-theme']).toBe('dark');
    });
  });

  describe('useTheme Hook', () => {
    it('should return theme and setTheme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('Theme Switching', () => {
    it('should switch from light to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should switch from dark to system', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should handle multiple theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('system');
      });
      expect(result.current.theme).toBe('system');
    });
  });
});
