#!/usr/bin/env node

/**
 * Migration CLI tool for Esquisse
 *
 * Usage:
 *   npm run migrate:create <name>  - Create a new migration file
 *   npm run migrate:status         - Show migration status
 *   npm run migrate:snapshot       - Snapshot current schema
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../src/main/database');
const SNAPSHOTS_DIR = path.join(__dirname, '../src/main/database/snapshots');

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

/**
 * Get next migration number by scanning existing migrations
 */
function getNextMigrationNumber() {
  const migrationsFile = path.join(MIGRATIONS_DIR, 'migrations.ts');
  const content = fs.readFileSync(migrationsFile, 'utf-8');

  // Extract migration IDs using regex
  const migrationIds = [];
  const regex = /id:\s*['"](\d+)_/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    migrationIds.push(parseInt(match[1], 10));
  }

  if (migrationIds.length === 0) {
    return 1;
  }

  return Math.max(...migrationIds) + 1;
}

/**
 * Create a new migration file template
 */
function createMigration(name) {
  if (!name) {
    console.error('Error: Migration name is required');
    console.log('Usage: npm run migrate:create <name>');
    process.exit(1);
  }

  // Validate name (alphanumeric and underscores only)
  if (!/^[a-z0-9_]+$/i.test(name)) {
    console.error('Error: Migration name must contain only letters, numbers, and underscores');
    process.exit(1);
  }

  const migrationNumber = getNextMigrationNumber();
  const paddedNumber = migrationNumber.toString().padStart(3, '0');
  const migrationId = `${paddedNumber}_${name}`;

  console.log(`\nCreating migration: ${migrationId}`);
  console.log('─'.repeat(60));

  // Read current migrations.ts
  const migrationsFile = path.join(MIGRATIONS_DIR, 'migrations.ts');
  let content = fs.readFileSync(migrationsFile, 'utf-8');

  // Create migration template
  const migrationTemplate = `  {
    id: '${migrationId}',
    up: (db) => {
      // TODO: Add your migration code here
      // Example:
      // db.run('ALTER TABLE journals ADD COLUMN new_field TEXT');
      // db.run('CREATE INDEX IF NOT EXISTS idx_name ON table(column)');
    },
  },
`;

  // Find the MIGRATIONS array and insert before its closing bracket
  // Look for the pattern "  },\n];" which is the end of the last migration
  const regex = /const MIGRATIONS: Migration\[\] = \[[\s\S]*?\n\];/;
  const match = content.match(regex);
  
  if (!match) {
    console.error('Error: Could not find MIGRATIONS array in migrations.ts');
    process.exit(1);
  }

  const migrationsArray = match[0];
  // Find the last "},\n" before the closing "];"
  const lastMigrationEnd = migrationsArray.lastIndexOf('},\n');
  
  if (lastMigrationEnd === -1) {
    console.error('Error: Could not find insertion point in MIGRATIONS array');
    process.exit(1);
  }

  // Insert after the last migration's closing brace
  const updatedArray = 
    migrationsArray.slice(0, lastMigrationEnd + 3) + // Include "},\n"
    migrationTemplate +
    migrationsArray.slice(lastMigrationEnd + 3);

  const updatedContent = content.replace(regex, updatedArray);

  // Write back to file
  fs.writeFileSync(migrationsFile, updatedContent, 'utf-8');

  console.log('✓ Migration file updated');
  console.log(`✓ Migration ID: ${migrationId}`);
  console.log('\nNext steps:');
  console.log(`  1. Edit src/main/database/migrations.ts`);
  console.log(`  2. Implement the "up" function for migration ${migrationId}`);
  console.log('  3. Test your migration with: npm test -- migrations.test.ts');
  console.log('  4. Run the app to apply the migration automatically\n');
}

/**
 * Show migration status
 */
function showStatus() {
  const migrationsFile = path.join(MIGRATIONS_DIR, 'migrations.ts');

  if (!fs.existsSync(migrationsFile)) {
    console.error('Error: migrations.ts not found');
    process.exit(1);
  }

  const content = fs.readFileSync(migrationsFile, 'utf-8');

  // Extract migration IDs
  const migrations = [];
  const regex = /id:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    migrations.push(match[1]);
  }

  console.log('\nMigration Status');
  console.log('─'.repeat(60));
  console.log(`Total migrations defined: ${migrations.length}\n`);

  if (migrations.length === 0) {
    console.log('No migrations found.');
  } else {
    console.log('Defined migrations:');
    migrations.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
  }

  console.log('\nNote: To see applied migrations, run the app and check the');
  console.log('schema_migrations table in the database.\n');
}

/**
 * Snapshot the current schema
 */
function snapshotSchema() {
  const schemaFile = path.join(MIGRATIONS_DIR, 'schema.sql');

  if (!fs.existsSync(schemaFile)) {
    console.error('Error: schema.sql not found');
    process.exit(1);
  }

  // Get version from package.json
  const packageJson = require('../package.json');
  const version = packageJson.version;

  // Create snapshots directory if it doesn't exist
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }

  // Read current schema
  const schemaContent = fs.readFileSync(schemaFile, 'utf-8');

  // Create snapshot filename
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const snapshotFile = path.join(SNAPSHOTS_DIR, `schema-v${version}-${timestamp}.sql`);

  // Check if snapshot already exists
  if (fs.existsSync(snapshotFile)) {
    console.error(`\nError: Snapshot already exists: ${path.basename(snapshotFile)}`);
    console.log('Delete it first if you want to recreate it.\n');
    process.exit(1);
  }

  // Add header to snapshot
  const header = `-- Esquisse Database Schema Snapshot
-- Version: ${version}
-- Date: ${timestamp}
--
-- This is an automated snapshot of the database schema.
-- Use this for reference and migration generation.

`;

  fs.writeFileSync(snapshotFile, header + schemaContent, 'utf-8');

  console.log('\nSchema Snapshot Created');
  console.log('─'.repeat(60));
  console.log(`Version: ${version}`);
  console.log(`File: ${path.relative(process.cwd(), snapshotFile)}`);
  console.log('\nSnapshot saved successfully!\n');
}

// Command router
switch (command) {
  case 'create':
    createMigration(args[0]);
    break;

  case 'status':
    showStatus();
    break;

  case 'snapshot':
    snapshotSchema();
    break;

  default:
    console.log('\nEsquisse Migration CLI\n');
    console.log('Usage:');
    console.log('  npm run migrate:create <name>  - Create a new migration');
    console.log('  npm run migrate:status         - Show migration status');
    console.log('  npm run migrate:snapshot       - Snapshot current schema\n');
    process.exit(1);
}
