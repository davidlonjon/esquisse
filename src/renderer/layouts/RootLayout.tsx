import { Outlet } from '@tanstack/react-router';
import { Suspense } from 'react';

import { ErrorBoundary } from '@components/layout';

/**
 * Root layout that wraps all routes
 * Provides top-level error boundary and suspense
 */
export function RootLayout() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen w-screen bg-base-100" />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}
