import { RouterProvider, createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';

import { EditorPage } from '@pages/EditorPage';
import { SettingsPage } from '@pages/SettingsPage';

const RootRoute = createRootRoute({
  component: () => <Outlet />,
});

const editorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: EditorPage,
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
