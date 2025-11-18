import { describe, it, expect, vi } from 'vitest';

import { createAsyncSlice, toAsyncSlice, withAsyncHandler } from './store';

describe('store.ts - Store Utilities', () => {
  describe('createAsyncSlice', () => {
    it('should create idle async slice', () => {
      const slice = createAsyncSlice();
      expect(slice).toEqual({ status: 'idle', error: null });
    });
  });

  describe('toAsyncSlice', () => {
    it('should create loading slice', () => {
      const slice = toAsyncSlice('loading');
      expect(slice).toEqual({ status: 'loading', error: null });
    });

    it('should create success slice', () => {
      const slice = toAsyncSlice('success');
      expect(slice).toEqual({ status: 'success', error: null });
    });

    it('should create error slice with message', () => {
      const slice = toAsyncSlice('error', 'Something went wrong');
      expect(slice).toEqual({ status: 'error', error: 'Something went wrong' });
    });
  });

  describe('withAsyncHandler', () => {
    it('should set loading state when operation starts', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => 'result');

      await withAsyncHandler(mockSet, 'load', mockOperation);

      // First call should set loading
      expect(mockSet).toHaveBeenCalled();
      const firstCall = mockSet.mock.calls[0][0];
      const draft = { progress: { load: createAsyncSlice() } };
      firstCall(draft);
      expect(draft.progress.load).toEqual({ status: 'loading', error: null });
    });

    it('should set success state when operation succeeds', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => 'result');

      await withAsyncHandler(mockSet, 'load', mockOperation);

      // Second call should set success
      expect(mockSet).toHaveBeenCalledTimes(2);
      const secondCall = mockSet.mock.calls[1][0];
      const draft = { progress: { load: createAsyncSlice() } };
      secondCall(draft);
      expect(draft.progress.load).toEqual({ status: 'success', error: null });
    });

    it('should return operation result on success', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => ({ data: 'test' }));

      const result = await withAsyncHandler(mockSet, 'load', mockOperation);

      expect(result).toEqual({ data: 'test' });
      expect(mockOperation).toHaveBeenCalledOnce();
    });

    it('should set error state when operation fails', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => {
        throw new Error('Operation failed');
      });

      await expect(withAsyncHandler(mockSet, 'load', mockOperation)).rejects.toThrow(
        'Operation failed'
      );

      // Second call should set error
      expect(mockSet).toHaveBeenCalledTimes(2);
      const secondCall = mockSet.mock.calls[1][0];
      const draft = { progress: { load: createAsyncSlice() } };
      secondCall(draft);
      expect(draft.progress.load).toEqual({ status: 'error', error: 'Operation failed' });
    });

    it('should re-throw error after setting error state', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const testError = new Error('Test error');
      const mockOperation = vi.fn(async () => {
        throw testError;
      });

      await expect(withAsyncHandler(mockSet, 'load', mockOperation)).rejects.toThrow(testError);
    });

    it('should handle non-Error objects as errors', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => {
        throw 'String error';
      });

      await expect(withAsyncHandler(mockSet, 'load', mockOperation)).rejects.toThrow();

      const secondCall = mockSet.mock.calls[1][0];
      const draft = { progress: { load: createAsyncSlice() } };
      secondCall(draft);
      expect(draft.progress.load.status).toBe('error');
      expect(draft.progress.load.error).toBe('String error');
    });

    it('should work with different progress keys', async () => {
      const mockState = { progress: { save: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => 'saved');

      await withAsyncHandler(mockSet, 'save', mockOperation);

      // Verify it used 'save' key
      const secondCall = mockSet.mock.calls[1][0];
      const draft = { progress: { save: createAsyncSlice() } };
      secondCall(draft);
      expect(draft.progress.save).toEqual({ status: 'success', error: null });
    });

    it('should call operation exactly once', async () => {
      const mockState = { progress: { load: createAsyncSlice() } };
      const mockSet = vi.fn((updater) => updater(mockState));
      const mockOperation = vi.fn(async () => 'result');

      await withAsyncHandler(mockSet, 'load', mockOperation);

      expect(mockOperation).toHaveBeenCalledOnce();
    });
  });
});
