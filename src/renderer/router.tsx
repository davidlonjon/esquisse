import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';

import { RootLayout } from '@/layouts';

/**
 * Root route with error boundary and suspense
 */
const RootRoute = createRootRoute({
  component: RootLayout,
});

/**
 * Editor route - lazy loaded for code splitting
 */
const editorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: lazyRouteComponent(() =>
    import('@pages/EditorPage').then((m) => ({ default: m.EditorPage }))
  ),
});

/**
 * Settings route - lazy loaded for code splitting
 */
const settingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/settings',
  component: lazyRouteComponent(() =>
    import('@pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
  ),
});

const routeTree = RootRoute.addChildren([editorRoute, settingsRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
