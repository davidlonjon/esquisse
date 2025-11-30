import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';

import { RootLayout } from '@/layouts';
import { EditorPage } from '@pages/EditorPage';

interface AppRouterContext {
  searchOpen?: () => void;
}

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

const routeTree = RootRoute.addChildren([editorRoute, settingsRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {} as AppRouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    context?: AppRouterContext;
  }
}

export function AppRouterProvider({ searchOpen }: { searchOpen?: () => void }) {
  return <RouterProvider router={router} context={{ searchOpen }} />;
}
