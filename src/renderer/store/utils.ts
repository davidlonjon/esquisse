export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncSlice {
  status: RequestStatus;
  error: string | null;
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createAsyncSlice = (): AsyncSlice => ({ status: 'idle', error: null });

export const toAsyncSlice = (status: RequestStatus, error: string | null = null): AsyncSlice => ({
  status,
  error,
});
