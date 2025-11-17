import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z, ZodError } from 'zod';

import type { Result } from '@shared/types';

import { registerSafeHandler } from './safe-handler';

// Mock electron's ipcMain
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('safe-handler.ts - Safe IPC Handler', () => {
  const mockEvent = {} as IpcMainInvokeEvent;
  let registeredHandlers: Map<string, (...args: unknown[]) => Promise<unknown>>;

  beforeEach(() => {
    registeredHandlers = new Map();
    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      registeredHandlers.set(channel, handler as (...args: unknown[]) => Promise<unknown>);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    registeredHandlers.clear();
  });

  describe('registerSafeHandler', () => {
    it('should register handler with ipcMain', () => {
      const schema = z.tuple([z.string()]);
      const handler = vi.fn(async () => 'result');

      registerSafeHandler('test:channel', schema, handler);

      expect(ipcMain.handle).toHaveBeenCalledWith('test:channel', expect.any(Function));
    });

    it('should validate input arguments against schema', async () => {
      const schema = z.tuple([z.string().min(1)]);
      const handler = vi.fn(async (_event, [str]) => `Hello ${str}`);

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 'World')) as Result<string>;

      expect(result.ok).toBe(true);
      expect(result).toEqual({ ok: true, data: 'Hello World' });
      expect(handler).toHaveBeenCalledWith(mockEvent, ['World']);
    });

    it('should reject invalid input with ZodError', async () => {
      const schema = z.tuple([z.string().min(1)]);
      const handler = vi.fn();

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, '')) as Result<unknown>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid IPC payload received.');
        expect(result.error.details).toBeDefined();
      }
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle complex validation schemas', async () => {
      const schema = z.tuple([
        z.object({
          name: z.string().min(1).max(100),
          age: z.number().int().min(0).max(150),
          email: z.string().email(),
        }),
      ]);
      const handler = vi.fn(async (_event, [user]) => user);

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const validUser = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = (await registeredHandler(mockEvent, validUser)) as Result<typeof validUser>;

      expect(result.ok).toBe(true);
      expect(result).toEqual({ ok: true, data: validUser });
    });

    it('should reject invalid complex objects', async () => {
      const schema = z.tuple([
        z.object({
          name: z.string().min(1),
          age: z.number().int().min(0),
        }),
      ]);
      const handler = vi.fn();

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const invalidUser = {
        name: '',
        age: -5,
      };

      const result = (await registeredHandler(mockEvent, invalidUser)) as Result<unknown>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_VALIDATION_ERROR');
        expect(result.error.details).toBeDefined();
        expect((result.error.details as ZodError['issues']).length).toBeGreaterThan(0);
      }
    });

    it('should wrap handler results in Result type with ok: true', async () => {
      const schema = z.tuple([z.number()]);
      const handler = vi.fn(async (_event, [num]) => num * 2);

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 5)) as Result<number>;

      expect(result).toEqual({ ok: true, data: 10 });
    });

    it('should handle empty argument schemas', async () => {
      const schema = z.tuple([]);
      const handler = vi.fn(async () => 'no args');

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent)) as Result<string>;

      expect(result).toEqual({ ok: true, data: 'no args' });
      expect(handler).toHaveBeenCalledWith(mockEvent, []);
    });

    it('should handle optional parameters', async () => {
      const schema = z.tuple([z.string().optional()]);
      const handler = vi.fn(async (_event, [str]) => str || 'default');

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;

      // With argument
      const result1 = (await registeredHandler(mockEvent, 'value')) as Result<string>;
      expect(result1).toEqual({ ok: true, data: 'value' });

      // Without argument (undefined)
      const result2 = (await registeredHandler(mockEvent, undefined)) as Result<string>;
      expect(result2).toEqual({ ok: true, data: 'default' });
    });
  });

  describe('Error Handling', () => {
    it('should catch and format handler errors', async () => {
      const schema = z.tuple([z.string()]);
      const handler = vi.fn(async () => {
        throw new Error('Handler failed');
      });

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 'test')) as Result<unknown>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_HANDLER_ERROR');
        expect(result.error.message).toBe('Handler failed');
      }
    });

    it('should handle synchronous errors', async () => {
      const schema = z.tuple([z.number()]);
      const handler = vi.fn((_event, [num]) => {
        if (num === 0) {
          throw new Error('Division by zero');
        }
        return 100 / num;
      });

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 0)) as Result<number>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_HANDLER_ERROR');
        expect(result.error.message).toBe('Division by zero');
      }
    });

    it('should handle unknown errors', async () => {
      const schema = z.tuple([z.string()]);
      const handler = vi.fn(async () => {
        throw new Error('string error');
      });

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 'test')) as Result<unknown>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_HANDLER_ERROR');
        expect(result.error.message).toBe('string error');
      }
    });

    it('should provide detailed Zod error information', async () => {
      const schema = z.tuple([
        z.object({
          email: z.string().email(),
          age: z.number().min(18),
        }),
      ]);
      const handler = vi.fn();

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, {
        email: 'invalid-email',
        age: 15,
      })) as Result<unknown>;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IPC_VALIDATION_ERROR');
        expect(result.error.message).toBe('Invalid IPC payload received.');
        const issues = result.error.details as ZodError['issues'];
        expect(issues.length).toBeGreaterThanOrEqual(2);
        expect(issues.some((issue) => issue.path.includes('email'))).toBe(true);
        expect(issues.some((issue) => issue.path.includes('age'))).toBe(true);
      }
    });
  });

  describe('Multiple Arguments', () => {
    it('should handle multiple arguments', async () => {
      const schema = z.tuple([z.string(), z.number(), z.boolean()]);
      const handler = vi.fn(async (_event, [str, num, bool]) => ({
        str,
        num,
        bool,
      }));

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, 'test', 42, true)) as Result<{
        str: string;
        num: number;
        bool: boolean;
      }>;

      expect(result.ok).toBe(true);
      expect(result).toEqual({
        ok: true,
        data: { str: 'test', num: 42, bool: true },
      });
    });

    it('should validate all arguments in tuple', async () => {
      const schema = z.tuple([z.string().min(1), z.number().positive()]);
      const handler = vi.fn();

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;

      // Invalid first argument
      const result1 = (await registeredHandler(mockEvent, '', 5)) as Result<unknown>;
      expect(result1.ok).toBe(false);

      // Invalid second argument
      const result2 = (await registeredHandler(mockEvent, 'test', -5)) as Result<unknown>;
      expect(result2.ok).toBe(false);

      // Both valid
      const result3 = (await registeredHandler(mockEvent, 'test', 5)) as Result<unknown>;
      expect(result3.ok).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety through the pipeline', async () => {
      type User = { name: string; id: number };
      const schema = z.tuple([z.object({ name: z.string(), id: z.number() })]);
      const handler = vi.fn(async (_event, [user]: [User]) => ({
        ...user,
        processed: true,
      }));

      registerSafeHandler('test:channel', schema, handler);

      const registeredHandler = registeredHandlers.get('test:channel')!;
      const result = (await registeredHandler(mockEvent, {
        name: 'Alice',
        id: 123,
      })) as Result<User & { processed: boolean }>;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.id).toBe(123);
        expect(result.data.processed).toBe(true);
      }
    });
  });
});
