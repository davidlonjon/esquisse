import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IPC_CHANNELS } from '@shared/ipc';

import * as windowManager from './window-manager';

// Mock window-manager module
vi.mock('./window-manager');

// Mock Electron ipcMain
const mockHandlers = new Map<string, Function>();
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn((channel: string, handler: Function) => {
      mockHandlers.set(channel, handler);
    }),
  },
}));

// Import after mocks are set up
import { registerWindowHandlers } from './window.ipc';

describe('window.ipc.ts - Window IPC Handlers', () => {
  const mockWindow = {
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    isMaximized: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
    registerWindowHandlers();
  });

  describe('registerWindowHandlers', () => {
    it('should register all window IPC handlers', () => {
      expect(mockHandlers.size).toBe(3);
      expect(mockHandlers.has(IPC_CHANNELS.WINDOW_MINIMIZE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.WINDOW_MAXIMIZE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.WINDOW_CLOSE)).toBe(true);
    });
  });

  describe('WINDOW_MINIMIZE handler', () => {
    it('should minimize the main window', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      handler();

      expect(windowManager.getMainWindow).toHaveBeenCalled();
      expect(mockWindow.minimize).toHaveBeenCalled();
    });

    it('should handle null window gracefully', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;

      expect(() => handler()).not.toThrow();
      expect(windowManager.getMainWindow).toHaveBeenCalled();
    });

    it('should only minimize when window exists', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      handler();

      expect(mockWindow.minimize).not.toHaveBeenCalled();
    });
  });

  describe('WINDOW_MAXIMIZE handler', () => {
    it('should maximize window when not maximized', () => {
      mockWindow.isMaximized.mockReturnValue(false);
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;
      handler();

      expect(windowManager.getMainWindow).toHaveBeenCalled();
      expect(mockWindow.isMaximized).toHaveBeenCalled();
      expect(mockWindow.maximize).toHaveBeenCalled();
      expect(mockWindow.unmaximize).not.toHaveBeenCalled();
    });

    it('should unmaximize window when maximized', () => {
      mockWindow.isMaximized.mockReturnValue(true);
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;
      handler();

      expect(windowManager.getMainWindow).toHaveBeenCalled();
      expect(mockWindow.isMaximized).toHaveBeenCalled();
      expect(mockWindow.unmaximize).toHaveBeenCalled();
      expect(mockWindow.maximize).not.toHaveBeenCalled();
    });

    it('should handle null window gracefully', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;

      expect(() => handler()).not.toThrow();
      expect(windowManager.getMainWindow).toHaveBeenCalled();
    });

    it('should toggle between maximized and unmaximized states', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;

      // First call: not maximized -> maximize
      mockWindow.isMaximized.mockReturnValue(false);
      handler();
      expect(mockWindow.maximize).toHaveBeenCalledTimes(1);
      expect(mockWindow.unmaximize).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // Second call: maximized -> unmaximize
      mockWindow.isMaximized.mockReturnValue(true);
      handler();
      expect(mockWindow.unmaximize).toHaveBeenCalledTimes(1);
      expect(mockWindow.maximize).not.toHaveBeenCalled();
    });
  });

  describe('WINDOW_CLOSE handler', () => {
    it('should close the main window', () => {
      vi.mocked(windowManager.closeMainWindow).mockImplementation(() => {
        /* mock */
      });

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_CLOSE)!;
      handler();

      expect(windowManager.closeMainWindow).toHaveBeenCalled();
    });

    it('should call closeMainWindow exactly once', () => {
      vi.mocked(windowManager.closeMainWindow).mockImplementation(() => {
        /* mock */
      });

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_CLOSE)!;
      handler();

      expect(windowManager.closeMainWindow).toHaveBeenCalledTimes(1);
    });

    it('should handle closeMainWindow errors gracefully', () => {
      vi.mocked(windowManager.closeMainWindow).mockImplementation(() => {
        throw new Error('Close failed');
      });

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_CLOSE)!;

      expect(() => handler()).toThrow('Close failed');
    });
  });

  describe('Integration Tests', () => {
    it('should support full window lifecycle', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);
      vi.mocked(windowManager.closeMainWindow).mockImplementation(() => {
        /* mock */
      });
      mockWindow.isMaximized.mockReturnValue(false);

      // Minimize
      const minimizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      minimizeHandler();
      expect(mockWindow.minimize).toHaveBeenCalled();

      // Maximize
      const maximizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;
      maximizeHandler();
      expect(mockWindow.maximize).toHaveBeenCalled();

      // Unmaximize
      mockWindow.isMaximized.mockReturnValue(true);
      maximizeHandler();
      expect(mockWindow.unmaximize).toHaveBeenCalled();

      // Close
      const closeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_CLOSE)!;
      closeHandler();
      expect(windowManager.closeMainWindow).toHaveBeenCalled();
    });

    it('should handle multiple minimize calls', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      handler();
      handler();
      handler();

      expect(mockWindow.minimize).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple maximize/unmaximize toggles', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);
      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;

      // Maximize
      mockWindow.isMaximized.mockReturnValue(false);
      handler();
      expect(mockWindow.maximize).toHaveBeenCalledTimes(1);

      // Unmaximize
      mockWindow.isMaximized.mockReturnValue(true);
      handler();
      expect(mockWindow.unmaximize).toHaveBeenCalledTimes(1);

      // Maximize again
      mockWindow.isMaximized.mockReturnValue(false);
      handler();
      expect(mockWindow.maximize).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined window', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(undefined as any);

      const minimizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      const maximizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;

      expect(() => minimizeHandler()).not.toThrow();
      expect(() => maximizeHandler()).not.toThrow();
    });

    it('should handle window that becomes null during operation', () => {
      let callCount = 0;
      vi.mocked(windowManager.getMainWindow).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? (mockWindow as any) : null;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      handler();
      handler();

      expect(mockWindow.minimize).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid window control calls', () => {
      vi.mocked(windowManager.getMainWindow).mockReturnValue(mockWindow as any);
      mockWindow.isMaximized.mockReturnValue(false);

      const minimizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MINIMIZE)!;
      const maximizeHandler = mockHandlers.get(IPC_CHANNELS.WINDOW_MAXIMIZE)!;

      // Rapid calls
      minimizeHandler();
      maximizeHandler();
      minimizeHandler();
      maximizeHandler();

      expect(mockWindow.minimize).toHaveBeenCalledTimes(2);
      expect(mockWindow.maximize).toHaveBeenCalledTimes(2);
    });
  });
});
