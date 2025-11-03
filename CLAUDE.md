# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Esquisse is a minimalist, local-first journaling desktop application built with Electron, React 19, and TypeScript. All data is stored locally using SQLite (via sql.js WebAssembly).

## Essential Commands

### Development

```bash
npm start                 # Start Electron app in development mode with hot reload
npm run type-check        # Run TypeScript type checking without emitting files
```

### Testing

```bash
npm test                  # Run unit tests in watch mode with Vitest
npm run test:run          # Run unit tests once (useful for CI or pre-commit)
npm run test:ui           # Open Vitest UI for interactive test debugging
npm run test:e2e          # Run end-to-end tests with Playwright
```

### Code Quality

```bash
npm run lint              # Run ESLint on TypeScript files
npm run lint:fix          # Auto-fix ESLint errors
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting without modifying files
```

### Building & Distribution

```bash
npm run package           # Package app without creating installers
npm run make              # Create platform-specific distributables (DMG, EXE, etc.)
```

## Architecture

### Multi-Process Structure

This is an Electron app with three distinct processes:

1. **Main Process** (`src/main/`) - Node.js environment, has access to Electron APIs and filesystem
2. **Preload Script** (`src/preload/`) - Runs before renderer, bridges main and renderer via contextBridge
3. **Renderer Process** (`src/renderer/`) - Browser environment running React app

### IPC Communication Pattern

All communication between main and renderer processes follows a strict type-safe pattern:

1. **Define types first**: Add channel names to `IPC_CHANNELS` and method signatures to `ElectronAPI` in `src/shared/ipc-types.ts`
2. **Implement main handler**: Add `ipcMain.handle()` in `src/main/index.ts` that calls database functions
3. **Expose in preload**: Add method to `electronAPI` object in `src/preload/index.ts` that calls `ipcRenderer.invoke()`
4. **Use in renderer**: Access via `window.api.*` with full TypeScript support

Example flow for a new IPC channel:

```typescript
// 1. src/shared/ipc-types.ts
export const IPC_CHANNELS = {
  CUSTOM_ACTION: 'custom:action',
};
export interface ElectronAPI {
  customAction: (data: string) => Promise<void>;
}

// 2. src/main/index.ts
ipcMain.handle(IPC_CHANNELS.CUSTOM_ACTION, async (_, data) => {
  // Implement logic
});

// 3. src/preload/index.ts
const electronAPI: ElectronAPI = {
  customAction: (data) => ipcRenderer.invoke(IPC_CHANNELS.CUSTOM_ACTION, data),
};

// 4. src/renderer/ - anywhere in React
await window.api.customAction('data');
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
- Located in `src/renderer/store/`

Pattern:

```typescript
// Stores handle both local state and IPC communication
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

Two aliases are configured for cleaner imports:

- `@/*` → `./src/renderer/*` (renderer code only)
- `@shared/*` → `./src/shared/*` (code shared between main and renderer)

Configured in both `tsconfig.json` and `vitest.config.ts`.

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
