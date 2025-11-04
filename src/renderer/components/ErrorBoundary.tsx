import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Something went wrong</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The application encountered an unexpected error. Please restart the app.
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
