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
