#!/usr/bin/env node

/**
 * Database Reset & Seed CLI tool for Esquisse
 *
 * Usage:
 *   npm run db:reset              - Reset database (delete and recreate)
 *   npm run db:seed               - Seed database with small test data (8 entries)
 *   npm run db:seed -- --large    - Seed database with large test data (300 entries)
 *   npm run db:reset-seed         - Reset and seed in one command
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const os = require('os');
const { faker } = require('@faker-js/faker');

// Determine database path
const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'esquisse');
const DB_PATH = path.join(userDataPath, 'esquisse.db');
const SCHEMA_PATH = path.join(__dirname, '../src/main/database/schema.sql');

// Parse command line flags
const isLargeDataset = process.argv.includes('--large');

// Tag pools for variety
const TAG_POOLS = {
  work: ['work', 'meetings', 'projects', 'career', 'deadlines', 'team'],
  personal: ['personal', 'family', 'friends', 'home', 'hobbies'],
  health: ['health', 'fitness', 'wellness', 'meditation', 'exercise'],
  learning: ['learning', 'reading', 'courses', 'skills', 'growth'],
  creative: ['creative', 'writing', 'music', 'art', 'photography'],
  travel: ['travel', 'adventure', 'exploration', 'vacation'],
  food: ['food', 'cooking', 'recipes', 'dining'],
  reflection: ['reflection', 'gratitude', 'mindfulness', 'journal'],
  goals: ['goals', 'planning', 'achievement', 'progress'],
  tech: ['coding', 'technology', 'software', 'programming'],
};

// Content templates for natural variation
const CONTENT_THEMES = {
  reflection: [
    'Thinking about {topic} today',
    'Reflecting on {topic}',
    'Today I realized {insight}',
    'Been contemplating {topic} lately',
  ],
  work: [
    'Working on {project}',
    'Had a meeting about {topic}',
    'Project update: {progress}',
    'Collaborating with the team on {project}',
  ],
  personal: [
    'Spent quality time {activity}',
    'Had a wonderful day {activity}',
    'Feeling {emotion} about {topic}',
    'Enjoyed {activity} today',
  ],
  learning: [
    'Learning about {topic}',
    'Reading about {subject}',
    'Discovered {insight}',
    'Studying {subject} has been fascinating',
  ],
  goals: [
    'Planning to {action}',
    'Goal for this month: {goal}',
    'Making progress on {goal}',
    'Want to achieve {goal}',
  ],
};

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
 * Generate a random selection of tags
 */
function generateTags() {
  const tagCount = faker.number.int({ min: 0, max: 4 });
  if (tagCount === 0) return [];

  const allTags = Object.values(TAG_POOLS).flat();
  const selectedTags = [];

  for (let i = 0; i < tagCount; i++) {
    const tag = faker.helpers.arrayElement(allTags);
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }

  return selectedTags;
}

/**
 * Generate realistic journal entry title
 */
function generateTitle() {
  const titleTypes = [
    () => faker.lorem.words({ min: 2, max: 5 }),
    () => `${faker.word.adjective()} ${faker.word.noun()}`,
    () => `Thoughts on ${faker.word.noun()}`,
    () => `${faker.date.month()} ${faker.word.noun()}`,
  ];

  const title = faker.helpers.arrayElement(titleTypes)();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Generate rich HTML content with varying length
 */
function generateContent(lengthType = 'medium') {
  const paragraphCounts = {
    short: { min: 1, max: 2 },
    medium: { min: 3, max: 5 },
    long: { min: 6, max: 10 },
  };

  const config = paragraphCounts[lengthType] || paragraphCounts.medium;
  const numParagraphs = faker.number.int(config);

  const paragraphs = [];

  for (let i = 0; i < numParagraphs; i++) {
    const paragraphLength = faker.number.int({ min: 2, max: 5 });
    let paragraph = faker.lorem.sentences(paragraphLength);

    // Add occasional formatting
    if (faker.datatype.boolean(0.3)) {
      // 30% chance of bold
      const words = paragraph.split(' ');
      const boldIndex = faker.number.int({ min: 0, max: words.length - 2 });
      words[boldIndex] = `<strong>${words[boldIndex]}</strong>`;
      paragraph = words.join(' ');
    }

    if (faker.datatype.boolean(0.2)) {
      // 20% chance of italic
      const words = paragraph.split(' ');
      const italicIndex = faker.number.int({ min: 0, max: words.length - 2 });
      words[italicIndex] = `<em>${words[italicIndex]}</em>`;
      paragraph = words.join(' ');
    }

    paragraphs.push(`<p>${paragraph}</p>`);

    // Occasionally add a list
    if (i > 0 && faker.datatype.boolean(0.15) && i < numParagraphs - 1) {
      const listItems = faker.number.int({ min: 2, max: 4 });
      const listType = faker.helpers.arrayElement(['ul', 'ol']);
      const items = Array.from({ length: listItems }, () => `<li>${faker.lorem.sentence()}</li>`);
      paragraphs.push(`<${listType}>${items.join('')}</${listType}>`);
    }

    // Occasionally add a heading
    if (i > 0 && faker.datatype.boolean(0.1) && i < numParagraphs - 1) {
      paragraphs.push(`<h3>${faker.lorem.words({ min: 2, max: 4 })}</h3>`);
    }
  }

  return paragraphs.join('');
}

/**
 * Generate dates distributed across a specific month and year
 */
function generateMonthDates(year, month, count) {
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < count; i++) {
    const day = faker.number.int({ min: 1, max: daysInMonth });
    const hour = faker.number.int({ min: 0, max: 23 });
    const minute = faker.number.int({ min: 0, max: 59 });

    const date = new Date(year, month - 1, day, hour, minute);
    dates.push(date.toISOString());
  }

  // Sort chronologically
  return dates.sort();
}

/**
 * Choose content length type with weighted distribution
 */
function chooseLengthType() {
  const rand = Math.random();
  if (rand < 0.2) return 'short'; // 20%
  if (rand < 0.8) return 'medium'; // 60%
  return 'long'; // 20%
}

/**
 * Choose entry status with weighted distribution
 */
function chooseStatus() {
  const rand = Math.random();
  if (rand < 0.9) return 'active'; // 90%
  if (rand < 0.95) return 'draft'; // 5%
  return 'archived'; // 5%
}

/**
 * Generate a single journal entry
 */
function generateEntry(date) {
  return {
    title: generateTitle(),
    content: generateContent(chooseLengthType()),
    tags: generateTags(),
    isFavorite: faker.datatype.boolean(0.3), // 30% favorites
    status: chooseStatus(),
    createdAt: date,
  };
}

/**
 * Seed database with small dataset (8 entries)
 */
function seedDatabaseSmall(db, journalId) {
  const entries = [
    {
      title: 'Morning Thoughts',
      content:
        '<p>Started the day with a cup of coffee and some reflection. The sunrise was beautiful today.</p>',
      tags: ['morning', 'reflection'],
      isFavorite: true,
      status: 'active',
      createdAt: getDateOffset(-7),
    },
    {
      title: 'Project Planning',
      content:
        '<p>Working on the new feature implementation. Need to:</p><ul><li>Design the database schema</li><li>Create the API endpoints</li><li>Build the UI components</li></ul>',
      tags: ['work', 'planning'],
      isFavorite: false,
      status: 'active',
      createdAt: getDateOffset(-6),
    },
    {
      title: 'Workout Session',
      content:
        '<p>Hit the gym today. Completed 30 minutes of cardio and strength training. Feeling energized!</p>',
      tags: ['fitness', 'health'],
      isFavorite: true,
      status: 'active',
      createdAt: getDateOffset(-5),
    },
    {
      title: 'Book Notes',
      content:
        '<p>Reading "Atomic Habits" by James Clear. Key takeaway: Small changes compound into remarkable results over time.</p>',
      tags: ['reading', 'learning'],
      isFavorite: false,
      status: 'active',
      createdAt: getDateOffset(-4),
    },
    {
      title: 'Team Meeting',
      content:
        '<p>Productive meeting with the team. Discussed Q4 goals and aligned on priorities. Everyone is excited about the roadmap.</p>',
      tags: ['work', 'meetings'],
      isFavorite: false,
      status: 'active',
      createdAt: getDateOffset(-3),
    },
    {
      title: 'Weekend Plans',
      content:
        '<p>Planning a hiking trip this weekend. Weather looks perfect. Can not wait to disconnect and enjoy nature.</p>',
      tags: ['personal', 'outdoors'],
      isFavorite: true,
      status: 'active',
      createdAt: getDateOffset(-2),
    },
    {
      title: 'Coding Session',
      content:
        '<p>Spent the evening working on a side project. Implemented authentication and user profiles. Making good progress!</p>',
      tags: ['coding', 'tech'],
      isFavorite: false,
      status: 'active',
      createdAt: getDateOffset(-1),
    },
    {
      title: 'Daily Reflection',
      content:
        '<p>Grateful for a productive week. Learned new skills, connected with friends, and made progress on personal goals.</p>',
      tags: ['reflection', 'gratitude'],
      isFavorite: true,
      status: 'active',
      createdAt: getDateOffset(0),
    },
  ];

  return entries;
}

/**
 * Seed database with large dataset (300 entries)
 */
function seedDatabaseLarge(db, journalId) {
  console.log('Generating 300 entries across November and December (2020-2024)...');

  const entries = [];
  const years = [2020, 2021, 2022, 2023, 2024];
  const months = [11, 12]; // November, December
  const entriesPerMonth = 30;

  let generated = 0;
  const total = years.length * months.length * entriesPerMonth;

  years.forEach((year) => {
    months.forEach((month) => {
      const dates = generateMonthDates(year, month, entriesPerMonth);
      dates.forEach((date) => {
        entries.push(generateEntry(date));
        generated++;
        if (generated % 50 === 0) {
          process.stdout.write(`\r✓ Generated ${generated}/${total} entries...`);
        }
      });
    });
  });

  process.stdout.write(`\r✓ Generated ${total}/${total} entries    \n`);

  return entries;
}

/**
 * Seed the database with test data
 */
function seedDatabase() {
  const datasetType = isLargeDataset ? 'LARGE' : 'SMALL';
  console.log(`\n🌱 Seeding Database (${datasetType} dataset)`);
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

    // Generate entries based on dataset size
    const startTime = Date.now();
    const entries = isLargeDataset
      ? seedDatabaseLarge(db, journalId)
      : seedDatabaseSmall(db, journalId);

    // Insert entries
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
        entry.status,
        entry.isFavorite ? 1 : 0,
        entry.createdAt,
        entry.createdAt
      );
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Inserted ${entries.length} entries in ${elapsed}s`);
    console.log(`✓ ${entries.filter((e) => e.isFavorite).length} entries marked as favorites`);
    console.log(`✓ ${entries.filter((e) => e.status === 'active').length} active entries`);
    console.log(`✓ ${entries.filter((e) => e.status === 'draft').length} draft entries`);
    console.log(`✓ ${entries.filter((e) => e.status === 'archived').length} archived entries`);

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
    console.log('  npm run db:reset              - Reset database (delete and recreate)');
    console.log('  npm run db:seed               - Seed database with small data (8 entries)');
    console.log('  npm run db:seed -- --large    - Seed database with large data (300 entries)');
    console.log('  npm run db:reset-seed         - Reset and seed in one command\n');
    process.exit(1);
}
