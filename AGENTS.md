# AGENTS.md

Architecture and development guide for AI agents working with the Esquisse codebase.

## Project Identity

**Esquisse** is a minimalist, local-first journaling desktop application built with Electron, React 19, and TypeScript. All data is stored locally using SQLite (via sql.js WebAssembly).

**Philosophy:**

- Minimalist, distraction-free writing experience
- Local-first: All data stays on the user's machine
- Privacy-focused: No cloud, no tracking, no internet required
- Clean, modern UI inspired by iA Writer

## Architecture Overview

### Feature-First Organization

The codebase uses **feature-first architecture** (also called domain-driven design) where code is organized by business domain rather than technical layer.

**Why Feature-First?**

- **Scalability**: Add new features without restructuring existing code
- **Maintainability**: All related code lives together
- **Team Collaboration**: Clear ownership boundaries
- **Code Discovery**: Easy to find feature-related code

**Structure:**

```
src/
├── main/              # Main process (Node.js)
│   ├── core/         # Core functionality (window management)
│   ├── modules/      # Domain IPC handlers (journal, entry, settings)
│   ├── database/     # Data layer (SQLite operations)
│   └── services/     # Business logic (future)
│
├── preload/          # Preload bridge (security boundary)
│   └── api/          # Modular API by domain
│
├── renderer/         # Renderer process (React)
│   ├── features/     # Feature modules (editor, journals, entries, settings)
│   ├── components/   # Shared components (ui, layout)
│   ├── providers/    # React context providers
│   └── pages/        # Page components (routing - future)
│
└── shared/           # Cross-process code
    ├── types/        # Domain type definitions
    └── ipc/          # IPC channel definitions
```

### Multi-Process Architecture

Electron runs three separate processes:

#### 1. Main Process (`src/main/`)

- **Environment**: Node.js with full filesystem and Electron API access
- **Responsibilities**: Window management, IPC handling, database operations
- **Key Modules**:
  - `core/window/`: Window lifecycle, configuration, CSP
  - `modules/{domain}/`: Domain-specific IPC handlers
  - `database/`: SQLite operations and schema management

**Main Process Files:**

- `index.ts`: Entry point, orchestrates all modules (54 lines)
- `core/window/window-manager.ts`: Window creation and lifecycle
- `core/window/window-config.ts`: Window configuration
- `core/window/csp.ts`: Content Security Policy
- `modules/journal/journal.ipc.ts`: Journal IPC handlers
- `modules/entry/entry.ipc.ts`: Entry IPC handlers
- `modules/settings/settings.ipc.ts`: Settings IPC handlers

#### 2. Preload Script (`src/preload/`)

- **Environment**: Special context with access to both Node.js and browser APIs
- **Responsibilities**: Securely bridge main ↔ renderer via `contextBridge`
- **Security**: Only exposes explicitly defined APIs to renderer

**Preload Files:**

- `index.ts`: Entry point, exposes `window.api` (11 lines)
- `api/journal.api.ts`: Journal API methods
- `api/entry.api.ts`: Entry API methods
- `api/settings.api.ts`: Settings API methods
- `api/window.api.ts`: Window control API methods
- `api/index.ts`: Aggregates all API modules

#### 3. Renderer Process (`src/renderer/`)

- **Environment**: Browser context (Chromium), no direct Node.js access
- **Responsibilities**: React UI, user interactions, state management
- **Security**: Can only access main process via `window.api.*`

**Renderer Structure:**

```
features/
├── editor/                # Rich text editor feature
│   ├── Editor.tsx        # Main editor component
│   ├── constants.ts      # Editor configuration
│   ├── types.ts          # Editor types
│   ├── extensions/       # Tiptap extensions (FocusMode, TypewriterScroll)
│   └── styles/           # Modular CSS (base, typography, code, media, focus-mode)
│
├── journals/              # Journal management feature
│   ├── journals.store.ts # Zustand store
│   └── components/       # Journal-specific components (future)
│
├── entries/               # Entry management feature
│   ├── entries.store.ts  # Zustand store
│   └── components/       # Entry-specific components (future)
│
└── settings/              # Settings feature
    ├── settings.store.ts # Zustand store
    └── components/       # Settings UI (future)
```

## Type-Safe IPC Communication

### Communication Flow

```
Renderer → Preload → Main → Database
   ↓         ↓        ↓        ↓
window.api → API → Handler → CRUD
```

### Adding a New IPC Channel

**Step-by-step process:**

1. **Define Domain Types** (`src/shared/types/`)

```typescript
// src/shared/types/tags.types.ts
export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTagInput = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTagInput = Partial<Tag>;
```

2. **Define IPC Channels** (`src/shared/ipc/channels.ts`)

```typescript
export const IPC_CHANNELS = {
  // Existing channels...
  TAG_CREATE: 'tag:create',
  TAG_GET_ALL: 'tag:getAll',
  TAG_DELETE: 'tag:delete',
} as const;
```

3. **Update API Interface** (`src/shared/ipc/api.types.ts`)

```typescript
export interface ElectronAPI {
  // Existing methods...
  createTag: (tag: CreateTagInput) => Promise<Tag>;
  getAllTags: () => Promise<Tag[]>;
  deleteTag: (id: string) => Promise<boolean>;
}
```

4. **Implement Main Handler** (`src/main/modules/tags/tags.ipc.ts`)

```typescript
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';
import * as tagDb from '../../database/tags';

export function registerTagHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.TAG_CREATE, async (_event, tag) => {
    return tagDb.createTag(tag);
  });

  ipcMain.handle(IPC_CHANNELS.TAG_GET_ALL, async () => {
    return tagDb.getAllTags();
  });

  ipcMain.handle(IPC_CHANNELS.TAG_DELETE, async (_event, id) => {
    return tagDb.deleteTag(id);
  });
}
```

5. **Create Preload API** (`src/preload/api/tags.api.ts`)

```typescript
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';
import type { Tag, CreateTagInput } from '@shared/types';

export const tagsAPI = {
  createTag: (tag: CreateTagInput): Promise<Tag> =>
    ipcRenderer.invoke(IPC_CHANNELS.TAG_CREATE, tag),

  getAllTags: (): Promise<Tag[]> => ipcRenderer.invoke(IPC_CHANNELS.TAG_GET_ALL),

  deleteTag: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.TAG_DELETE, id),
};
```

6. **Register in Main** (`src/main/index.ts`)

```typescript
import { registerTagHandlers } from './modules/tags';

function registerIPCHandlers(): void {
  registerWindowHandlers();
  registerJournalHandlers();
  registerEntryHandlers();
  registerSettingsHandlers();
  registerTagHandlers(); // Add this
}
```

7. **Aggregate in Preload** (`src/preload/api/index.ts`)

```typescript
import { tagsAPI } from './tags.api';

export const electronAPI: ElectronAPI = {
  ...journalAPI,
  ...entryAPI,
  ...settingsAPI,
  ...windowAPI,
  ...tagsAPI, // Add this
};
```

8. **Use in Renderer**

```typescript
// Anywhere in React components
const tags = await window.api.getAllTags();
const newTag = await window.api.createTag({ name: 'Important' });
```

## Path Aliases

The project uses comprehensive path aliases to avoid relative import hell:

```typescript
// ❌ Avoid
import { Editor } from '../../../features/editor/Editor';
import { Button } from '../../../../components/ui/button';

// ✅ Prefer
import { Editor } from '@features/editor';
import { Button } from '@ui/button';
```

**Available Aliases:**

| Alias           | Path                                 | Usage             |
| --------------- | ------------------------------------ | ----------------- |
| `@features/*`   | `./src/renderer/features/*`          | Feature modules   |
| `@components/*` | `./src/renderer/components/*`        | Shared components |
| `@ui/*`         | `./src/renderer/components/ui/*`     | UI components     |
| `@layout/*`     | `./src/renderer/components/layout/*` | Layout components |
| `@hooks/*`      | `./src/renderer/hooks/*`             | Shared hooks      |
| `@providers/*`  | `./src/renderer/providers/*`         | Context providers |
| `@pages/*`      | `./src/renderer/pages/*`             | Page components   |
| `@lib/*`        | `./src/renderer/lib/*`               | Utilities         |
| `@shared/*`     | `./src/shared/*`                     | Shared types/IPC  |
| `@main/*`       | `./src/main/*`                       | Main process      |
| `@preload/*`    | `./src/preload/*`                    | Preload scripts   |

**Configuration:**

- `tsconfig.json`: TypeScript resolution
- `vite.main.config.ts`: Main process build
- `vite.preload.config.ts`: Preload build
- `vite.renderer.config.mjs`: Renderer build
- `vitest.config.ts`: Test environment

## Localization

- Renderer strings are powered by i18next/`react-i18next` (`src/renderer/lib/i18n.ts`). The instance auto-detects language from `localStorage` then the OS/browser locale, defaulting to English.
- Translation bundles live under `src/renderer/locales/{locale}/common.json`. Every new key must at least exist in `en` and `fr`.
- `src/renderer/index.tsx` wraps the app with `I18nextProvider`, so components call `useTranslation()` for text. Do **not** hardcode strings directly.
- HUD overlays, shortcut panels, and `App.tsx` already use translation keys—follow those patterns (including interpolation with `t('hud.snapshotSaved', { time })`).
- To add a locale: create a new folder under `locales`, update the `resources` and `supportedLngs` arrays in `lib/i18n.ts`, and optionally expose a UI toggle that calls `i18n.changeLanguage('<locale>')`.

## Routing & Settings

- TanStack Router (`src/renderer/router.tsx`) owns navigation. The root route renders an `<Outlet />`; children currently include `/` (EditorPage) and `/settings` (SettingsPage). Register new pages by adding routes to this file.
- Editor-specific logic now lives inside `src/renderer/pages/EditorPage.tsx` and the settings UI inside `src/renderer/pages/SettingsPage.tsx`. Both pages share providers applied in `src/renderer/index.tsx`.
- A HUD button and the `⌘,` shortcut navigate to `/settings`. Use `<Link>` or `router.navigate({ to: '/settings' })` for new shortcuts or buttons.
- Settings changes persist through `window.api.setSettings` → SQLite. When adding a new preference, update `src/shared/types/settings.types.ts`, the default record in `src/main/database/settings.ts`, the Zustand store, and translation strings for labels/help text.

## State Management

### Zustand Stores

Each feature has its own Zustand store located within the feature folder:

**Pattern:**

```typescript
// src/renderer/features/journals/journals.store.ts
import { create } from 'zustand';
import type { Journal } from '@shared/types';

interface JournalState {
  // State
  journals: Journal[];
  currentJournal: Journal | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadJournals: () => Promise<void>;
  createJournal: (data: Partial<Journal>) => Promise<Journal>;
  setCurrentJournal: (journal: Journal | null) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial state
  journals: [],
  currentJournal: null,
  isLoading: false,
  error: null,

  // Actions
  loadJournals: async () => {
    set({ isLoading: true, error: null });
    try {
      const journals = await window.api.getAllJournals();
      set({ journals, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createJournal: async (data) => {
    const journal = await window.api.createJournal(data);
    set({ journals: [...get().journals, journal] });
    return journal;
  },

  setCurrentJournal: (journal) => set({ currentJournal: journal }),
}));
```

**Best Practices:**

- Keep stores close to features
- Include loading and error states
- Use async/await for IPC calls
- Handle errors gracefully
- Export typed hook for consumers

## Database Layer

### Schema

SQLite database with three main tables:

**journals:**

```sql
CREATE TABLE journals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**entries:**

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE
);
```

**settings:**

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### CRUD Operations

Each domain has a dedicated database file:

- `src/main/database/journals.ts`: Journal CRUD
- `src/main/database/entries.ts`: Entry CRUD
- `src/main/database/settings.ts`: Settings CRUD

**Pattern:**

```typescript
// src/main/database/tags.ts
import { db } from './index';

export function createTag(tag: CreateTagInput): Tag {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.run('INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    tag.name,
    tag.color || null,
    now,
    now,
  ]);

  return { id, ...tag, createdAt: now, updatedAt: now };
}

export function getAllTags(): Tag[] {
  return db.exec('SELECT * FROM tags ORDER BY created_at DESC')[0]?.values || [];
}

export function deleteTag(id: string): boolean {
  db.run('DELETE FROM tags WHERE id = ?', [id]);
  return true;
}
```

**Important:**

- sql.js is in-memory; call `saveDatabase()` after writes
- Use prepared statements to prevent SQL injection
- Foreign keys are enabled (`PRAGMA foreign_keys = ON`)
- Deleting a journal cascades to entries

## Adding a New Feature

Complete checklist for adding a feature (example: "tags"):

### 1. Types Layer

```bash
# Create domain types
touch src/shared/types/tags.types.ts
```

### 2. Database Layer

```bash
# Create database operations
touch src/main/database/tags.ts

# Update schema.sql
# Add CREATE TABLE tags (...)
```

### 3. IPC Layer

```bash
# Create main handler
mkdir -p src/main/modules/tags
touch src/main/modules/tags/tags.ipc.ts
touch src/main/modules/tags/index.ts

# Create preload API
touch src/preload/api/tags.api.ts
```

### 4. Renderer Layer

```bash
# Create feature folder
mkdir -p src/renderer/features/tags/{components,hooks}
touch src/renderer/features/tags/tags.store.ts
touch src/renderer/features/tags/index.ts
```

### 5. Wire Everything Together

1. Update `src/shared/ipc/channels.ts`
2. Update `src/shared/ipc/api.types.ts`
3. Register handler in `src/main/index.ts`
4. Aggregate API in `src/preload/api/index.ts`
5. Export from `src/shared/types/index.ts`

### 6. Use in UI

```typescript
import { useTagsStore } from '@features/tags';

function TagsList() {
  const { tags, loadTags } = useTagsStore();

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <div>
      {tags.map(tag => (
        <span key={tag.id}>{tag.name}</span>
      ))}
    </div>
  );
}
```

## Code Quality

### Pre-commit Checks

Husky + lint-staged runs on every commit:

```bash
# Runs automatically on git commit
- ESLint --fix
- ESLint --max-warnings 0 (strict mode)
- Prettier --write
- npm run type-check
- Stylelint --fix (for CSS)
```

### Manual Quality Checks

```bash
# Format code
npm run format

# Lint and auto-fix
npm run lint:fix

# Type checking
npm run type-check

# Full validation pipeline
npm run validate

# Run tests
npm test
```

### Style Guidelines

**TypeScript:**

- Use explicit types for function parameters and returns
- Prefer interfaces over types for object shapes
- Use const assertions for literal types
- Avoid `any` - use `unknown` if truly dynamic

**React:**

- Functional components with hooks
- Extract complex logic to custom hooks
- Colocate feature code (components, hooks, stores)
- Use barrel exports (`index.ts`) for clean imports

**Naming Conventions:**

- Files: `kebab-case.ts` or `PascalCase.tsx` (components)
- Components: `PascalCase`
- Hooks: `use` prefix
- Stores: `use{Feature}Store`
- Types: `PascalCase` or `PascalCase{Type}` (e.g., `CreateJournalInput`)
- Constants: `SCREAMING_SNAKE_CASE` or `UPPER_CAMEL_CASE`

## Common Patterns

### Custom Hooks

```typescript
// src/renderer/hooks/useKeyboardShortcut.ts
export function useKeyboardShortcut(key: string, callback: () => void, deps: DependencyList = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, ...deps]);
}
```

### Error Boundaries

```typescript
// Already implemented: src/renderer/components/layout/ErrorBoundary.tsx
import { ErrorBoundary } from '@layout/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Theme Provider

```typescript
// Already implemented: src/renderer/providers/theme-provider.tsx
import { ThemeProvider, useTheme } from '@providers/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
      <YourApp />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle</button>;
}
```

## Future Additions

### Routing (When Ready)

The `src/renderer/pages/` directory is ready for React Router:

```typescript
// src/renderer/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EditorPage } from '@pages/EditorPage';
import { JournalsPage } from '@pages/JournalsPage';
import { SettingsPage } from '@pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/journals" element={<JournalsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Service Layer

The `src/main/services/` directory is ready for business logic:

```typescript
// src/main/services/journal.service.ts
import * as journalDb from '../database/journals';

export class JournalService {
  async createWithDefaults(data: Partial<Journal>): Promise<Journal> {
    // Business logic here
    const journal = await journalDb.createJournal({
      name: data.name || 'Untitled Journal',
      color: data.color || '#3B82F6',
      description: data.description,
    });

    // Create default entry
    // Send analytics
    // etc.

    return journal;
  }
}
```

## Critical Notes

1. **Security**: Never expose Node.js APIs directly to renderer. Always use preload bridge.
2. **Database**: sql.js is in-memory. Always call `saveDatabase()` after writes.
3. **Foreign Keys**: Enabled. Deleting a journal cascades to delete entries.
4. **Search**: FTS5 not available in sql.js. Use LIKE queries for search.
5. **Tags**: Stored as JSON strings in database (not ideal for querying, but simple).
6. **CSP**: Different policies for dev (allows HMR) vs production (strict).
7. **Path Aliases**: Must be configured in ALL configs (tsconfig, vite×3, vitest).

## Resources

- **Electron Docs**: https://www.electronjs.org/docs/latest/
- **React Docs**: https://react.dev/
- **Zustand Docs**: https://docs.pmnd.rs/zustand/
- **Tiptap Docs**: https://tiptap.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Shadcn/ui**: https://ui.shadcn.com/
- **sql.js**: https://sql.js.org/

---

**Last Updated**: November 2024
**Architecture Version**: Feature-First v1.0
