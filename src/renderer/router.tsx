import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';

import { RootLayout } from '@/layouts';
import { EditorPage } from '@pages/EditorPage';
import { TimelinePage } from '@pages/TimelinePage';

/**
 * Root route with error boundary and suspense
 */
const RootRoute = createRootRoute({
  component: RootLayout,
});

/**
 * Editor route - Eagerly loaded as it's the main view
 */
const editorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: EditorPage,
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

/**
 * Timeline route - Eagerly loaded for instant switching
 */
const timelineRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/timeline',
  component: TimelinePage,
});

const routeTree = RootRoute.addChildren([editorRoute, settingsRoute, timelineRoute]);

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
