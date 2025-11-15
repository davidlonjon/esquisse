# Architecture Guide

This document expands on Esquisse's architecture, IPC strategy, and data model. See `docs/development.md` for workflow guidance.

## Process Layers

| Layer    | Location       | Responsibilities                                                                              |
| -------- | -------------- | --------------------------------------------------------------------------------------------- |
| Main     | `src/main`     | Window lifecycle, IPC registration, SQLite access, CSP and app initialization.                |
| Preload  | `src/preload`  | Secure bridge that exposes a curated `window.api` surface via `contextBridge`. No DOM access. |
| Renderer | `src/renderer` | React UI, feature modules, Zustand stores, localization, keyboard shortcuts.                  |
| Shared   | `src/shared`   | Types, IPC channel constants, and API interfaces consumed by every process.                   |

### Principles

- Keep the main process lean—heavy work belongs in the renderer or dedicated workers.
- Every IPC handler must validate inputs, catch errors, and return serializable data.
- Only expose capabilities through preload; never access Node APIs directly in the renderer.

## Feature-First Organization

```
src/
├── main/            # Node/Electron entry
├── preload/         # contextBridge
├── renderer/
│   ├── features/    # Editor, journals, entries, settings
│   ├── components/  # Shared UI + layout
│   ├── hooks/       # Cross-feature logic
│   ├── pages/       # Routed pages
│   └── providers/   # Context providers
└── shared/
    ├── types/
    └── ipc/
```

Benefits:

- Clear ownership per domain
- Easier code discovery
- Enables scaling without flattening the entire renderer directory

## Renderer Service Layer

- Location: `src/renderer/services`
- Each domain service (`journalService`, `entryService`, `settingsService`) centralizes the corresponding `window.api` calls so IPC details stay outside of stores/components.
- Renderer state and hooks must consume these services instead of calling `window.api` directly to keep the IPC surface consistent and testable.

## IPC Pipeline

1. **Types** – define payloads/result interfaces under `src/shared/types` and re-export them.
2. **Channels** – add constants to `src/shared/ipc/channels.ts` and signatures to `src/shared/ipc/api.types.ts`.
3. **Main handlers** – implement the IPC logic in `src/main/modules/<domain>/<domain>.ipc.ts` using try/catch and database helpers.
4. **Preload API** – wrap handlers through `ipcRenderer.invoke` inside `src/preload/api/<domain>.api.ts`, then merge them in `src/preload/api/index.ts`.
5. **Renderer usage** – call `window.api.<method>()` from hooks/stores/components; keep business logic outside JSX where possible.

## Data Persistence

- SQLite is loaded through sql.js (WASM). The database lives in memory and is persisted after each mutation via `saveDatabase()`.
- The base schema lives in `src/main/database/schema.sql` and is copied during the main build. Schema changes take effect on the next launch.
- Data modules (`journals.ts`, `entries.ts`, `settings.ts`) encapsulate CRUD operations and timestamping; prefer parameterized statements.
- Foreign keys are enabled (`PRAGMA foreign_keys = ON`), so deleting a journal cascades to entries.

### Tables

| Table      | Purpose                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| `journals` | Container records (`id`, `name`, `description`, `color`, timestamps).              |
| `entries`  | Journal entries with optional title, body, tags (JSON), timestamps, FK → journals. |
| `settings` | Key/value store for preferences (theme, language, autosave).                       |

## State Management & Hooks

- Zustand stores live beside their feature (`features/<domain>/<domain>.store.ts`). Stores expose loading/error flags and call IPC methods internally.
- Shared hooks (e.g., `useGlobalHotkeys`, `useHud`) live under `src/renderer/hooks` and encapsulate cross-feature behavior.
- Whenever a hook grows beyond 50 lines, consider splitting logic (e.g., derive data, network layer, view bindings).

## UI & Interaction

- Tailwind CSS + DaisyUI provide primitives; repeated utility stacks should become components under `components/ui` or `components/layout`.
- Hotkeys are centralized through `useGlobalHotkeys` + the hotkeys provider so global shortcuts pause while modals are open.
- Overlay HUD, settings modal, and keyboard panel rely on semantic HTML + ARIA attributes. Follow the same patterns for new overlays.

## Localization

- i18next is initialized in `src/renderer/lib/i18n.ts` with English + French bundles stored under `src/renderer/locales/{locale}/common.json`.
- Always update both locale files when adding keys, and call `useTranslation()` rather than hard-coding strings.

## Path Aliases

Configured in `tsconfig.json`, Vite configs, and Vitest config:

```
@features, @components, @ui, @layout, @hooks,
@providers, @pages, @lib, @shared, @main, @preload
```

Use aliases to avoid brittle relative imports.

## Adding a New Feature

1. Define shared types + IPC channels.
2. Implement database helpers and main-process handlers.
3. Expose preload API + update `window.api` types.
4. Create feature folder with store, hooks, and components.
5. Update documentation (README + `docs/`) and translation files.
