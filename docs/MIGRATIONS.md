# Database Migrations Guide

This guide explains how to safely evolve the Esquisse database schema using the migration system.

## Overview

Esquisse uses a migration-based approach to manage database schema changes. This ensures that:

- Schema changes are versioned and tracked
- User data is never lost during upgrades
- Changes can be applied incrementally
- Migrations are tested before deployment

## Architecture

### Components

1. **Migration Runner** (`src/main/database/migrations.ts`)
   - Executes pending migrations on app startup
   - Tracks applied migrations in `schema_migrations` table
   - Wraps each migration in a transaction for atomicity

2. **Migration CLI** (`scripts/migration-cli.js`)
   - Tools for creating, viewing, and snapshotting migrations

3. **Schema Snapshots** (`src/main/database/snapshots/`)
   - Point-in-time snapshots of the schema
   - Used for auditing and migration generation

### Migration Flow

```
App Startup → initializeDatabase() → runMigrations() → Apply Pending Migrations → Save Database
```

## Migration Commands

### View Migration Status

```bash
npm run migrate:status
```

Shows all defined migrations in the codebase.

**Example output:**

```
Migration Status
────────────────────────────────────────────────────────────
Total migrations defined: 2

Defined migrations:
  1. 001_initial_schema
  2. 002_indexes
```

### Create a New Migration

```bash
npm run migrate:create <name>
```

Creates a new migration with the next sequential number.

**Example:**

```bash
npm run migrate:create add_entry_archived_field
```

This will:

1. Scan existing migrations to find the next number
2. Create migration ID: `003_add_entry_archived_field`
3. Add migration template to `migrations.ts`

**Important:** Migration names must use only letters, numbers, and underscores.

### Create Schema Snapshot

```bash
npm run migrate:snapshot
```

Creates a timestamped snapshot of the current `schema.sql` file.

**When to snapshot:**

- Before releasing a new version
- After completing a migration
- When making significant schema changes

**Example output:**

```
Schema Snapshot Created
────────────────────────────────────────────────────────────
Version: 1.0.0
File: src/main/database/snapshots/schema-v1.0.0-2025-11-17.sql
```

Snapshots are stored in `src/main/database/snapshots/` and committed to git for historical reference.

## Creating a Migration

### Step 1: Create Migration Template

```bash
npm run migrate:create add_favorite_flag
```

This adds a new migration to `src/main/database/migrations.ts`:

```typescript
{
  id: '003_add_favorite_flag',
  up: (db) => {
    // TODO: Add your migration code here
  },
}
```

### Step 2: Implement the Migration

Edit `src/main/database/migrations.ts` and implement the `up` function:

```typescript
{
  id: '003_add_favorite_flag',
  up: (db) => {
    db.run('ALTER TABLE journals ADD COLUMN is_favorite INTEGER DEFAULT 0');
    db.run('CREATE INDEX IF NOT EXISTS idx_journals_favorite ON journals(is_favorite)');
  },
}
```

### Step 3: Update TypeScript Types

Update the corresponding types in `src/shared/types/`:

```typescript
export interface Journal {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_favorite: boolean; // New field
  created_at: string;
  updated_at: string;
}
```

### Step 4: Test the Migration

```bash
npm test -- migrations.test.ts
```

Add a test case for your migration:

```typescript
it('should add is_favorite column to journals table', () => {
  runMigrations(db);

  const result = db.exec(`PRAGMA table_info(journals)`);
  const columns = result[0].values.map((row) => row[1]);

  expect(columns).toContain('is_favorite');
});
```

### Step 5: Update Schema File (Optional)

If this represents the "current" schema, update `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_favorite INTEGER DEFAULT 0,  -- Added
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Step 6: Create Snapshot

```bash
npm run migrate:snapshot
```

### Step 7: Run the App

Start the app to apply the migration:

```bash
npm start
```

The migration runs automatically on startup and is recorded in the `schema_migrations` table.

## Migration Best Practices

### 1. Make Migrations Idempotent

Always use `IF NOT EXISTS` or `IF EXISTS` to make migrations safe to re-run:

```typescript
// Good
db.run('CREATE INDEX IF NOT EXISTS idx_name ON table(column)');
db.run('ALTER TABLE journals ADD COLUMN IF NOT EXISTS new_field TEXT');

// Avoid (will fail if re-run)
db.run('CREATE INDEX idx_name ON table(column)');
```

### 2. Use Transactions

The migration runner automatically wraps each migration in a transaction, so partial failures roll back:

```typescript
{
  id: '004_multi_step_migration',
  up: (db) => {
    // All steps execute in one transaction
    db.run('ALTER TABLE journals ADD COLUMN field1 TEXT');
    db.run('ALTER TABLE journals ADD COLUMN field2 TEXT');
    db.run('CREATE INDEX IF NOT EXISTS idx_field1 ON journals(field1)');
    // If any step fails, all changes are rolled back
  },
}
```

### 3. Never Modify Existing Migrations

Once a migration is deployed, **never modify it**. Instead, create a new migration to fix issues:

```typescript
// If migration 003 had a bug, don't edit it!
// Instead, create migration 004 to fix it:
{
  id: '004_fix_favorite_default',
  up: (db) => {
    db.run('UPDATE journals SET is_favorite = 0 WHERE is_favorite IS NULL');
  },
}
```

### 4. Test with Real Data

Before deploying, test migrations with a copy of production data:

1. Copy `esquisse.db` from `userData` directory
2. Run app in dev mode with copied database
3. Verify migration applies correctly
4. Check that old data still works

### 5. Consider Data Migration

When changing data types or structures, migrate existing data:

```typescript
{
  id: '005_migrate_tags_to_json',
  up: (db) => {
    // Add new column
    db.run('ALTER TABLE entries ADD COLUMN tags_json TEXT');

    // Migrate data from old format
    const entries = db.exec('SELECT id, tags FROM entries WHERE tags IS NOT NULL');
    if (entries.length > 0) {
      entries[0].values.forEach(([id, tags]) => {
        const tagsArray = tags.split(',').map(t => t.trim());
        const tagsJson = JSON.stringify(tagsArray);
        db.run('UPDATE entries SET tags_json = ? WHERE id = ?', [tagsJson, id]);
      });
    }

    // Drop old column (optional - can keep for rollback)
    // db.run('ALTER TABLE entries DROP COLUMN tags');
  },
}
```

### 6. Add Indexes for Performance

When adding indexes, always use `IF NOT EXISTS`:

```typescript
{
  id: '006_add_search_indexes',
  up: (db) => {
    db.run('CREATE INDEX IF NOT EXISTS idx_entries_content ON entries(content)');
    db.run('CREATE INDEX IF NOT EXISTS idx_journals_name ON journals(name)');
  },
}
```

## Migration Naming Conventions

Use descriptive, action-oriented names:

✅ **Good:**

- `add_user_preferences_table`
- `add_entry_archived_field`
- `create_search_indexes`
- `migrate_tags_to_json`
- `remove_deprecated_color_field`

❌ **Avoid:**

- `migration_3`
- `update`
- `fix`
- `new_stuff`

## Troubleshooting

### Migration Fails on Startup

If a migration fails:

1. **Check the error message** in the console
2. **Fix the migration** in `migrations.ts`
3. **Delete the failed migration record** from `schema_migrations` table (if it was recorded)
4. **Restart the app**

### Reset Database (Development Only)

To start fresh in development:

```bash
# Close the app first
rm ~/Library/Application\ Support/Esquisse/esquisse.db  # macOS
rm ~/.config/Esquisse/esquisse.db                       # Linux
rm %APPDATA%\Esquisse\esquisse.db                       # Windows
```

Next startup will create a new database with all migrations applied.

### Check Applied Migrations

To see which migrations have been applied to a database:

```sql
SELECT id, applied_at FROM schema_migrations ORDER BY applied_at;
```

You can inspect the database file using `sqlite3` or any SQLite viewer:

```bash
sqlite3 ~/Library/Application\ Support/Esquisse/esquisse.db
> SELECT * FROM schema_migrations;
```

## Schema Snapshots

### Purpose

Snapshots serve as:

- **Historical record** of schema at each version
- **Documentation** for what changed between versions
- **Reference** for generating migrations

### Snapshot Workflow

1. **Before Release:** Create snapshot

   ```bash
   npm run migrate:snapshot
   ```

2. **Commit to Git:**

   ```bash
   git add src/main/database/snapshots/
   git commit -m "chore: snapshot schema for v1.1.0"
   ```

3. **Tag Release:**
   ```bash
   git tag v1.1.0
   ```

### Comparing Snapshots

To see what changed between versions:

```bash
diff src/main/database/snapshots/schema-v1.0.0-2025-11-17.sql \
     src/main/database/snapshots/schema-v1.1.0-2025-12-01.sql
```

## Advanced Topics

### Rollback Migrations

Currently, the system only supports forward migrations (`up`). If you need to roll back:

1. **Preferred:** Create a new forward migration that undoes the change
2. **Alternative:** Manually edit the database and remove the migration record

Example of "rollback via forward migration":

```typescript
{
  id: '007_rollback_favorite_flag',
  up: (db) => {
    db.run('DROP INDEX IF EXISTS idx_journals_favorite');
    // Note: SQLite doesn't support DROP COLUMN directly
    // You'd need to recreate the table without the column
  },
}
```

### Complex Migrations

For very complex migrations (e.g., major schema restructuring):

1. **Create multiple smaller migrations** instead of one large one
2. **Test each step** independently
3. **Consider a maintenance window** for production deployments

### Migration Performance

For large databases:

- **Avoid full table scans** in data migrations
- **Add indexes after** bulk data changes
- **Use batch updates** instead of row-by-row

## Integration with Application

Migrations run automatically during `initializeDatabase()` in `src/main/database/index.ts`:

```typescript
export async function initializeDatabase(): Promise<Database> {
  // ... load database ...
  db.run('PRAGMA foreign_keys = ON');
  runMigrations(db); // <-- Migrations run here
  flushDatabaseSync();
  return db;
}
```

This ensures:

- Migrations run before any queries
- Database is always at the latest schema version
- Errors prevent app startup (fail fast)

## See Also

- [REFACTORING.md](./REFACTORING.md) - Overall refactoring roadmap
- [CLAUDE.md](../CLAUDE.md) - Engineering guidelines
- [migrations.ts](../src/main/database/migrations.ts) - Migration definitions
- [migrations.test.ts](../src/main/database/migrations.test.ts) - Migration tests
