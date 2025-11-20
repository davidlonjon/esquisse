# Database Transaction Helpers

Comprehensive guide to using transaction helpers in Esquisse for ensuring data integrity and atomic operations.

## Overview

Transactions ensure that multiple database operations either all succeed together or all fail together. This prevents partial updates that could leave your database in an inconsistent state.

**Key Benefits:**

- **Data Integrity**: All-or-nothing execution of multi-step operations
- **Automatic Rollback**: Errors automatically undo all changes
- **Nested Operations**: Savepoints allow partial rollback within transactions
- **Type Safety**: Full TypeScript support with generics

## Quick Start

### Basic Transaction

```typescript
import { withTransaction } from '../database';

// Simple transaction - commits if successful, rolls back on error
const journal = withTransaction((db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
  return { id, name };
});
```

### Multi-Step Transaction

```typescript
// All operations commit together, or all roll back on error
withTransaction((db) => {
  // Step 1: Create journal
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [journalId, 'My Journal']);

  // Step 2: Create entries for that journal
  db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
    entryId1,
    journalId,
    'Entry 1',
  ]);
  db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
    entryId2,
    journalId,
    'Entry 2',
  ]);

  // All 3 inserts commit together, or all roll back if any fails
});
```

## API Reference

### withTransaction

Execute a synchronous operation within a transaction.

```typescript
function withTransaction<T>(
  fn: (database: Database) => T,
  options?: TransactionOptions & { database?: Database }
): T;
```

**Parameters:**

- `fn`: Function to execute within the transaction
- `options`: Optional configuration
  - `mode`: Transaction isolation level (`'DEFERRED'` | `'IMMEDIATE'` | `'EXCLUSIVE'`)
  - `autoSave`: Whether to save database to disk after commit (default: `true`)
  - `database`: Optional database instance (for testing)

**Returns:** The result of the function

**Example:**

```typescript
const result = withTransaction(
  (db) => {
    db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
    return { id, name };
  },
  {
    mode: 'IMMEDIATE', // Default
    autoSave: true, // Default
  }
);
```

---

### withTransactionAsync

Execute an async operation within a transaction.

```typescript
async function withTransactionAsync<T>(
  fn: (database: Database) => Promise<T>,
  options?: TransactionOptions & { database?: Database }
): Promise<T>;
```

**Note:** While sql.js operations are synchronous, this helper allows wrapping operations that include async business logic.

**Example:**

```typescript
const result = await withTransactionAsync(async (db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

  // Async validation or external API call
  await validateJournalName(name);

  return { id, name };
});
```

---

### savepoint

Create a savepoint within the current transaction for nested transaction support.

```typescript
function savepoint(database: Database, name?: string): Savepoint;
```

**Returns:** Savepoint controller with `release()` and `rollback()` methods

**Example:**

```typescript
withTransaction((db) => {
  // Outer operation
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

  // Create savepoint
  const sp = savepoint(db, 'entry_insert');
  try {
    db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
      entryId,
      id,
      'Content',
    ]);
    sp.release(); // Commit the savepoint
  } catch (error) {
    sp.rollback(); // Rollback only the entry insert
    // Journal insert is still active
  }
});
```

---

### withSavepoint

Execute an operation within a savepoint with automatic lifecycle management.

```typescript
function withSavepoint<T>(database: Database, fn: (database: Database) => T, name?: string): T;
```

**Example:**

```typescript
withTransaction((db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

  // Try to add entry - rollback savepoint if it fails
  try {
    withSavepoint(db, (db) => {
      db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
        entryId,
        id,
        'Content',
      ]);
      if (!isValidContent('Content')) {
        throw new Error('Invalid content');
      }
    });
  } catch (error) {
    // Entry insert rolled back, journal insert preserved
    console.log('Entry creation failed, continuing without it');
  }
});
```

---

### withSavepointAsync

Async version of `withSavepoint`.

```typescript
async function withSavepointAsync<T>(
  database: Database,
  fn: (database: Database) => Promise<T>,
  name?: string
): Promise<T>;
```

**Example:**

```typescript
await withTransactionAsync(async (db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

  await withSavepointAsync(db, async (db) => {
    db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
      entryId,
      id,
      'Content',
    ]);
    await asyncValidation();
  });
});
```

## Transaction Modes

SQLite supports three transaction modes that control locking behavior:

| Mode                                 | Lock Timing                         | Use Case                               |
| ------------------------------------ | ----------------------------------- | -------------------------------------- |
| **DEFERRED** (default for SQLite)    | Lock acquired on first read/write   | Read-mostly workloads                  |
| **IMMEDIATE** (default for Esquisse) | Write lock acquired immediately     | Write operations, prevents conflicts   |
| **EXCLUSIVE**                        | Exclusive lock acquired immediately | Critical operations, maximum isolation |

**Recommendation:** Use `IMMEDIATE` (the default) for most write operations to avoid lock upgrade conflicts.

```typescript
withTransaction(
  (db) => {
    // Critical operation requiring exclusive access
    db.run('UPDATE settings SET value = ? WHERE key = ?', [newValue, key]);
  },
  { mode: 'EXCLUSIVE' }
);
```

## Common Patterns

### 1. Create Related Entities

```typescript
// Create journal with initial entries - all or nothing
withTransaction((db) => {
  const journalId = randomUUID();

  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [journalId, 'My Journal']);

  for (const content of initialEntries) {
    const entryId = randomUUID();
    db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
      entryId,
      journalId,
      content,
    ]);
  }

  return journalId;
});
```

### 2. Update with Audit Trail

```typescript
withTransaction((db) => {
  // Update record
  db.run('UPDATE journals SET name = ? WHERE id = ?', [newName, journalId]);

  // Log the change
  db.run('INSERT INTO audit_log (entity_type, entity_id, action, timestamp) VALUES (?, ?, ?, ?)', [
    'journal',
    journalId,
    'update',
    new Date().toISOString(),
  ]);
});
```

### 3. Delete with Cascade Simulation

```typescript
withTransaction((db) => {
  // Delete related entries first
  db.run('DELETE FROM entries WHERE journal_id = ?', [journalId]);

  // Then delete journal
  db.run('DELETE FROM journals WHERE id = ?', [journalId]);

  // Both deletions committed together
});
```

### 4. Batch Import with Savepoints

```typescript
withTransaction((db) => {
  let successCount = 0;
  let failureCount = 0;

  for (const item of importData) {
    try {
      withSavepoint(db, (db) => {
        db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [item.id, item.name]);
        successCount++;
      });
    } catch (error) {
      failureCount++;
      // Savepoint rolled back, continue with next item
    }
  }

  console.log(`Imported ${successCount} items, ${failureCount} failed`);
});
```

### 5. Repository Pattern Integration

```typescript
class JournalRepository {
  create(input: CreateJournalInput): Journal {
    return withTransaction((db) => {
      const id = randomUUID();
      const now = new Date().toISOString();

      db.run(
        `INSERT INTO journals (id, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, input.name, input.description ?? null, now, now]
      );

      return {
        id,
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      };
    });
  }
}
```

## Error Handling

All errors within transactions are automatically handled:

1. **Automatic Rollback**: If any error occurs, the transaction is rolled back
2. **Error Propagation**: The original error is re-thrown after rollback
3. **Clean State**: Database is left in a consistent state

```typescript
try {
  withTransaction((db) => {
    db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);

    if (someCondition) {
      throw new Error('Validation failed');
    }

    db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
      entryId,
      id,
      'Content',
    ]);
  });
} catch (error) {
  // Both inserts were rolled back
  console.error('Transaction failed:', error);
}
```

### Custom Error Types

Custom errors are preserved through rollback:

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  withTransaction((db) => {
    db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
    throw new ValidationError('Invalid name', 'INVALID_NAME');
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.code);
  }
}
```

## Testing

### Unit Testing with Transactions

```typescript
import { getTestDatabase } from '@test/helpers/database.helper';
import { withTransaction } from './transactions';

it('should commit transaction on success', () => {
  const db = getTestDatabase();

  const result = withTransaction(
    (txDb) => {
      txDb.run("INSERT INTO journals (id, name) VALUES ('j1', 'Test')");
      return { id: 'j1' };
    },
    { autoSave: false, database: db }
  );

  expect(result.id).toBe('j1');

  // Verify commit
  const stmt = db.prepare('SELECT * FROM journals WHERE id = ?');
  stmt.bind(['j1']);
  expect(stmt.step()).toBe(true);
  stmt.free();
});
```

## Best Practices

### ✅ DO

- Use transactions for multi-step operations
- Keep transactions short and focused
- Use `IMMEDIATE` mode for write operations (the default)
- Use savepoints for partial rollback scenarios
- Let errors bubble up for automatic rollback
- Disable `autoSave` in tests for performance

### ❌ DON'T

- Nest `withTransaction` calls (use savepoints instead)
- Perform long-running operations inside transactions
- Catch errors without re-throwing (prevents rollback)
- Use transactions for single-statement operations
- Hold transactions open while waiting for user input

## Performance Considerations

1. **Transaction Overhead**: Minimal for sql.js (in-memory)
2. **Lock Duration**: Keep transactions brief to avoid blocking
3. **Batch Operations**: Use single transaction for bulk inserts
4. **Savepoints**: Slight overhead, use only when needed
5. **Auto-Save**: Disabled in tests (`autoSave: false`) for speed

## Migration from Direct DB Access

**Before** (no transaction):

```typescript
db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [entryId, id, 'Content']);
// ⚠️ If second insert fails, journal exists without entry
```

**After** (with transaction):

```typescript
withTransaction((db) => {
  db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
  db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [
    entryId,
    id,
    'Content',
  ]);
}); // ✅ Both succeed or both fail
```

## Further Reading

- [SQLite Transaction Documentation](https://www.sqlite.org/lang_transaction.html)
- [SQLite Savepoint Documentation](https://www.sqlite.org/lang_savepoint.html)
- [sql.js Documentation](https://sql.js.org/)
- [Repository Pattern Guide](../src/main/domain/README.md)

---

**Last Updated:** November 2025
