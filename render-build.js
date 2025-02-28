const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to ensure database directory exists for SQLite
function ensureSQLiteDatabase() {
  const renderDbPath = '/opt/render/project/src';
  
  // Check if we're in Render environment
  if (process.env.RENDER) {
    console.log('Running in Render environment');
    
    // Create database directory if it doesn't exist
    if (!fs.existsSync(renderDbPath)) {
      console.log(`Creating database directory: ${renderDbPath}`);
      try {
        fs.mkdirSync(renderDbPath, { recursive: true });
        console.log('Database directory created successfully');
      } catch (error) {
        console.error('Error creating database directory:', error);
      }
    } else {
      console.log('Database directory already exists');
    }
    
    // Check if database file exists, if not, copy from source
    const sourceDbPath = path.join(process.cwd(), 'wct.db');
    const targetDbPath = path.join(renderDbPath, 'wct.db');
    
    if (fs.existsSync(sourceDbPath) && !fs.existsSync(targetDbPath)) {
      console.log(`Copying database from ${sourceDbPath} to ${targetDbPath}`);
      try {
        fs.copyFileSync(sourceDbPath, targetDbPath);
        console.log('Database copied successfully');
        
        // Set permissions
        fs.chmodSync(targetDbPath, 0o666);
        console.log('Database permissions set');
      } catch (error) {
        console.error('Error copying database:', error);
      }
    } else if (!fs.existsSync(sourceDbPath)) {
      console.log('Source database does not exist, will be created by the application');
    } else {
      console.log('Target database already exists');
    }
  } else {
    console.log('Not running in Render environment, skipping database setup');
  }
}

// Function to run PostgreSQL migration
function runPostgresqlMigration() {
  try {
    console.log('🔄 Running PostgreSQL migration...');
    
    // Check if we're using PostgreSQL
    if (process.env.DB_TYPE === 'postgres') {
      console.log('PostgreSQL database type detected');
      
      // Wait for PostgreSQL to be ready
      console.log('Waiting for PostgreSQL to be ready...');
      // Sleep for 10 seconds to ensure PostgreSQL is ready
      execSync('sleep 10');
      
      // Run the migration script
      console.log('Running migration script...');
      execSync('npm run migrate:postgres', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      console.log('✅ PostgreSQL migration completed successfully');
    } else {
      console.log('Not using PostgreSQL, skipping migration');
    }
  } catch (error) {
    console.error('❌ Failed to run PostgreSQL migration:', error);
    // Don't throw the error to allow the build to continue
    console.log('Continuing with build despite migration error');
  }
}

// Main build function
function renderBuild() {
  try {
    console.log('🔄 Running Render build script...');
    
    // Detect database type
    const dbType = process.env.DB_TYPE || 'sqlite';
    console.log(`Database type: ${dbType}`);
    
    if (dbType === 'sqlite') {
      // Setup SQLite database
      ensureSQLiteDatabase();
    } else if (dbType === 'postgres') {
      // Run PostgreSQL migration
      runPostgresqlMigration();
    }
    
    console.log('🏗️ Proceeding with Next.js build...');
  } catch (error) {
    console.error('❌ Render build script failed:', error);
    process.exit(1);
  }
}

// Run the setup
renderBuild();
