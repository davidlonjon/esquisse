import { Outlet } from '@tanstack/react-router';
import { Suspense } from 'react';

import { IpcErrorBoundary } from '@components/layout';

import { EditorSkeleton } from './skeletons/EditorSkeleton';

/**
 * Layout for editor-related routes
 * Provides editor-specific error boundary and loading states
 */
export function EditorLayout() {
  return (
    <IpcErrorBoundary>
      <Suspense fallback={<EditorSkeleton />}>
        <Outlet />
      </Suspense>
    </IpcErrorBoundary>
  );
}
