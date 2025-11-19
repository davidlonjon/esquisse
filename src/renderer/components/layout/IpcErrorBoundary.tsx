import React, { Component, ErrorInfo, ReactNode } from 'react';

import { IpcError } from '@services/utils';

interface Props {
  children: ReactNode;
  fallback?: (error: IpcError, retry: () => void) => ReactNode;
  onError?: (error: IpcError, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  error: IpcError | null;
  retryCount: number;
}

/**
 * Error boundary specifically for IPC errors
 * Only catches IpcError instances and provides retry functionality
 */
export class IpcErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Only catch IpcError instances
    if (error instanceof IpcError) {
      return { error };
    }
    // Rethrow non-IPC errors to be caught by parent error boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only handle IpcError instances
    if (error instanceof IpcError) {
      console.error('[IpcErrorBoundary] Caught IPC error:', {
        message: error.message,
        code: error.code,
        channel: error.channel,
        isRetryable: error.isRetryable,
        details: error.details,
        componentStack: errorInfo.componentStack,
      });

      // Call optional error handler
      this.props.onError?.(error, errorInfo);

      // Auto-retry for retryable errors
      if (error.isRetryable && this.canRetry()) {
        this.scheduleRetry();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  canRetry = (): boolean => {
    const maxRetries = this.props.maxRetries ?? 3;
    return this.state.retryCount < maxRetries;
  };

  /**
   * Calculate exponential backoff delay
   * Returns delay in milliseconds: 1s, 2s, 4s, etc.
   */
  getRetryDelay = (): number => {
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(2, this.state.retryCount);
  };

  scheduleRetry = () => {
    const delay = this.getRetryDelay();
    console.log(
      `[IpcErrorBoundary] Scheduling retry in ${delay}ms (attempt ${this.state.retryCount + 1})`
    );

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    console.log('[IpcErrorBoundary] Retrying...');
    this.setState((prevState) => ({
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.handleRetry();
  };

  render() {
    const { error } = this.state;

    if (error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(error, this.handleManualRetry);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[200px] items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-warning bg-warning/10 p-6">
            <h3 className="mb-2 text-lg font-semibold text-warning">Connection Error</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {error.message || 'An error occurred while communicating with the application.'}
            </p>

            {error.isRetryable && (
              <div className="mb-4 text-xs text-muted-foreground">
                {this.canRetry()
                  ? `Retrying automatically... (Attempt ${this.state.retryCount + 1}/${this.props.maxRetries ?? 3})`
                  : 'Maximum retry attempts reached.'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleManualRetry}
                className="btn btn-sm btn-primary"
                disabled={!error.isRetryable && !this.canRetry()}
              >
                Retry Now
              </button>
            </div>

            {(error.code || error.channel) && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    {
                      code: error.code,
                      channel: error.channel,
                      isRetryable: error.isRetryable,
                      details: error.details,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
