#!/usr/bin/env node

/**
 * Database Reset & Seed CLI tool for Esquisse
 *
 * Usage:
 *   npm run db:reset        - Reset database (delete and recreate)
 *   npm run db:seed         - Seed database with test data
 *   npm run db:reset-seed   - Reset and seed in one command
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const os = require('os');

// Determine database path
const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'esquisse');
const DB_PATH = path.join(userDataPath, 'esquisse.db');
const SCHEMA_PATH = path.join(__dirname, '../src/main/database/schema.sql');

/**
 * Ensure user data directory exists
 */
function ensureUserDataDir() {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    console.log(`✓ Created user data directory: ${userDataPath}`);
  }
}

/**
 * Reset the database (delete and recreate)
 */
function resetDatabase() {
  console.log('\n🔄 Resetting Database');
  console.log('─'.repeat(60));

  ensureUserDataDir();

  // Delete existing database files
  const dbFiles = [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`];
  let deletedCount = 0;

  dbFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      deletedCount++;
    }
  });

  console.log(`✓ Deleted ${deletedCount} database file(s)`);

  // Create new database with schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`❌ Error: Schema file not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const db = new Database(DB_PATH);

  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Execute schema
    db.exec(schema);

    // Create migrations table and mark all migrations as applied
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    // Import migrations to mark them as applied
    const migrationsPath = path.join(__dirname, '../src/main/database/migrations.ts');
    const migrationsContent = fs.readFileSync(migrationsPath, 'utf-8');

    // Extract migration IDs
    const migrationIds = [];
    const regex = /id:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(migrationsContent)) !== null) {
      migrationIds.push(match[1]);
    }

    // Insert all migration records
    const insertStmt = db.prepare(
      `INSERT INTO schema_migrations (id, applied_at) VALUES (?, datetime('now'))`
    );

    migrationIds.forEach((id) => {
      insertStmt.run(id);
    });

    console.log(`✓ Created fresh database at: ${DB_PATH}`);
    console.log(`✓ Applied ${migrationIds.length} migration(s)`);

    db.close();
  } catch (error) {
    db.close();
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }

  console.log('✓ Database reset complete\n');
}

/**
 * Seed the database with test data
 */
function seedDatabase() {
  console.log('\n🌱 Seeding Database');
  console.log('─'.repeat(60));

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Error: Database not found. Run db:reset first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    db.pragma('foreign_keys = ON');

    // Create test journal
    const journalId = 'test-journal-1';
    const now = new Date().toISOString();

    db.prepare(
      `INSERT OR REPLACE INTO journals (id, name, description, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(journalId, 'Personal Journal', 'My test journal', '#3b82f6', now, now);

    console.log('✓ Created test journal: Personal Journal');

    // Sample entry data with variety
    const entries = [
      {
        title: 'Morning Thoughts',
        content: '<p>Started the day with a cup of coffee and some reflection. The sunrise was beautiful today.</p>',
        tags: ['morning', 'reflection'],
        isFavorite: true,
        createdAt: getDateOffset(-7),
      },
      {
        title: 'Project Planning',
        content:
          '<p>Working on the new feature implementation. Need to:</p><ul><li>Design the database schema</li><li>Create the API endpoints</li><li>Build the UI components</li></ul>',
        tags: ['work', 'planning'],
        isFavorite: false,
        createdAt: getDateOffset(-6),
      },
      {
        title: 'Workout Session',
        content: '<p>Hit the gym today. Completed 30 minutes of cardio and strength training. Feeling energized!</p>',
        tags: ['fitness', 'health'],
        isFavorite: true,
        createdAt: getDateOffset(-5),
      },
      {
        title: 'Book Notes',
        content:
          '<p>Reading "Atomic Habits" by James Clear. Key takeaway: Small changes compound into remarkable results over time.</p>',
        tags: ['reading', 'self-improvement'],
        isFavorite: false,
        createdAt: getDateOffset(-4),
      },
      {
        title: 'Team Meeting',
        content:
          '<p>Productive meeting with the team. Discussed Q4 goals and aligned on priorities. Everyone is excited about the roadmap.</p>',
        tags: ['work', 'meetings'],
        isFavorite: false,
        createdAt: getDateOffset(-3),
      },
      {
        title: 'Weekend Plans',
        content: '<p>Planning a hiking trip this weekend. Weather looks perfect. Can not wait to disconnect and enjoy nature.</p>',
        tags: ['personal', 'outdoors'],
        isFavorite: true,
        createdAt: getDateOffset(-2),
      },
      {
        title: 'Coding Session',
        content:
          '<p>Spent the evening working on a side project. Implemented authentication and user profiles. Making good progress!</p>',
        tags: ['coding', 'side-project'],
        isFavorite: false,
        createdAt: getDateOffset(-1),
      },
      {
        title: 'Daily Reflection',
        content:
          '<p>Grateful for a productive week. Learned new skills, connected with friends, and made progress on personal goals.</p>',
        tags: ['reflection', 'gratitude'],
        isFavorite: true,
        createdAt: getDateOffset(0),
      },
    ];

    const insertEntry = db.prepare(`
      INSERT INTO entries (id, journal_id, title, content, tags, status, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    entries.forEach((entry, index) => {
      const entryId = `test-entry-${index + 1}`;
      insertEntry.run(
        entryId,
        journalId,
        entry.title,
        entry.content,
        JSON.stringify(entry.tags),
        'active',
        entry.isFavorite ? 1 : 0,
        entry.createdAt,
        entry.createdAt
      );
    });

    console.log(`✓ Created ${entries.length} test entries`);
    console.log(`✓ ${entries.filter((e) => e.isFavorite).length} entries marked as favorites`);

    // Create some settings
    const settings = [
      { key: 'theme', value: 'system' },
      { key: 'language', value: 'en' },
      { key: 'fontSize', value: '16' },
      { key: 'autoSave', value: 'true' },
      { key: 'autoSaveInterval', value: '30' },
    ];

    const insertSetting = db.prepare(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`
    );

    settings.forEach((setting) => {
      insertSetting.run(setting.key, setting.value, now);
    });

    console.log(`✓ Created ${settings.length} default settings`);

    db.close();
    console.log('✓ Database seeding complete\n');
  } catch (error) {
    db.close();
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

/**
 * Get ISO date string with offset from today
 */
function getDateOffset(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

// Command router
const command = process.argv[2];

switch (command) {
  case 'reset':
    resetDatabase();
    break;

  case 'seed':
    seedDatabase();
    break;

  case 'reset-seed':
    resetDatabase();
    seedDatabase();
    break;

  default:
    console.log('\nEsquisse Database Reset & Seed CLI\n');
    console.log('Usage:');
    console.log('  npm run db:reset        - Reset database (delete and recreate)');
    console.log('  npm run db:seed         - Seed database with test data');
    console.log('  npm run db:reset-seed   - Reset and seed in one command\n');
    process.exit(1);
}
