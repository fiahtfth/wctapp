#!/usr/bin/env node

/**
 * Reset Database Script
 * 
 * This script resets the database by:
 * 1. Setting the RECREATE_TABLES environment variable to 'true'
 * 2. Running the database initialization
 * 
 * Usage: node scripts/reset-database.js
 */

// Set environment variables
process.env.RECREATE_TABLES = 'true';

// Import the initialization function
const { initializeDatabase } = require('../dist/lib/database/init');

// Run the initialization
async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    await initializeDatabase();
    console.log('✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
