#!/usr/bin/env node

/**
 * TypeScript Paths Generator
 *
 * Generates the paths configuration for tsconfig.json from the shared
 * configuration module. This ensures TypeScript and Vite use the same aliases.
 *
 * Usage: node scripts/generate-ts-paths.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getTypeScriptPaths } from '../config/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const tsconfigPath = join(projectRoot, 'tsconfig.json');

// Read current tsconfig.json
const tsconfigContent = readFileSync(tsconfigPath, 'utf-8');
const tsconfig = JSON.parse(tsconfigContent);

// Generate paths from shared config
const paths = getTypeScriptPaths();

// Update paths in tsconfig
tsconfig.compilerOptions.paths = paths;

// Write back to tsconfig.json with nice formatting
const updatedContent = JSON.stringify(tsconfig, null, 2) + '\n';
writeFileSync(tsconfigPath, updatedContent, 'utf-8');

console.log('✅ TypeScript paths updated successfully!');
console.log(`   Generated ${Object.keys(paths).length} path mappings`);
