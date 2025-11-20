# Esquisse Refactoring Roadmap

> Comprehensive refactoring plan with prioritized improvements, detailed implementation guidance, and progress tracking.

**Last Updated:** November 2025
**Status:** Planning Phase

---

## How to Use This Document

- Each refactor item has a **Priority** (Critical/High/Medium/Low), **Status** checkbox, and **Effort** estimate
- Work through items in priority order unless dependencies dictate otherwise
- Check off `[ ]` boxes as work completes
- Update "Status Notes" section when starting or completing an item

---

## Critical Priority

### 1. Database Migration Framework

**Status:** ✓ Completed (November 2025)

**Why:** Current "re-run schema" approach will cause data loss as the app evolves. Users need safe, versioned schema updates.

**Current State:**

- `schema.sql` is applied on first launch
- No mechanism for evolving schema without data loss
- No version tracking in database

**Target State:**

- Versioned migration system using `PRAGMA user_version`
- Incremental `.sql` or TypeScript migration files
- Safe forward/backward migration paths
- CLI tools for generating and testing migrations

**Implementation Steps:**

1. **Add version tracking**
   - Read current `PRAGMA user_version` on DB init
   - Store current schema version in constants (e.g., `CURRENT_SCHEMA_VERSION = 1`)

2. **Create migration infrastructure**
   - New directory: `src/main/database/migrations/`
   - Migration file naming: `001_initial_schema.sql`, `002_add_tags_table.sql`, etc.
   - Migration runner in `src/main/database/migrator.ts`

3. **Migration runner logic**

   ```typescript
   interface Migration {
     version: number;
     name: string;
     up: (db: Database) => void;
     down?: (db: Database) => void; // optional rollback
   }
   ```

   - Check current version vs. target
   - Apply migrations sequentially
   - Update `user_version` after each successful migration
   - Wrap in transactions for atomicity

4. **Snapshot current schema**
   - Save current `schema.sql` as `migrations/001_initial_schema.sql`
   - Document baseline version in README

5. **Add migration CLI**
   - `npm run migrate:create <name>` - Generate new migration template
   - `npm run migrate:up` - Apply pending migrations
   - `npm run migrate:status` - Show current version and pending migrations

6. **Testing**
   - Unit tests for migration runner
   - Integration tests with sample data across versions
   - Test rollback scenarios (if implemented)

**Dependencies:** None

**Effort:** \~2-3 days

**References:**

- SQLite PRAGMA user_version: <https://www.sqlite.org/pragma.html#pragma_user_version>
- Migration pattern examples: node-sqlite3 migrations, Knex.js

---

## High Priority

### 2. Type-Safe IPC Contracts with Runtime Validation

**Status:** ✓ Completed (November 2025)

**Why:** Eliminate drift between renderer, preload, and main. Catch serialization bugs and contract violations at runtime.

**Current State:**

- Types defined in `src/shared/types` and `src/shared/ipc/api.types.ts`
- Channel constants in `src/shared/ipc/channels.ts`
- No runtime validation of payloads
- Type safety only at compile time

**Target State:**

- Single source of truth using Zod schemas
- Derive TypeScript types from schemas
- Runtime validation in IPC handlers
- Automated contract testing

**Implementation Steps:**

1. **Create IPC schema definitions**
   - New file: `src/shared/ipc/schemas.ts`
   - Define Zod schemas for all IPC methods:

   ```typescript
   export const JournalSchemas = {
     getAll: {
       request: z.void(),
       response: z.array(JournalSchema),
     },
     create: {
       request: z.object({ name: z.string(), description: z.string().optional() }),
       response: JournalSchema,
     },
     // ... etc
   };
   ```

2. **Generate types from schemas**
   - Extract types: `type GetAllJournalsResponse = z.infer<typeof JournalSchemas.getAll.response>`
   - Update `api.types.ts` to use derived types
   - Remove duplicate type definitions

3. **Create validation middleware**
   - `src/main/ipc/validator.ts`:

   ```typescript
   export function validateIpcHandler<TReq, TRes>(
     requestSchema: z.ZodType<TReq>,
     responseSchema: z.ZodType<TRes>,
     handler: (params: TReq) => Promise<TRes>
   ) {
     return async (event: IpcMainInvokeEvent, rawParams: unknown) => {
       const params = requestSchema.parse(rawParams); // throws on invalid
       const result = await handler(params);
       return responseSchema.parse(result); // validates response
     };
   }
   ```

4. **Apply validation to handlers**
   - Wrap all IPC handlers with `validateIpcHandler`
   - Centralize error handling for validation failures
   - Log validation errors with structured details

5. **Update preload layer**
   - Ensure preload methods use schema-derived types
   - Consider adding request validation in preload for faster feedback

6. **Add contract tests**
   - Test that each IPC channel validates requests/responses correctly
   - Test invalid payloads throw appropriate errors
   - Ensure serialization edge cases are handled (Dates, undefined, etc.)

**Dependencies:** None (Zod already in dependencies)

**Effort:** \~3-4 days

**Breaking Changes:** None if done incrementally per feature area

---

### 3. Async State Management (FSM Alternative)

**Status:** ✓ Completed - Alternative Implementation (November 2025)

**Why:** Eliminate race conditions and invalid states in async operations (autosave, initialization, loading). Improve debuggability and observability.

**Decision:** After evaluating the full FSM pattern, we implemented a simpler Higher-Order Async Handler approach instead, which achieved better ROI with lower complexity.

**Evaluation:**

The FSM pattern was thoroughly evaluated with a cost-benefit analysis:

**FSM Pattern Results:**

- Code savings: 13 lines
- Infrastructure cost: 167 lines
- Net result: -154 lines (worse)
- ROI: -0.57 (negative)
- Integration complexity: HIGH (React lifecycle conflicts)
- Implementation attempted but failed with initialization issues

**Alternative A (Higher-Order Async Handler) Results:**

- Code savings: ~80 lines across 11 operations
- Infrastructure cost: 53 lines (utility function + tests)
- Net result: +27 lines (better)
- ROI: +1.51 (excellent)
- Integration complexity: LOW (no conflicts)
- Per operation: 26 → 15 lines (42% reduction)

**Implemented Solution:**

Created `withAsyncHandler` utility function in `src/renderer/lib/store.ts`:

```typescript
/**
 * Wraps an async operation with automatic loading/error state management.
 * Eliminates boilerplate try/catch/loading/error handling code.
 */
export async function withAsyncHandler<T>(
  setState: (updater: (draft: any) => void) => void,
  progressKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Set loading state
  setState((draft) => {
    draft.progress[progressKey] = toAsyncSlice('loading');
  });

  try {
    const result = await operation();
    setState((draft) => {
      draft.progress[progressKey] = toAsyncSlice('success');
    });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    setState((draft) => {
      draft.progress[progressKey] = toAsyncSlice('error', message);
    });
    throw error;
  }
}
```

**What Was Refactored:**

1. **Settings Store** (`settings.store.ts`): 97 → 81 lines (16.5% reduction)
   - `loadSettings`, `updateSettings`

2. **Journals Store** (`journals.store.ts`): 189 → 149 lines (21% reduction)
   - `loadJournals`, `createJournal`, `updateJournal`, `deleteJournal`

3. **Entries Store** (`entries.store.ts`): 260 → 217 lines (16.5% reduction)
   - `loadEntries`, `createEntry`, `updateEntry`, `deleteEntry`, `searchEntries`

**Total Impact:**

- 11 async operations refactored
- ~80 lines of boilerplate eliminated
- Comprehensive test suite (12 tests for utility, all passing)
- All 886 existing tests still passing
- Zero behavioral changes
- Type safety maintained

**Dependencies:** None

**Effort:** ~4 hours (actual)

**Files Modified:**

- `src/renderer/lib/store.ts` - Added utility function
- `src/renderer/lib/store.test.ts` - Created comprehensive test suite
- `src/renderer/features/settings/settings.store.ts` - Refactored
- `src/renderer/features/journals/journals.store.ts` - Refactored
- `src/renderer/features/entries/entries.store.ts` - Refactored

---

### 4. Typed Configuration Pipeline

**Status:** ✓ Completed (November 2025)

**Why:** Prevent configuration drift between Forge, Vite, and Tailwind. Ensure TypeScript paths mirror Vite aliases.

**What Was Implemented:**

1. **Shared Config Module** (`config/index.ts`)
   - Zod schema validation for all configuration values
   - Single source of truth for paths, aliases, and content globs
   - Typed exports for TypeScript, Vite, and Tailwind
   - Early validation on module load

2. **Path Aliases** - Centralized 16 aliases:
   - Root: `@`, `@shared`, `@main`, `@preload`, `@test`
   - Renderer features: `@features`, `@components`, `@ui`, `@layout`, `@hooks`, `@services`, `@providers`, `@config`, `@lib`, `@styles`, `@pages`

3. **Config Consumers Updated:**
   - **Vite configs** (main, preload, renderer) - Use `config.aliases`
   - **TypeScript** (`tsconfig.json`) - Auto-generated paths from shared config
   - **Tailwind** (`tailwind.config.js`) - Use `getTailwindContent()` helper

4. **TypeScript Path Generator** (`scripts/generate-ts-paths.js`)
   - Automatically generates TypeScript paths from shared config
   - Ensures 1:1 mapping with Vite aliases
   - Integrated into validation workflow

**Example - Before and After:**

**Before** (duplicated across 4 files):

```typescript
// vite.renderer.config.mjs
alias: {
  '@': path.resolve(__dirname, './src/renderer'),
  '@shared': path.resolve(__dirname, './src/shared'),
  // ...16 total aliases
}

// tsconfig.json (manually kept in sync)
"paths": {
  "@/*": ["./src/renderer/*"],
  "@shared/*": ["./src/shared/*"],
  // ...16 total aliases
}
```

**After** (single source of truth):

```typescript
// config/index.ts
export const config = ConfigSchema.parse({
  aliases: {
    '@': resolve(projectRoot, './src/renderer'),
    '@shared': resolve(projectRoot, './src/shared'),
    // ...16 total aliases
  },
});

// vite.renderer.config.mjs
import { config } from './config/index.ts';
export default defineConfig({
  resolve: { alias: config.aliases },
});

// Generated automatically via script
// npm run config:generate-ts-paths
```

**Benefits Achieved:**

- Zero configuration drift - impossible to have mismatched aliases
- Zod validation catches config errors at module load time
- TypeScript paths auto-generated from Vite aliases
- Single place to add new aliases or paths
- `npm run validate:config` verifies consistency

**Files Created:**

- `config/index.ts` - Shared configuration module (147 lines)
- `scripts/generate-ts-paths.js` - TypeScript path generator

**Files Modified:**

- `vite.renderer.config.mjs` - Use shared aliases (20 → 9 lines)
- `vite.main.config.ts` - Use shared aliases and paths
- `vite.preload.config.ts` - Use shared aliases
- `tailwind.config.js` - Use shared content globs
- `tsconfig.json` - Auto-generated paths (17 path mappings)
- `package.json` - Added `config:generate-ts-paths` and `validate:config` scripts

**Dependencies:** None (uses existing Zod)

**Effort:** \~6 hours (actual)

---

### 5. Continuous Integration Suite

**Status:** ☐ Not Started

**Why:** Ensure quality across platforms before releasing. Catch platform-specific bugs early.

**Current State:**

- `npm run validate` runs locally
- No automated cross-platform testing
- No artifact uploads or coverage reports

**Target State:**

- GitHub Actions workflow for macOS/Linux/Windows
- Automated test suite on every PR
- Coverage reports and packaged builds as artifacts
- Pre-release smoke tests

**Implementation Steps:**

1. **Create CI script**
   - New file: `scripts/ci-validate.js`
   - Runs: lint, type-check, test:run, test:e2e (headless)
   - Exits with error code on any failure
   - Add `npm run validate:ci` script

2. **Create GitHub Actions workflow**
   - New file: `.github/workflows/ci.yml`

   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     test:
       strategy:
         matrix:
           os: [ubuntu-latest, macos-latest, windows-latest]
           node: [20]
       runs-on: ${{ matrix.os }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node }}
             cache: 'npm'
         - run: npm ci
         - run: npm run validate:ci
         - run: npm run package # dry run
   ```

3. **Add coverage reporting**
   - Configure Vitest for coverage output
   - Upload coverage to artifact storage
   - Optional: Integrate with Codecov or similar

4. **Add artifact uploads**
   - Upload packaged builds from `npm run make`
   - Upload test results and screenshots on failure
   - Retention: 30 days for PRs, 90 days for releases

5. **Add status badges**
   - Add CI badge to README
   - Show build status per platform

6. **Create pre-release workflow**
   - Triggered on tag push
   - Runs full validation
   - Builds for all platforms
   - Uploads release artifacts

**Dependencies:** None

**Effort:** \~2 days

**Cost:** Free for public repos, uses GitHub Actions minutes for private repos

---

## Medium Priority

### 6. Domain Repositories Pattern

**Status:** ✓ Completed (November 2025)

**Why:** Separate business logic from IPC/infrastructure. Enable future platform targets (web/PWA) to reuse core logic.

**What Was Implemented:**

1. **Repository Interfaces & Implementations** - Created clean separation between data access contracts and implementations:
   - `JournalRepository` (interface + SQLite implementation)
   - `EntryRepository` (interface + SQLite implementation)
   - `SettingsRepository` (interface + SQLite implementation)

2. **Service Layer with Business Logic** - Extracted business rules from database functions:
   - `JournalService` - Validates journal names, checks existence
   - `EntryService` - Validates content, enforces journal references
   - `SettingsService` - Validates ranges (font size 10-32, interval >= 1000ms, language codes)

3. **Dependency Injection Container** (`src/main/domain/container.ts`):
   - Singleton pattern for service/repository instances
   - Clean dependency management
   - Provides `getJournalService()`, `getEntryService()`, `getSettingsService()` helpers
   - Includes `resetContainer()` for test isolation

4. **Updated IPC Handlers** - Refactored to be thin controllers:

   ```typescript
   // Before: Direct database access
   import * as journalDb from '../../database/journals';
   journalDb.createJournal(journal);

   // After: Service layer
   import { getJournalService } from '../../domain/container';
   const service = getJournalService();
   service.createJournal(journal); // Now with validation!
   ```

5. **Backward Compatibility** - Kept database functions as deprecated wrappers:

   ```typescript
   // src/main/database/journals.ts
   /** @deprecated Use JournalService.createJournal() instead */
   export function createJournal(input: CreateJournalInput): Journal {
     return getContainer().journalRepository.create(input);
   }
   ```

   This ensures existing tests continue working while new code uses the service layer.

6. **Updated Tests** - Fixed IPC tests to mock container services instead of database functions:
   - All 886 tests passing ✅
   - IPC tests now mock `getJournalService()`, `getEntryService()`, etc.
   - Clean test isolation with mocked services

**Architecture Before & After:**

**Before:**

```
IPC Handler → Database Function → SQL
```

**After:**

```
IPC Handler → Service (business logic) → Repository (data access) → SQL
```

**Benefits Achieved:**

- ✅ Clean separation of concerns (data access vs business logic vs API)
- ✅ Testable architecture (can mock repositories in service tests, mock services in IPC tests)
- ✅ Portable domain logic ready for future web/PWA implementation
- ✅ Type-safe dependency injection
- ✅ Business rule validation centralized in service layer

**Files Created:**

- `src/main/domain/journals/` - Repository interface, implementation, service
- `src/main/domain/entries/` - Repository interface, implementation, service
- `src/main/domain/settings/` - Repository interface, implementation, service
- `src/main/domain/container.ts` - DI container (137 lines)

**Files Modified:**

- `src/main/database/journals.ts` - Now deprecated wrapper (52 lines, was 121)
- `src/main/database/entries.ts` - Now deprecated wrapper (60 lines, was 153)
- `src/main/database/settings.ts` - Now deprecated wrapper (42 lines, was 77)
- `src/main/modules/*/journal.ipc.ts` - Use services from container
- `src/main/modules/*/entry.ipc.ts` - Use services from container
- `src/main/modules/*/settings.ipc.ts` - Use services from container
- All IPC test files - Updated to mock container services

**Dependencies:** None

**Effort:** \~6 hours (actual)

---

### 7. Automated Schema Snapshots

**Status:** ✓ Completed (November 2025)

**Why:** Track schema evolution over time. Make it easier to generate migrations. Audit schema changes in version control.

**Note:** This was completed as part of the Migration Framework (#1) implementation.

**What Was Implemented:**

1. **Schema Snapshot Command** - Integrated into `scripts/migration-cli.js`
   - Command: `npm run migrate:snapshot`
   - Automatically versions snapshots using package.json version
   - Timestamps each snapshot for historical tracking
   - Stores in `src/main/database/snapshots/`

2. **Snapshot Format**
   - Timestamped filenames: `schema-v{VERSION}-{DATE}.sql`
   - Includes version and date metadata in file header
   - Committed to git for audit trail

3. **Comprehensive Documentation**
   - Full workflow documented in `docs/MIGRATIONS.md`
   - When to snapshot (before releases, after schema changes)
   - How to compare snapshots
   - Integration with migration workflow

**Example Output:**

```bash
$ npm run migrate:snapshot

Schema Snapshot Created
────────────────────────────────────────────────────────────
Version: 1.0.0
File: src/main/database/snapshots/schema-v1.0.0-2025-11-18.sql

Snapshot saved successfully!
```

**Benefits Achieved:**

- Historical record of schema at each version
- Easy diffing between versions for migration generation
- Clear audit trail in version control
- Integrated workflow with migration system

**Dependencies:** Implemented alongside #1 (migration framework)

**Effort:** \~1 day (actual, as part of migration work)

---

### 8. IPC Error Boundaries

**Status:** ✓ Completed (November 2025)

**Why:** Gracefully handle IPC failures in UI. Provide recovery options. Improve user experience during errors.

**Implementation Summary:**

1. **Enhanced IPC error types** (`src/renderer/services/utils.ts`)
   - Added `channel` and `isRetryable` properties to `IpcError` class
   - Added static helper methods: `IpcError.retryable()` and `IpcError.fatal()`
   - Maintained backward compatibility with existing error handling

2. **Created IPC Error Boundary component** (`src/renderer/components/layout/IpcErrorBoundary.tsx`)
   - Only catches `IpcError` instances (rethrows other errors to parent boundaries)
   - Implements automatic retry with exponential backoff for retryable errors
   - Tracks retry count and respects configurable max retries (default: 3)
   - Provides manual retry functionality via button click
   - Supports custom fallback UI through render prop pattern

3. **Created polished error fallback UI** (`src/renderer/components/layout/IpcErrorFallback.tsx`)
   - Different visual treatment for retryable vs fatal errors
   - Displays channel information and error codes
   - Provides actionable buttons (Retry, Try Again, Reload App)
   - Shows technical details in collapsible section
   - Supports both inline and fullscreen variants
   - Fully accessible with ARIA labels

4. **Wrapped feature areas with error boundaries**
   - Editor page: wrapped with fullscreen error boundary
   - Settings page: wrapped with inline error boundary
   - Allows graceful degradation per feature without crashing the entire app

5. **Comprehensive test coverage**
   - 12 passing tests covering core functionality
   - Tests for error catching, rethrowing non-IPC errors, custom fallbacks
   - Tests for retryable vs non-retryable error handling
   - 4 tests skipped (retry timing edge cases - documented for future improvement)

**Files Added/Modified:**

- `src/renderer/services/utils.ts` - Enhanced `IpcError` class
- `src/renderer/components/layout/IpcErrorBoundary.tsx` - Error boundary component
- `src/renderer/components/layout/IpcErrorFallback.tsx` - Error fallback UI
- `src/renderer/components/layout/IpcErrorBoundary.test.tsx` - Comprehensive tests
- `src/renderer/components/layout/index.ts` - Exported new components
- `src/renderer/pages/EditorPage.tsx` - Wrapped with error boundary
- `src/renderer/pages/SettingsPage.tsx` - Wrapped with error boundary

**Dependencies:** None

**Effort:** \~2 days (actual)

---

### 9. Type-Safe Internationalization

**Status:** ✓ Completed (November 2025)

**Why:** Catch missing translation keys at compile time. Ensure type safety across locales.

**What Was Implemented:**

1. **TypeScript Type Declarations** (`src/renderer/lib/i18n.types.ts`)
   - Module augmentation for i18next
   - Automatically derives types from `en/common.json`
   - Enables compile-time validation of translation keys
   - Provides IDE autocomplete for all translation paths

2. **Translation Validation Script** (`scripts/validate-translations.js`)
   - Validates all locales against base locale (en)
   - Detects missing keys in translations
   - Detects extra keys not in base locale
   - Provides clear, actionable error messages

3. **Integration with Build Pipeline**
   - Added `npm run validate:translations` script
   - Integrated into `npm run validate` workflow
   - Added to lint-staged for pre-commit validation
   - Runs automatically when locale files change

4. **Type-Safe Configuration Updates**
   - Updated `ShortcutDisplayMetadata` to use `TranslationKey` type
   - Updated settings components to use `as const` for literal types
   - Added type assertions where dynamic keys are required

**Example - Type Safety in Action:**

Before (no type checking):

```typescript
const THEME_OPTIONS = [
  { value: 'system', labelKey: 'settings.theme.system' }, // ❌ No error on typo
];
```

After (type-safe):

```typescript
const THEME_OPTIONS = [
  { value: 'system', labelKey: 'settings.options.theme.system' }, // ✅ TypeScript validates key exists
] as const;
```

**Benefits Achieved:**

- Compile-time errors for invalid translation keys
- IDE autocomplete for all 52 translation keys
- Runtime validation ensures translation completeness
- Pre-commit hooks prevent invalid translations from being committed

**Files Modified:**

- `src/renderer/lib/i18n.types.ts` - Type declarations
- `src/renderer/lib/i18n.ts` - Import type declarations
- `scripts/validate-translations.js` - Validation script
- `src/renderer/config/shortcuts.ts` - Use `TranslationKey` type
- `src/renderer/features/settings/components/AppearanceSettings.tsx` - Type-safe options
- `src/renderer/lib/shortcuts.ts` - Type assertions for dynamic keys
- `package.json` - Added validation scripts and lint-staged config

**Dependencies:** None (uses existing i18next)

**Effort:** \~4 hours (actual)

**References:** <https://react.i18next.com/latest/typescript>

---

## Low Priority (Future-Proofing)

### 10. Database Transaction Helpers

**Status:** ✅ Completed (November 2025)

**Why:** Ensure data integrity for multi-step operations. Prevent partial writes on error.

**Previous State:**

- Basic `withTransaction` helper existed but was limited
- No async support
- No savepoint support for nested transactions
- No comprehensive tests
- No documentation

**Current State:**

- Full-featured transaction module with sync and async support
- Savepoint support for nested transactions
- Configurable transaction modes (DEFERRED/IMMEDIATE/EXCLUSIVE)
- Auto-save configuration
- Comprehensive test coverage (15 tests passing)
- Complete documentation

**Implementation Summary:**

1. **Created comprehensive transaction module** (`src/main/database/transactions.ts`)
   - `withTransaction<T>()` - Synchronous transaction wrapper
   - `withTransactionAsync<T>()` - Async transaction wrapper
   - `savepoint()` - Manual savepoint management
   - `withSavepoint<T>()` - Auto-managed savepoint wrapper
   - `withSavepointAsync<T>()` - Async savepoint wrapper
   - Support for transaction modes (DEFERRED/IMMEDIATE/EXCLUSIVE)
   - Configurable auto-save behavior

2. **Updated database index exports** (`src/main/database/index.ts`)
   - Exported all new transaction helpers
   - Maintained backward compatibility

3. **Created comprehensive test suite** (`src/main/database/transactions.test.ts`)
   - 15 tests covering all transaction scenarios
   - Tests for sync and async operations
   - Tests for savepoint functionality
   - Tests for nested savepoints
   - Error propagation tests
   - All tests passing

4. **Created usage documentation** (`docs/TRANSACTIONS.md`)
   - API reference for all helpers
   - Transaction mode explanations
   - Common usage patterns
   - Error handling guide
   - Testing guide
   - Best practices

**Files Created:**

- `src/main/database/transactions.ts` - Transaction helpers module
- `src/main/database/transactions.test.ts` - Comprehensive tests
- `docs/TRANSACTIONS.md` - Usage documentation

**Files Modified:**

- `src/main/database/index.ts` - Export transaction helpers

**Integration with Repository Pattern:**

All repository write operations already use `withTransaction`:

- `JournalRepository.create()` - Transactional
- `JournalRepository.update()` - Transactional
- `JournalRepository.delete()` - Transactional
- `EntryRepository.create()` - Transactional
- `EntryRepository.update()` - Transactional
- `EntryRepository.delete()` - Transactional

**Example Usage:**

```typescript
// Basic transaction
withTransaction((db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
  db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
    entryId,
    id,
    'Content',
  ]);
}); // Both succeed or both fail

// With savepoints for partial rollback
withTransaction((db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

  try {
    withSavepoint(db, (db) => {
      db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
        entryId,
        id,
        'Content',
      ]);
    });
  } catch (error) {
    // Entry rolled back, journal preserved
  }
});
```

**Dependencies:** Pairs with #6 (repository pattern, completed)

**Effort:** \~1 day (actual)

---

### 11. Background Worker for Database Operations

**Status:** ☐ Not Started

**Why:** Prevent UI freezing during large operations. Keep main process responsive for window management.

**Current State:**

- All sql.js operations run in main process
- Large exports/imports could freeze UI
- No parallelization of DB work

**Target State:**

- Dedicated worker thread for sql.js
- MessagePort communication via Electron
- Main process delegates heavy DB work

**When to Implement:** Only if users report freezing during large operations. Profile first.

**Implementation Steps:**

1. **Profile current performance**
   - Test with large datasets (1000+ entries)
   - Measure time for exports, searches, bulk operations
   - Only proceed if >100ms blocking time

2. **Create database worker**
   - New file: `src/main/workers/database.worker.ts`
   - Load sql.js in worker context
   - Handle DB operations via message passing

3. **Set up MessagePort communication**

   ```typescript
   // Main process
   const worker = new Worker('./database.worker.js');
   const { port1, port2 } = new MessageChannelMain();
   worker.postMessage({ port: port2 }, [port2]);

   // Worker
   parentPort.on('message', ({ port }) => {
     port.on('message', handleDbOperation);
   });
   ```

4. **Create worker API**
   - Type-safe message protocol
   - Request/response pattern
   - Error propagation

5. **Migrate heavy operations**
   - Start with exports
   - Then imports
   - Then search/filter operations

6. **Add progress reporting**
   - Stream progress events for long operations
   - Update UI with progress bar

**Dependencies:** None, but pairs well with #1 (migrations) and #6 (repositories)

**Effort:** \~4-5 days

**Complexity:** High - adds architectural complexity, only worth it if needed

---

### 12. Snapshot & Write-Ahead Log Strategy

**Status:** ❌ Won't Implement - Architecture Mismatch

**Why Closed:**

sql.js (WASM SQLite) architecture doesn't support native WAL mode. Implementing a custom WAL would require:

- Intercepting and logging every SQL statement
- Custom replay logic on startup
- Complex state management
- 5-6 days of effort for minimal benefit

**Analysis:** Current persistence works well:

- `db.export()` is fast (~1-5ms for typical data)
- Async file writes don't block UI
- No performance issues reported
- Debouncing already reduces disk writes

**Better alternatives:** See #12a (Debounced Batch Saves) and #12b (Periodic Auto-Backups) below for simpler, more appropriate solutions.

**Detailed analysis:** See `docs/DATABASE_PERSISTENCE_ALTERNATIVES.md`

---

### 12a. Debounced Batch Saves

**Status:** ✅ Completed (November 2025)

**Why:** Reduce disk I/O during burst editing. Save once after user stops typing instead of after every transaction.

**Current State:**

- `saveDatabase()` called after every transaction
- 10 rapid edits = 10 disk writes
- Already has async scheduling, but no debouncing

**Target State:**

- Debounced saves: wait 1 second after last change
- 10 rapid edits = 1 disk write
- Immediate flush on app shutdown

**Implementation:**

```typescript
// src/main/database/index.ts
let saveTimer: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 1000;

function saveDatabase(): void {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveTimer = null;
    scheduleSave();
  }, SAVE_DEBOUNCE_MS);
}

// On shutdown: flush immediately
app.on('before-quit', () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flushDatabaseSync();
});
```

**Benefits:**

- Reduces disk writes by 90%+ during burst edits
- Leverages existing async save infrastructure
- Guaranteed save on shutdown
- Simple, low-risk change

**Dependencies:** None

**Effort:** ~1 hour

---

### 12b. Periodic Auto-Backups

**Status:** ✅ Completed (November 2025)

**Why:** Crash recovery. Minimize data loss from unexpected shutdowns.

**Current State:**

- `backup.ts` exists but only used manually
- No automatic backup schedule
- Crash = potential data loss

**Target State:**

- Auto-backup every 15 minutes
- Backup on clean shutdown
- Max data loss: 15 minutes

**Implementation:**

```typescript
// src/main/database/index.ts
import { createBackup } from './backup';

const BACKUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

function startAutoBackup() {
  setInterval(() => {
    const dbPath = getDatabasePath();
    createBackup(dbPath);
  }, BACKUP_INTERVAL_MS);

  app.on('before-quit', () => {
    const dbPath = getDatabasePath();
    createBackup(dbPath);
  });
}

// Call after initializeDatabase()
```

**Benefits:**

- Crash recovery with minimal data loss
- Leverages existing tested `backup.ts`
- Automatic backup rotation (keeps last 10)
- Simple integration

**Dependencies:** None (uses existing `backup.ts`)

**Effort:** ~1 hour

---

### 13. Feature-Driven Routing Shells

**Status:** ✅ Completed (November 2025)

**Why:** Optimize bundle size. Lazy-load feature-specific code. Better code splitting.

**Previous State:**

- Two routes: `/` (editor) and `/settings`
- All code loaded eagerly on startup (1.1MB bundle)
- No route-level code splitting

**Current State:**

- Route-level layout components with hierarchical error boundaries
- Lazy-loaded feature bundles using TanStack Router's `lazyRouteComponent`
- Suspense boundaries with loading skeletons per route
- Bundle visualizer configured for ongoing monitoring

**Results:**

- **Initial load reduced from 1.1MB → 625KB (43% reduction)**
- Main bundle: 512KB
- Editor chunk (lazy): 394KB (loads on-demand)
- Settings chunk (lazy): 23KB (loads on-demand)
- React vendor: 30KB
- Router: 83KB

**Implementation Details:**

1. **Created route-level layouts** (src/renderer/layouts/)
   - `RootLayout.tsx` - Top-level error boundary + suspense
   - `EditorLayout.tsx` - Editor-specific layout with IPC error boundary
   - `SettingsLayout.tsx` - Settings-specific layout with IPC error boundary

2. **Added loading skeletons** (src/renderer/layouts/skeletons/)
   - `EditorSkeleton.tsx` - Loading state for editor route
   - `SettingsSkeleton.tsx` - Loading state for settings route

3. **Implemented lazy loading** (src/renderer/router.tsx)
   - Used `lazyRouteComponent` for EditorPage and SettingsPage
   - Added `defaultPreload: 'intent'` for hover preloading
   - Routes now load code on-demand

4. **Configured bundle analysis** (vite.renderer.config.mjs)
   - Added `rollup-plugin-visualizer` for bundle visualization
   - Configured manual chunks for vendor code splitting
   - Stats available at `dist/stats.html` after build

**Files Modified:**

- `src/renderer/router.tsx` - Lazy loading implementation
- `vite.renderer.config.mjs` - Visualizer + manual chunks
- `package.json` - Added rollup-plugin-visualizer

**Files Created:**

- `src/renderer/layouts/RootLayout.tsx`
- `src/renderer/layouts/EditorLayout.tsx`
- `src/renderer/layouts/SettingsLayout.tsx`
- `src/renderer/layouts/skeletons/EditorSkeleton.tsx`
- `src/renderer/layouts/skeletons/SettingsSkeleton.tsx`
- `src/renderer/layouts/index.ts`

**Architecture Benefits:**

- Each route loads only necessary code
- Shared layouts reused across similar routes
- IPC error boundaries scoped to feature areas
- Easy to add new routes following the same pattern
- Loading skeletons prevent layout shift during navigation

---

### 14. Offline-First Sync Preparation

**Status:** ☐ Not Started

**Why:** Prepare architecture for future multi-device sync. Simplify conflict resolution.

**Current State:**

- Direct mutations of entries/journals
- No command queue or sync mechanism
- Local-only storage

**Target State:**

- Command/event sourcing pattern
- Local mutations enqueue sync operations
- Eventual consistency model ready

**When to Implement:** Only if multi-device sync is on roadmap

**Implementation Steps:**

1. **Design command queue**

   ```typescript
   interface Command {
     id: string;
     type: 'create' | 'update' | 'delete';
     entity: 'entry' | 'journal';
     payload: unknown;
     timestamp: number;
     synced: boolean;
   }
   ```

2. **Create command bus**
   - Dispatch commands instead of direct mutations
   - Commands update local state + enqueue for sync

3. **Implement optimistic updates**
   - UI updates immediately
   - Sync happens in background
   - Rollback on conflict

4. **Add conflict resolution strategy**
   - Last-write-wins
   - Or merge strategies for text content

5. **Create sync engine stub**
   - Process command queue
   - For now, just marks commands as synced
   - Future: integrate with backend

**Dependencies:** Works well with #6 (repositories) and #3 (state machines)

**Effort:** \~1 week

**ROI:** Zero unless you build multi-device sync

---

### 15. Observability & Structured Logging

**Status:** ☐ Not Started

**Why:** Diagnose production issues. Monitor performance. Understand usage patterns.

**Current State:**

- Ad-hoc console.log statements
- No structured logging
- No performance metrics

**Target State:**

- Structured logging with levels (debug/info/warn/error)
- Optional local telemetry (with user opt-in)
- Performance monitoring for IPC, autosave, rendering

**When to Implement:** When you have users reporting bugs you can't reproduce

**Implementation Steps:**

1. **Create logging infrastructure**

   ```typescript
   // src/shared/logging/logger.ts
   interface LogEvent {
     timestamp: number;
     level: 'debug' | 'info' | 'warn' | 'error';
     category: string;
     message: string;
     context?: Record<string, unknown>;
   }

   export const logger = {
     debug: (category: string, message: string, context?) => {...},
     info: (category: string, message: string, context?) => {...},
     // ... etc
   };
   ```

2. **Add log transports**
   - Console transport (dev mode)
   - File transport (production, rotate daily)
   - Optional: Remote transport (with opt-in)

3. **Instrument critical paths**
   - IPC handler entry/exit with timing
   - Database operation timing
   - Autosave success/failure
   - HUD usage events

4. **Create performance monitoring**

   ```typescript
   const timer = logger.startTimer('ipc.journal.create');
   try {
     const result = await createJournal(...);
     timer.done({ success: true });
     return result;
   } catch (error) {
     timer.done({ success: false, error: error.message });
     throw error;
   }
   ```

5. **Add privacy-safe telemetry**
   - Settings toggle: "Help improve Esquisse by sharing anonymous usage data"
   - Only collect: feature usage counts, performance metrics, error rates
   - Never collect: journal content, user data, filesystem paths

6. **Create log viewer**
   - Settings page: "View Logs"
   - Show recent errors
   - Export logs for bug reports

**Dependencies:** None

**Effort:** \~3-4 days

**Privacy Consideration:** Must be opt-in and clearly communicated

---

## Progress Tracking

### Status Summary

| Priority  | Total  | Not Started | Won't Do | Completed |
| --------- | ------ | ----------- | -------- | --------- |
| Critical  | 1      | 0           | 0        | 1         |
| High      | 4      | 1           | 0        | 3         |
| Medium    | 4      | 0           | 0        | 4         |
| Low       | 8      | 3           | 1        | 4         |
| **Total** | **17** | **4**       | **1**    | **12**    |

### Status Notes

**Completed Items:**

- `2025-11-17`: Completed #1 (Migration Framework) - System was already implemented, added CLI tools and documentation
- `2025-11-17`: Completed #2 (Type-Safe IPC) - Implemented Zod validation throughout IPC layer
- `2025-11-17`: Completed #7 (Schema Snapshots) - Implemented alongside migration framework with full documentation
- `2025-11-18`: Completed #3 (Async State Management) - Evaluated FSM but implemented Higher-Order Async Handler alternative with better ROI
- `2025-11-18`: Completed #9 (Type-Safe i18n) - Added TypeScript types for translation keys, validation script, and pre-commit hooks
- `2025-11-19`: Completed #4 (Typed Config Pipeline) - Created shared config module with Zod validation, eliminated config drift across all build tools
- `2025-11-19`: Completed #6 (Domain Repositories Pattern) - Implemented repository and service layers with DI container, separated business logic from data access, all 886 tests passing
- `2025-11-20`: Completed #8 (IPC Error Boundaries) - Created IpcErrorBoundary component with automatic retry, renderer-side error handling for IPC failures
- `2025-11-20`: Completed #13 (Feature-Driven Routing Shells) - Implemented lazy loading with route-level layouts and code splitting, reduced initial bundle from 1.1MB to 625KB (43% reduction)
- `2025-11-20`: Completed #10 (Database Transaction Helpers) - Created comprehensive transaction module with sync/async support, savepoint functionality, 15 tests passing, complete documentation
- `2025-11-20`: Closed #12 (WAL Strategy) as Won't Implement - Architecture mismatch with sql.js, replaced with simpler alternatives #12a and #12b
- `2025-11-20`: Completed #12a (Debounced Batch Saves) - Implemented save debouncing to reduce disk I/O by 90%+ during burst edits, 1-second debounce with immediate flush on shutdown
- `2025-11-20`: Completed #12b (Periodic Auto-Backups) - Implemented automatic backups every 15 minutes with backup on shutdown, leverages existing backup.ts infrastructure

---

## Dependencies Graph

```
#1 Migration Framework (standalone)
  ↓
#7 Schema Snapshots (enhances #1)

#2 Type-safe IPC (standalone)

#3 Finite-State Stores (standalone)
  ↓
#14 Offline-First Sync (builds on #3)

#4 Typed Config (standalone)

#5 CI Suite (standalone)

#6 Domain Repositories (standalone)
  ↓
#10 Transaction Helpers (enhances #6)
  ↓
#11 Background Worker (enhances #6, #10)
  ↓
#12 Snapshot & WAL (enhances #11)

#8 IPC Error Boundaries (standalone)

#9 Type-safe i18n (standalone)

#13 Route Splitting (standalone, low ROI currently)

#15 Observability (standalone)
```

---

## Recommended Implementation Order

### Phase 1: Foundation (Critical + High Priority)

1. Migration Framework (#1) - 2-3 days
2. Type-safe IPC (#2) - 3-4 days
3. Finite-State Stores (#3) - 4-5 days
4. Typed Config (#4) - 2 days
5. CI Suite (#5) - 2 days

**Total: \~13-18 days (2.5-3.5 weeks)**

### Phase 2: Architecture (Medium Priority - as needed)

6. Domain Repositories (#6) - 5-6 days
7. Schema Snapshots (#7) - 1 day
8. IPC Error Boundaries (#8) - 2 days
9. Type-safe i18n (#9) - 1 day

**Total: \~9-10 days (2 weeks)**

### Phase 3: Optimization (Low Priority - only if needed)

10-15. Implement based on actual performance issues and feature roadmap

---

## Notes for Contributors

- **Before starting any item:** Read the full implementation steps and verify dependencies
- **During work:** Update the Status checkbox and add notes to "Status Notes" section
- **On completion:** Check off item, update Status Summary table, add completion note
- **If blocked:** Document blocker in Status Notes and consider if dependencies need to be addressed first
- **Testing:** Each refactor should include tests - unit tests for logic, integration tests for flows
- **Documentation:** Update README, CLAUDE.md, or other docs if behavior changes

---

## References

- [CLAUDE.md](../CLAUDE.md) - Main engineering guidelines
- [AGENTS.md](../AGENTS.md) - Agent-specific guidelines
- [SQLite Pragma Documentation](https://www.sqlite.org/pragma.html)
- [Zod Documentation](https://zod.dev/)
- [XState Documentation](https://xstate.js.org/) (if needed for complex state machines)
- [Electron IPC Best Practices](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [React 19 Features](https://react.dev/blog/2024/04/25/react-19) (use, defer, etc.)

---

**Last reviewed:** November 2025
**Next review:** After Phase 1 completion

**Actual Progress:**

- `2025-11-17`: Completed #1 (Migration Framework) - System was already implemented with migrations.ts and comprehensive tests. Added CLI tools (create/status/snapshot), created baseline schema snapshot (v1.0.0), and wrote comprehensive MIGRATIONS.md documentation. All 19 tests passing.

- `2025-11-17`: Completed #2 (Type-Safe IPC Contracts) - Implemented Zod schema validation throughout the IPC layer with comprehensive error handling and structured error types. All IPC handlers now validate requests and responses at runtime.

- `2025-11-18`: Completed #3 (Async State Management) - Evaluated full FSM pattern but determined negative ROI (-0.57) due to React lifecycle conflicts. Successfully implemented Alternative A (Higher-Order Async Handler pattern) instead with excellent ROI (+1.51). Created `withAsyncHandler` utility function that eliminates boilerplate across all async operations. Refactored 11 operations across 3 stores (settings, journals, entries), reducing code by ~80 lines while maintaining all 886 tests passing. Per-operation code reduced from 26 to 15 lines (42% reduction) with zero behavioral changes.

- `2025-11-18`: Completed #9 (Type-Safe i18n) - Implemented compile-time type checking for translation keys using i18next TypeScript module augmentation. Created validation script that checks all locales for completeness. Integrated validation into build pipeline (`npm run validate`) and pre-commit hooks. Updated configuration code to use `TranslationKey` type with proper type assertions. Result: 52 translation keys now have full IDE autocomplete and compile-time validation, preventing typos and missing translations.

- `2025-11-18`: Confirmed #7 (Schema Snapshots) already complete - Schema snapshot functionality was fully implemented as part of the Migration Framework work. Command `npm run migrate:snapshot` creates timestamped schema snapshots in `src/main/database/snapshots/`. Full workflow documented in `docs/MIGRATIONS.md`.

- `2025-11-19`: Completed #4 (Typed Config Pipeline) - Created centralized configuration module (`config/index.ts`) with Zod schema validation for paths, aliases, and content globs. Updated all build tool configs (Vite main/preload/renderer, TypeScript, Tailwind) to use shared config. Created TypeScript path generator script that auto-generates `tsconfig.json` paths from Vite aliases, ensuring perfect 1:1 mapping. Centralized 16 path aliases eliminating duplication across 4 config files. Result: Zero configuration drift, single source of truth for all build configuration, validation at module load time. All 886 tests passing.

- `2025-11-19`: Completed #6 (Domain Repositories Pattern) - Implemented full three-layer architecture separating data access, business logic, and API layers. Created repository interfaces and SQLite implementations for Journals, Entries, and Settings domains. Built service layer with business rule validation (journal name required, entry content required, settings ranges validated). Implemented DI container with singleton pattern for clean dependency management. Refactored all IPC handlers to be thin controllers calling services. Maintained backward compatibility by converting old database functions to deprecated wrappers. Updated all IPC tests to mock container services instead of database functions. Created 9 new domain files (interfaces, repos, services) totaling ~900 lines of clean, testable code. Reduced database module code by ~220 lines (from 351 to 131 lines across 3 files). Architecture now supports: clean separation of concerns, easy testing with mocks, portable domain logic for future web/PWA, type-safe DI. All 886 tests passing.

- `2025-11-20`: Completed #8 (IPC Error Boundaries) - Implemented comprehensive error handling for IPC failures in the renderer layer. Created `IpcErrorBoundary` component that catches IPC errors, displays user-friendly messages, and provides automatic retry functionality. Component integrates with ErrorBoundary for fallback handling and supports both automatic retries (every 5s) and manual retry buttons. Used in route layouts (EditorLayout, SettingsLayout) to scope error recovery to feature areas. Architecture allows graceful degradation when main process communication fails. All existing tests remain passing.

- `2025-11-20`: Completed #13 (Feature-Driven Routing Shells) - Implemented route-level code splitting and lazy loading to optimize bundle size. Created hierarchical layout system with RootLayout (global error boundary), EditorLayout (editor-specific with IPC error boundary), and SettingsLayout (settings-specific with IPC error boundary). Built loading skeletons (EditorSkeleton, SettingsSkeleton) for smooth UX during code loading. Implemented lazy loading using TanStack Router's `lazyRouteComponent` for EditorPage and SettingsPage. Configured bundle visualizer (rollup-plugin-visualizer) for ongoing monitoring at `dist/stats.html`. Added manual chunks in Vite config for vendor code splitting (react-vendor, router, editor). Results: Initial bundle reduced from 1.1MB to 625KB (43% reduction). Editor chunk (394KB) and Settings chunk (23KB) now load on-demand. Added `defaultPreload: 'intent'` for hover-based preloading. Architecture scales easily for future route additions. Type check and build pass successfully.

- `2025-11-20`: Completed #10 (Database Transaction Helpers) - Enhanced existing basic transaction helper with comprehensive features for ensuring data integrity in multi-step operations. Created full transaction module (`src/main/database/transactions.ts`) with five helpers: `withTransaction()` for sync operations, `withTransactionAsync()` for async operations, `savepoint()` for manual savepoint management, `withSavepoint()` and `withSavepointAsync()` for auto-managed savepoints. Added support for configurable transaction modes (DEFERRED/IMMEDIATE/EXCLUSIVE) with IMMEDIATE as default. Enabled auto-save configuration for performance optimization in tests. Updated database index to export all transaction helpers while maintaining backward compatibility. Created comprehensive test suite with 15 tests covering all scenarios: sync/async transactions, savepoint functionality, nested savepoints, error propagation, custom error types. All tests passing. Created complete usage documentation (`docs/TRANSACTIONS.md`) with API reference, transaction mode explanations, common patterns, error handling guide, testing guide, and best practices. All repository write operations already integrated with transactions. Type check passes successfully.
