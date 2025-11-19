import { Outlet } from '@tanstack/react-router';
import { Suspense } from 'react';

import { IpcErrorBoundary } from '@components/layout';

import { SettingsSkeleton } from './skeletons/SettingsSkeleton';

/**
 * Layout for settings-related routes
 * Provides settings-specific error boundary and loading states
 */
export function SettingsLayout() {
  return (
    <IpcErrorBoundary>
      <Suspense fallback={<SettingsSkeleton />}>
        <Outlet />
      </Suspense>
    </IpcErrorBoundary>
  );
}
