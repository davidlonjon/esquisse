#!/usr/bin/env node

const { execSync } = require('node:child_process');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status ?? 1);
}
