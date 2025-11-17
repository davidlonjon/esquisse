# Esquisse AI Engineering Guide

> Single source of truth for any LLM (Claude, GPT, etc.) that edits this repository. **CLAUDE.md** and **AGENTS.md** must stay identical.

## 1. Product Snapshot

- **Mission**: Minimalist, privacy-first journaling desktop app.
- **Stack**: Electron + Vite, React 19, TypeScript, Zustand, TanStack Router, Tiptap, Tailwind/DaisyUI, sql.js (SQLite WASM), Playwright, Vitest.
- **Process layout**: `src/main` (Node/Electron), `src/preload` (secure bridge), `src/renderer` (React UI), `src/shared` (types + IPC contracts).
- **Feature-first directories** keep each domain self-contained: components, hooks, stores, translations, tests.

## 2. Essential Commands

| Purpose         | Command                                                        |
| --------------- | -------------------------------------------------------------- |
| Dev app         | `npm start`                                                    |
| Type safety     | `npm run type-check` (tsc --noEmit)                            |
| Lint & format   | `npm run lint`, `npm run lint:fix`, `npm run format`           |
| Tests           | `npm test` (watch), `npm run test:run`, `npm run test:e2e`     |
| Packaging       | `npm run package` / `npm run make`                             |
| Clean / rebuild | `npm run clean`, `npm run rebuild`                             |
| Full gate       | `npm run validate`                                             |
| Migrations      | `npm run migrate:create`, `migrate:status`, `migrate:snapshot` |

Husky runs lint-staged → ESLint, Prettier, and `node scripts/run-type-check.js` on staged files.

## 3. Layered Architecture

1. **Main (`src/main`)**: Window lifecycle, IPC registration, SQLite access. Keep side effects behind services/modules; never expose Node APIs directly.
2. **Preload (`src/preload`)**: Uses `contextBridge` to expose curated, typed `window.api.*`. Every method must go through IPC channels defined in shared code.
3. **Renderer (`src/renderer`)**: React SPA with feature-first folders, Zustand stores for state, TanStack Router for navigation, i18next for copy, Tailwind for styles.
4. **Shared (`src/shared`)**: Source of truth for types, IPC channels, and API interfaces—update here before touching other layers.

## 4. Data & Persistence

- SQLite is loaded via sql.js (WASM). DB lives in memory; call `saveDatabase()` after every write to persist to disk.
- Schema evolution uses a migration system tracked in `schema_migrations` table. Migrations run automatically on app startup.
- Domain CRUD modules live under `src/main/database/*.ts`; favor parameterized statements and UTC ISO timestamps.
- Foreign keys are ON; deleting a journal cascades to entries. Tags are stored as JSON strings.

### Database Migrations

**Migration System** (`src/main/database/migrations.ts`):

- Migrations are defined as TypeScript objects with `id` and `up()` function
- `runMigrations()` applies pending migrations automatically on startup
- Each migration runs in a transaction with automatic rollback on error
- Applied migrations are tracked in `schema_migrations` table

**Creating Migrations**:

```bash
# Create new migration (adds to migrations.ts)
npm run migrate:create add_new_field

# View all defined migrations
npm run migrate:status

# Snapshot schema for version control
npm run migrate:snapshot
```

**Migration Workflow**:

1. Create migration: `npm run migrate:create <name>`
2. Edit `src/main/database/migrations.ts` to implement the `up` function
3. Update TypeScript types in `src/shared/types/`
4. Test migration: `npm test -- migrations.test.ts`
5. Update `schema.sql` if this represents the "current" schema
6. Run app - migration applies automatically
7. Snapshot schema: `npm run migrate:snapshot`

**Best Practices**:

- Always use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Keep migrations small and focused
- Never modify existing migrations after deployment
- Test with real data before deploying
- See `docs/MIGRATIONS.md` for comprehensive guide

**Example Migration**:

```typescript
{
  id: '003_add_archived_field',
  up: (db) => {
    db.run('ALTER TABLE entries ADD COLUMN archived INTEGER DEFAULT 0');
    db.run('CREATE INDEX IF NOT EXISTS idx_entries_archived ON entries(archived)');
  },
}
```

## 5. IPC Workflow (additive checklist)

1. Create/extend types in `src/shared/types` and export from its index.
2. Add channel constant to `src/shared/ipc/channels.ts` and method signature to `src/shared/ipc/api.types.ts`.
3. Implement handler in `src/main/modules/<domain>/*.ipc.ts`; validate input, wrap in try/catch, persist via DB module, return serializable data.
4. Wire preload bridge in `src/preload/api/<domain>.api.ts` and export via `src/preload/api/index.ts`.
5. Consume through `window.api` in renderer (hooks/stores/components). Keep renderer logic pure/UI-focused.

Security notes: validate untrusted data server-side, never leak filesystem paths, and keep IPC payloads JSON-serializable.

## 6. Renderer Composition & State

- Pages live in `src/renderer/pages`, routed via `src/renderer/router.tsx` (currently `/` editor + `/settings`).
- Zustand stores belong inside their feature folder; always expose loading/error flags, use async functions, and gate hotkeys via the shared hotkeys provider.
- Hooks live in `src/renderer/hooks` (e.g., `useGlobalHotkeys`, `useHud`). Prefer hooks for cross-feature behavior to preserve SRP.
- i18n: strings in `src/renderer/locales/{locale}/common.json`; update both `en` and `fr` and reuse `useTranslation()`.

## 7. UI & Interaction Patterns

- Tiptap powers the editor—extend via feature folders under `features/editor` (extensions, styles, constants).
- Styling uses Tailwind 4 + DaisyUI. Favor utility classes, `clsx`, and helper `cn()`.
- Shared UI components in `src/renderer/components/ui`; layout primitives (HUD, modals, keyboard panel) under `components/layout`.
- Hotkeys: register through `useGlobalHotkeys` so modal state automatically disables global shortcuts. Keep documentation synced via `src/renderer/config/shortcuts.ts` and HUD overlays.
- Accessibility: ensure focus traps in modals, provide ARIA labels for HUD buttons, and maintain contrast in both light/dark modes.

## 8. Engineering Guidelines

- **SRP & Modularity**: One responsibility per file. Co-locate logic with its feature; use barrel exports for ergonomics.
- **TypeScript**: Strict mode is on—avoid `any`, prefer discriminated unions/enums, and keep IPC method signatures fully typed.
- **Error handling**: Catch IPC/database errors in main process, log centrally, surface user-friendly notifications via stores/components.
- **Performance**: Avoid heavy work in renderer render paths (debounce autosave, memoize derived data). Use lazy imports for large feature bundles when practical.
- **Security/Privacy**: All data is local; never introduce network calls without explicit opt-in. Keep preload surface minimal and immutable.
- **Testing**: Prefer Vitest + RTL for renderer, targeted unit tests for DB/IPC logic, and Playwright for regression flows (journal CRUD, settings, keyboard shortcuts).

### Implementation Guardrails

- Keep React components under 200 lines and helper functions under 50 lines; extract reusable logic into hooks.
- Use explicit interfaces, discriminated unions, and custom type guards; never fall back to `any`.
- Wrap IPC handlers in try/catch, validate payloads, and keep CPU-heavy work outside the main process (renderer/worker threads).
- Reuse Tailwind utility components and enforce class sorting via the Tailwind/Prettier plugins.
- Apply performance tactics where relevant: lazy-load large feature bundles, virtualize long lists, and debounce/throttle expensive handlers.
- Default to accessible patterns—semantic HTML, ARIA attributes, focus management, and full keyboard support for interactive elements.
- Never include LLM co-author metadata in git commits; only human contributors belong in commit trailers.
- Keep README, the `docs/` folder, and translation files accurate whenever behavior, setup, or workflows change.

## 9. Workflow Checklist for Changes

1. Confirm design/feature scope; update translations if UI text changes.
2. Touch shared types before main/preload/renderer.
3. Add/adjust Zustand store logic, then UI components/pages.
4. Update shortcut docs (`config/shortcuts.ts`) when binding keys.
5. Run `npm run validate` and `npm run test` before committing.
6. Keep commits minimal, descriptive, and free of secrets. Do not add co-author metadata to commits. Also use conventional commits.

## 10. When to Add More LLM Guides?

At present, **CLAUDE.md** and **AGENTS.md** contain unified instructions adequate for every model. Create another guide only if a new agent demands materially different workflows or permissions; otherwise, keep all AI contributors aligned via this single document.

---

_Last updated: November 2025_
