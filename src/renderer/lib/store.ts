import { getErrorMessage } from './utils';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncSlice {
  status: RequestStatus;
  error: string | null;
}

export { getErrorMessage };

export const createAsyncSlice = (): AsyncSlice => ({ status: 'idle', error: null });

export const toAsyncSlice = (status: RequestStatus, error: string | null = null): AsyncSlice => ({
  status,
  error,
});

/**
 * Wraps an async operation with automatic loading/error state management.
 * Eliminates boilerplate try/catch/loading/error handling code.
 *
 * @template T - The return type of the async operation
 * @param setState - Zustand set function (works with immer middleware)
 * @param progressKey - Which progress field to update ('load', 'save', 'remove', 'search')
 * @param operation - The async operation to execute
 * @returns Promise resolving to the operation result
 * @throws Re-throws any error from the operation after setting error state
 *
 * @example
 * ```typescript
 * loadJournals: async () => {
 *   return withAsyncHandler(set, 'load', async () => {
 *     const journals = await journalService.list();
 *     set((state) => { state.journals = journals });
 *     return journals;
 *   });
 * }
 * ```
 */
export async function withAsyncHandler<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: (updater: (draft: any) => void) => void,
  progressKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Set loading state
  setState((draft) => {
    draft.progress[progressKey] = toAsyncSlice('loading');
  });

  try {
    // Execute the operation
    const result = await operation();

    // Set success state
    setState((draft) => {
      draft.progress[progressKey] = toAsyncSlice('success');
    });

    return result;
  } catch (error) {
    // Extract error message and set error state
    const message = getErrorMessage(error);
    setState((draft) => {
      draft.progress[progressKey] = toAsyncSlice('error', message);
    });

    // Re-throw so caller can handle if needed
    throw error;
  }
}
