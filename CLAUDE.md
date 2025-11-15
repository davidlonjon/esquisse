# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Esquisse is a minimalist, local-first journaling desktop application built with Electron, React 19, and TypeScript. All data is stored locally using SQLite (via sql.js WebAssembly).

## Essential Commands

### Development

```bash
npm start                 # Start Electron app in development mode with hot reload (Vite HMR)
npm run type-check        # Run TypeScript type checking without emitting files
```

### Testing

```bash
npm test                  # Run unit tests in watch mode with Vitest
npm run test:run          # Run unit tests once (useful for CI or pre-commit)
npm run test:ui           # Open Vitest UI for interactive test debugging
npm run test:coverage     # Run tests with coverage reporting (generates coverage report)
npm run test:e2e          # Run end-to-end tests with Playwright
```

### Code Quality

```bash
npm run lint              # Run ESLint on TypeScript files
npm run lint:fix          # Auto-fix ESLint errors where possible
npm run lint:strict       # Run ESLint with zero warnings allowed (fails on any warning, useful for CI/CD)
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting without modifying files
```

### Building & Distribution

```bash
npm run package           # Package app without creating installers
npm run make              # Create platform-specific distributables (DMG, EXE, etc.)
npm run publish           # Publish the app (requires configuration)
```

### Maintenance

```bash
npm run clean             # Remove all build artifacts and caches (.vite, out, dist, node_modules/.vite)
npm run rebuild           # Clean and reinstall dependencies from scratch (useful when dependencies act weird)
```

## Architecture

### Feature-First Structure

The codebase follows a **feature-first architecture** where code is organized by domain/feature rather than technical layer. This promotes scalability and maintainability.

**Key Principles:**

- Features are self-contained with components, hooks, stores, types, and styles
- Clear separation between main, preload, and renderer processes
- Modular IPC handlers organized by domain
- Path aliases for clean imports

### Multi-Process Structure

This is an Electron app with three distinct processes:

1. **Main Process** (`src/main/`)
   - Node.js environment with filesystem and Electron API access
   - **`core/window/`**: Window management (config, CSP, lifecycle, IPC)
   - **`modules/{domain}/`**: Domain-specific IPC handlers (journal, entry, settings)
   - **`database/`**: SQLite operations and schema
   - **`services/`**: Business logic layer (future)

2. **Preload Script** (`src/preload/`)
   - Bridges main ↔ renderer securely via contextBridge
   - **`api/`**: Modular API exports by domain (journal, entry, settings, window)

3. **Renderer Process** (`src/renderer/`)
   - React application in browser context
   - **`features/{domain}/`**: Feature-first organization (editor, journals, entries, settings)
   - **`components/`**: Shared components (ui, layout)
   - **`providers/`**: React context providers
   - **`pages/`**: Page components (for routing when added)

### IPC Communication Pattern

All communication follows a modular, type-safe pattern:

1. **Define types**: `src/shared/types/{domain}.types.ts`
2. **Define channels**: `src/shared/ipc/channels.ts`
3. **Update API interface**: `src/shared/ipc/api.types.ts`
4. **Implement main handler**: `src/main/modules/{domain}/{domain}.ipc.ts`
5. **Create preload API**: `src/preload/api/{domain}.api.ts`
6. **Use in renderer**: `window.api.*` with full TypeScript support

Example flow for adding a new IPC channel:

```typescript
// 1. src/shared/types/custom.types.ts
export interface CustomData {
  id: string;
  value: string;
}

// 2. src/shared/ipc/channels.ts
export const IPC_CHANNELS = {
  CUSTOM_ACTION: 'custom:action',
};

// 3. src/shared/ipc/api.types.ts
export interface ElectronAPI {
  customAction: (data: CustomData) => Promise<void>;
}

// 4. src/main/modules/custom/custom.ipc.ts
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';

export function registerCustomHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CUSTOM_ACTION, async (_event, data) => {
    // Implement logic
  });
}

// 5. src/preload/api/custom.api.ts
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';
import type { CustomData } from '@shared/types';

export const customAPI = {
  customAction: (data: CustomData): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CUSTOM_ACTION, data),
};

// 6. src/renderer/ - anywhere in React
await window.api.customAction({ id: '1', value: 'test' });
```

### Database Layer

- **sql.js**: SQLite compiled to WebAssembly - no native dependencies required
- **Location**: Database file stored in platform-specific user data directory via `app.getPath('userData')`
- **Persistence**: In-memory database is exported to file after each operation via `saveDatabase()`
- **Schema**: Defined in `src/main/database/schema.sql` and executed on initialization
- **CRUD Operations**: Organized by domain:
  - `src/main/database/journals.ts` - Journal operations
  - `src/main/database/entries.ts` - Entry operations
  - `src/main/database/settings.ts` - Settings key-value store

**Important**: The schema.sql file is copied to the build directory during the build process (see `vite.main.config.ts`). When modifying the schema, changes take effect on next app initialization.

### State Management

Zustand stores provide reactive state in the renderer process. Each store:

- Calls `window.api.*` methods to communicate with main process
- Manages local state, loading states, and errors
- Located in `src/renderer/features/{domain}/` alongside related code

Pattern:

```typescript
// src/renderer/features/journals/journals.store.ts
const useJournalStore = create<JournalState>((set) => ({
  journals: [],
  isLoading: false,
  loadJournals: async () => {
    set({ isLoading: true });
    const journals = await window.api.getAllJournals();
    set({ journals, isLoading: false });
  },
}));
```

### TypeScript Path Aliases

Comprehensive path aliases are configured for cleaner imports:

```typescript
// Renderer
import { Editor } from '@features/editor';
import { Button } from '@ui/button';
import { ErrorBoundary } from '@layout/ErrorBoundary';
import { useAutoSave } from '@hooks/useAutoSave';
import { ThemeProvider } from '@providers/theme-provider';

// Shared
import { Journal } from '@shared/types';
import { IPC_CHANNELS } from '@shared/ipc';

// Main process
import { createMainWindow } from '@main/core/window';

// Preload
import { journalAPI } from '@preload/api/journal.api';
```

### Routing & Settings

- Navigation is handled by TanStack Router (`src/renderer/router.tsx`) with two primary routes: `/` (EditorPage) and `/settings` (SettingsPage). Add routes by registering new page components in that file.
- The Settings page (`src/renderer/pages/SettingsPage.tsx`) reads/writes through `useSettingsStore` → IPC → SQLite, so changes persist across restarts and can later sync between devices.
- A `⌘,` shortcut (and HUD button) navigates to `/settings`. Use TanStack Router's `<Link>` or `router.navigate` when adding new navigation affordances.

### Localization

- i18next + react-i18next power renderer translations; initialization lives in `src/renderer/lib/i18n.ts`.
- Language detection checks `localStorage` then the browser/OS locale, with English as fallback.
- Translation bundles sit under `src/renderer/locales/{locale}/common.json`. Always update EN + FR versions when adding keys.
- Components should call `useTranslation()` instead of hard-coding strings. See `App.tsx` and `OverlayHUD.tsx` for patterns (interpolation, formatting, etc.).
- The keyboard shortcut modal (`KeyboardShortcutsPanel`) and HUD already consume translated labels; reuse those helpers when adding new HUD items or overlays.

**Available aliases:**

- `@features/*` → `./src/renderer/features/*`
- `@components/*` → `./src/renderer/components/*`
- `@ui/*` → `./src/renderer/components/ui/*`
- `@layout/*` → `./src/renderer/components/layout/*`
- `@hooks/*` → `./src/renderer/hooks/*`
- `@providers/*` → `./src/renderer/providers/*`
- `@pages/*` → `./src/renderer/pages/*`
- `@lib/*` → `./src/renderer/lib/*`
- `@shared/*` → `./src/shared/*`
- `@main/*` → `./src/main/*`
- `@preload/*` → `./src/preload/*`

Configured in `tsconfig.json`, `vite.*.config.ts`, and `vitest.config.ts`.

## Build System

### Electron Forge + Vite

- **forge.config.ts**: Defines build targets (main process, preload, renderer) and packager configuration
- **vite.main.config.ts**: Main process build (includes custom plugin to copy schema.sql)
- **vite.renderer.config.mjs**: Renderer process build with React
- **vite.preload.config.ts**: Preload script build

### sql.js WASM Loading

The database initialization code in `src/main/database/index.ts` handles WASM file location differently for dev vs production:

- **Development**: Loads from `node_modules/sql.js/dist/`
- **Production**: Loads from `process.resourcesPath/sql.js/`

When packaging for production, ensure the sql.js WASM file is included in the build.

## UI Components

### Shadcn/ui Integration

UI components use the shadcn/ui pattern:

- Components are in `src/renderer/components/ui/`
- Add new components: `npx shadcn@latest add <component-name>`
- Tailwind CSS v4 with `tailwind-animate` plugin
- Utility function `cn()` in `src/renderer/lib/utils.ts` for conditional class merging

### Styling

- Tailwind CSS v4 with PostCSS
- Global styles in `src/index.css`
- Component styles use Tailwind utility classes

## Testing Strategy

### Unit Tests (Vitest)

- Test files colocated with source: `*.test.ts` or `*.test.tsx`
- React Testing Library for component tests
- Setup file: `src/renderer/test/setup.ts`
- Run with: `npm test` (watch) or `npm run test:run` (once)

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Test the full Electron application
- Run with: `npm run test:e2e`

## Development Workflow

### Git Hooks

Husky + lint-staged runs on pre-commit:

- ESLint --fix on staged `.ts` and `.tsx` files
- Prettier on staged code, CSS, JSON, and markdown files

### Type Safety

- Strict TypeScript mode enabled
- Run `npm run type-check` before commits
- Pay special attention to IPC type definitions in `src/shared/ipc-types.ts`

## Critical Notes

1. **Foreign Keys**: Database has `PRAGMA foreign_keys = ON` - deleting a journal cascades to delete its entries
2. **Database Persistence**: sql.js is in-memory; `saveDatabase()` must be called after writes
3. **Search Limitations**: sql.js doesn't support FTS5 full-text search; uses LIKE queries instead
4. **Tags Storage**: Entry tags are stored as JSON strings in the database
5. **Window API Types**: `window.api` is globally typed via declaration merging in `src/shared/ipc-types.ts`
