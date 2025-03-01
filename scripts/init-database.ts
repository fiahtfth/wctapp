import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Use dynamic import for dotenv to avoid type issues
async function loadEnv() {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (error) {
    console.error('Error loading dotenv:', error);
  }
}

async function initializeDatabase() {
  try {
    // Load environment variables
    await loadEnv();
    
    console.log('🚀 Starting Database Initialization');
    
    // Check if we should use Supabase
    const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    console.log(`Using database: ${useSupabase ? 'Supabase' : 'SQLite'}`);
    
    if (useSupabase) {
      // Initialize Supabase
      console.log('Initializing Supabase users...');
      
      try {
        // Run the Supabase initialization script as a separate process
        execSync('npm run db:init:supabase', { stdio: 'inherit' });
        console.log('✅ Supabase initialization complete');
      } catch (error) {
        console.error('Error initializing Supabase users:', error);
        throw error;
      }
    } else {
      // Initialize SQLite
      console.log('Initializing SQLite database...');
      
      try {
        // Run the SQLite initialization script as a separate process
        execSync('npm run db:init', { stdio: 'inherit' });
        console.log('✅ SQLite initialization complete');
      } catch (error) {
        console.error('Error initializing SQLite database:', error);
        throw error;
      }
    }
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase; 