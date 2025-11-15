import { StoreApi } from 'zustand';

// This is a simplified version. A more robust implementation could use generics
// to provide better type safety for the state and the async function arguments.
export const withAsyncState =
  <T extends { isLoading: boolean; error: string | null }, TArgs extends unknown[]>(
    set: StoreApi<T>['setState'],
    asyncFn: (...args: TArgs) => Promise<void>
  ) =>
  async (...args: TArgs) => {
    set({ isLoading: true, error: null } as Partial<T>);
    try {
      await asyncFn(...args);
      set({ isLoading: false } as Partial<T>);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false } as Partial<T>);
    }
  };
