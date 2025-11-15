import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';

import { EditorPage } from '@pages/EditorPage';
import { SettingsPage } from '@pages/SettingsPage';

function AppLayout() {
  return (
    <>
      <EditorPage />
      <Outlet />
    </>
  );
}

const RootRoute = createRootRoute({
  component: AppLayout,
});

const editorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => null,
});

const settingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = RootRoute.addChildren([editorRoute, settingsRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
