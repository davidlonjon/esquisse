import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { Result } from '@shared/types';

import { getErrorMessage, getWindowAPI, resolveResult } from './utils';

describe('utils.ts - Renderer Service Utilities', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      const message = getErrorMessage(error);

      expect(message).toBe('Test error message');
    });

    it('should convert string to string', () => {
      const message = getErrorMessage('Plain string error');

      expect(message).toBe('Plain string error');
    });

    it('should convert number to string', () => {
      const message = getErrorMessage(404);

      expect(message).toBe('404');
    });

    it('should convert boolean to string', () => {
      const message = getErrorMessage(true);

      expect(message).toBe('true');
    });

    it('should convert object to string', () => {
      const message = getErrorMessage({ code: 'ERR', msg: 'Failed' });

      expect(message).toBe('[object Object]');
    });

    it('should convert null to string', () => {
      const message = getErrorMessage(null);

      expect(message).toBe('null');
    });

    it('should convert undefined to string', () => {
      const message = getErrorMessage(undefined);

      expect(message).toBe('undefined');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');
      const message = getErrorMessage(error);

      expect(message).toBe('');
    });

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const message = getErrorMessage(error);

      expect(message).toBe('Custom error message');
    });
  });

  describe('getWindowAPI', () => {
    let originalWindowApi: ElectronAPI | undefined;

    beforeEach(() => {
      originalWindowApi = window.api;
    });

    afterEach(() => {
      if (originalWindowApi) {
        window.api = originalWindowApi;
      } else {
        delete (window as any).api;
      }
    });

    it('should return window.api when available', () => {
      const mockApi = {
        getAllJournals: vi.fn(),
      } as unknown as ElectronAPI;

      window.api = mockApi;

      const api = getWindowAPI();

      expect(api).toBe(mockApi);
    });

    it('should throw error when window.api is undefined', () => {
      delete (window as any).api;

      expect(() => getWindowAPI()).toThrow('Electron renderer API is unavailable.');
    });

    it('should throw error when window.api is null', () => {
      (window as any).api = null;

      expect(() => getWindowAPI()).toThrow('Electron renderer API is unavailable.');
    });

    it('should return same API instance on multiple calls', () => {
      const mockApi = {
        getAllJournals: vi.fn(),
      } as unknown as ElectronAPI;

      window.api = mockApi;

      const api1 = getWindowAPI();
      const api2 = getWindowAPI();

      expect(api1).toBe(api2);
      expect(api1).toBe(mockApi);
    });
  });

  describe('resolveResult', () => {
    it('should return data for successful result', () => {
      const result: Result<string> = {
        ok: true,
        data: 'success data',
      };

      const data = resolveResult(result);

      expect(data).toBe('success data');
    });

    it('should return object data for successful result', () => {
      const mockData = { id: '1', name: 'Test' };
      const result: Result<typeof mockData> = {
        ok: true,
        data: mockData,
      };

      const data = resolveResult(result);

      expect(data).toEqual(mockData);
    });

    it('should return array data for successful result', () => {
      const mockArray = [1, 2, 3];
      const result: Result<number[]> = {
        ok: true,
        data: mockArray,
      };

      const data = resolveResult(result);

      expect(data).toEqual(mockArray);
    });

    it('should throw error for failed result with message', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          message: 'Operation failed',
        },
      };

      expect(() => resolveResult(result)).toThrow('Operation failed');
    });

    it('should throw error for failed result with message and code', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          message: 'Database error',
          code: 'DB_ERROR',
        },
      };

      expect(() => resolveResult(result)).toThrow('Database error (DB_ERROR)');
    });

    it('should throw default error for failed result without message', () => {
      const result: Result<string> = {
        ok: false,
        error: {},
      };

      expect(() => resolveResult(result)).toThrow('Unknown IPC error');
    });

    it('should throw error with code only when message is missing', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          code: 'ERR_CODE',
        },
      };

      expect(() => resolveResult(result)).toThrow('Unknown IPC error (ERR_CODE)');
    });

    it('should handle empty message', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          message: '',
        },
      };

      expect(() => resolveResult(result)).toThrow('Unknown IPC error');
    });

    it('should handle whitespace-only message', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          message: '   ',
        },
      };

      expect(() => resolveResult(result)).toThrow('   ');
    });

    it('should preserve error message formatting', () => {
      const result: Result<string> = {
        ok: false,
        error: {
          message: 'Error:\n  - Detail 1\n  - Detail 2',
        },
      };

      expect(() => resolveResult(result)).toThrow('Error:\n  - Detail 1\n  - Detail 2');
    });

    it('should handle null data in successful result', () => {
      const result: Result<null> = {
        ok: true,
        data: null,
      };

      const data = resolveResult(result);

      expect(data).toBeNull();
    });

    it('should handle undefined data in successful result', () => {
      const result: Result<undefined> = {
        ok: true,
        data: undefined,
      };

      const data = resolveResult(result);

      expect(data).toBeUndefined();
    });

    it('should handle boolean data in successful result', () => {
      const result: Result<boolean> = {
        ok: true,
        data: false,
      };

      const data = resolveResult(result);

      expect(data).toBe(false);
    });

    it('should handle number zero in successful result', () => {
      const result: Result<number> = {
        ok: true,
        data: 0,
      };

      const data = resolveResult(result);

      expect(data).toBe(0);
    });

    it('should handle empty string in successful result', () => {
      const result: Result<string> = {
        ok: true,
        data: '',
      };

      const data = resolveResult(result);

      expect(data).toBe('');
    });
  });
});
