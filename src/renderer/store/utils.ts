import type { StoreApi } from 'zustand';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RequestState {
  status: RequestStatus;
  error: string | null;
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type SetState<TState> = StoreApi<TState>['setState'];

export async function withRequestStatus<TState extends RequestState, TResult>(
  set: SetState<TState>,
  action: () => Promise<TResult>
): Promise<TResult> {
  set({ status: 'loading', error: null } as Partial<TState>);
  try {
    const result = await action();
    set({ status: 'success' } as Partial<TState>);
    return result;
  } catch (error) {
    set({ status: 'error', error: getErrorMessage(error) } as Partial<TState>);
    throw error;
  }
}
