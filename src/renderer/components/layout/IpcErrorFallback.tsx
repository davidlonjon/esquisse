import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import React from 'react';

import type { IpcError } from '@services/utils';

interface IpcErrorFallbackProps {
  error: IpcError;
  retry: () => void;
  variant?: 'inline' | 'fullscreen';
}

/**
 * Polished error fallback UI for IPC errors
 * Displays different UIs for retryable vs fatal errors
 */
export function IpcErrorFallback({ error, retry, variant = 'inline' }: IpcErrorFallbackProps) {
  const isRetryable = error.isRetryable;
  const containerClasses =
    variant === 'fullscreen'
      ? 'flex h-screen w-screen items-center justify-center p-8'
      : 'flex min-h-[300px] items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="max-w-md rounded-lg border border-warning bg-base-100 p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-warning" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-base-content">
              {isRetryable ? 'Temporary Connection Issue' : 'Operation Failed'}
            </h3>
            <p className="mt-1 text-sm text-base-content/70">
              {error.message || 'An error occurred while communicating with the application.'}
            </p>
          </div>
        </div>

        {/* Error context */}
        {error.channel ? (
          <div className="mb-4 rounded bg-base-200 px-3 py-2 text-xs text-base-content/60">
            <span className="font-medium">Channel:</span> {error.channel}
            {error.code ? (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">Code:</span> {error.code}
              </>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isRetryable ? (
            <>
              <button
                onClick={retry}
                className="btn btn-primary btn-sm gap-2"
                aria-label="Retry operation"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
              <p className="text-xs text-base-content/60">
                This is likely a temporary issue. Please try again.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={retry}
                className="btn btn-outline btn-sm gap-2"
                aria-label="Try again"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-ghost btn-sm"
                aria-label="Reload application"
              >
                Reload App
              </button>
              <p className="text-xs text-base-content/60">
                If the problem persists, try reloading the application.
              </p>
            </>
          )}
        </div>

        {/* Technical details (collapsible) */}
        {error.details ? (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer font-medium text-base-content/60 hover:text-base-content">
              Technical details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-base-200 p-2 text-xs">
              {typeof error.details === 'string'
                ? error.details
                : JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
