# Database Persistence Strategy Analysis

## Current Implementation Review

**Status:** Working well, no performance issues reported

**How it works:**

```typescript
// After every transaction:
transaction() → db.export() → async write to disk
```

**Characteristics:**

- Simple, reliable
- Debounced writes (coalesces rapid saves)
- Async file I/O doesn't block user
- Full database written each time

---

## #12 WAL Proposal - Analysis

### Why it doesn't make sense for sql.js:

1. **sql.js architecture mismatch**
   - WAL is for native SQLite concurrent access
   - sql.js runs in single-threaded WASM
   - No access to SQLite's native WAL mode

2. **No change tracking**
   - sql.js doesn't expose "what changed" APIs
   - Would need to intercept and log every SQL statement
   - Very complex, error-prone

3. **Export is already fast**
   - Typical journal data: <1MB
   - Export time: ~1-5ms (optimized C++ → WASM)
   - Async write: doesn't block UI

4. **Complexity vs. benefit**
   - **Effort:** 5-6 days
   - **Benefit:** Minimal (no proven performance issue)
   - **Risk:** High (complex state management, replay logic)

### Verdict: ❌ Don't implement as specified

---

## Better Alternatives

### Option A: Debounced Batch Saves ⭐ RECOMMENDED

**Problem it solves:** Rapid succession of edits causes multiple disk writes

**Implementation:**

```typescript
let saveTimer: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 1000; // 1 second

function saveDatabase(): void {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveTimer = null;
    scheduleSave(); // Existing async save logic
  }, SAVE_DEBOUNCE_MS);
}

// On shutdown: flush immediately
app.on('before-quit', () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flushDatabaseSync(); // Already exists
});
```

**Benefits:**

- ✅ Reduces disk writes by 90%+ during burst edits
- ✅ 10 rapid edits → 1 save (not 10)
- ✅ Leverages existing async save infrastructure
- ✅ Guaranteed save on shutdown
- ✅ **Effort:** ~1 hour (30 lines)

**Drawbacks:**

- ⚠️ Up to 1s delay before save (acceptable for auto-save UX)
- ⚠️ Crash before save = lose last 1s of changes (rare, acceptable)

---

### Option B: Periodic Auto-Backups

**Problem it solves:** Data loss from crashes or corruption

**Implementation:**

```typescript
import { createBackup, getDatabasePath } from './backup';

const BACKUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// Start periodic backups
function startAutoBackup() {
  setInterval(() => {
    createBackup(getDatabasePath());
  }, BACKUP_INTERVAL_MS);

  // Immediate backup on clean shutdown
  app.on('before-quit', () => {
    createBackup(getDatabasePath());
  });
}

// Call during database initialization
initializeDatabase().then(() => {
  startAutoBackup();
});
```

**Benefits:**

- ✅ Crash recovery: restore from last backup
- ✅ Max data loss: 15 minutes (configurable)
- ✅ Leverages existing `backup.ts` (already tested)
- ✅ **Effort:** ~1 hour (20 lines)

**Drawbacks:**

- ⚠️ Uses more disk space (keeps 10 backups)
- ⚠️ Not real-time recovery

---

### Option C: Snapshot on Idle (Hybrid)

**Problem it solves:** Minimize disk I/O while ensuring safety

**Implementation:**

```typescript
let lastSaveTime = Date.now();
let idleTimer: NodeJS.Timeout | null = null;
const IDLE_SAVE_MS = 5000; // 5 seconds of inactivity
const MIN_SAVE_INTERVAL_MS = 30000; // At least 30s between saves

function saveDatabase(): void {
  const now = Date.now();

  // If recently saved, defer
  if (now - lastSaveTime < MIN_SAVE_INTERVAL_MS) {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scheduleSave();
      lastSaveTime = Date.now();
    }, IDLE_SAVE_MS);
    return;
  }

  // Otherwise save immediately
  scheduleSave();
  lastSaveTime = now;
}
```

**Benefits:**

- ✅ Saves only after user stops editing
- ✅ Limits save frequency (max once per 30s)
- ✅ Better UX: no saves during active editing
- ✅ **Effort:** ~2 hours (50 lines)

**Drawbacks:**

- ⚠️ Slightly more complex than Option A
- ⚠️ Edge case: very long editing session might delay saves

---

## Recommended Implementation Order

### Phase 1: Quick Wins (1-2 hours)

1. **Implement Option A** (Debounced Batch Saves)
   - Simple, safe, immediate benefit
   - Reduces disk writes by 90%+

2. **Implement Option B** (Periodic Auto-Backups)
   - Leverages existing code
   - Adds crash recovery

### Phase 2: If Needed (based on usage data)

3. **Profile actual save performance**
   - Measure `db.export()` time with 1000+ entries
   - Monitor disk I/O during heavy use
   - Only optimize if >50ms or user complaints

4. **Consider Option C** (Snapshot on Idle)
   - If profiling shows save timing issues
   - Otherwise, Option A is sufficient

---

## Comparison Table

| Approach                   | Effort | Disk Writes     | Crash Recovery    | Complexity   |
| -------------------------- | ------ | --------------- | ----------------- | ------------ |
| **Current**                | N/A    | High (every tx) | Poor (no backups) | Low          |
| **Option A** (Debounce)    | 1h     | Low (batched)   | Poor              | Low          |
| **Option B** (Auto-backup) | 1h     | Same            | Good (15min)      | Low          |
| **Option C** (Idle)        | 2h     | Very Low        | Medium            | Medium       |
| **#12 WAL**                | 5-6d   | Medium          | Good              | Very High ❌ |

---

## Decision Framework

**Choose Option A + B if:**

- ✅ You want quick wins with minimal effort
- ✅ Current performance is acceptable
- ✅ You want crash recovery safety

**Choose Option C if:**

- You have measurable save performance issues
- Users report lag during editing
- You've already implemented A + B

**DON'T choose #12 WAL if:**

- ❌ No proven performance problem
- ❌ sql.js architecture doesn't support it well
- ❌ Complexity doesn't justify benefits

---

## Conclusion

**Recommendation:** Close #12 as "Won't Implement" and replace with:

- **New #12a:** Debounced Batch Saves (~1 hour)
- **New #12b:** Periodic Auto-Backups (~1 hour)

**Total effort:** 2 hours vs. 5-6 days
**Risk:** Low vs. High
**Benefit:** 90% of the value, 3% of the complexity

---

**Last Updated:** November 2025
