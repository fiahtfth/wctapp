#!/usr/bin/env node

// This script runs the TypeScript migration script using ts-node
const { execSync } = require('child_process');
const path = require('path');

// Path to the migration script
const migrationScriptPath = path.join(
  __dirname,
  'src',
  'lib',
  'database',
  'migrations',
  'run-migration.ts'
);

console.log('Starting database migration from SQLite to PostgreSQL...');

try {
  // Install ts-node if not already installed
  console.log('Ensuring ts-node is installed...');
  execSync('npm install -g ts-node typescript', { stdio: 'inherit' });

  // Run the migration script using ts-node
  console.log('Running migration script...');
  execSync(`ts-node ${migrationScriptPath}`, { stdio: 'inherit' });

  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
