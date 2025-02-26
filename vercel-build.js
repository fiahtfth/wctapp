const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to copy database to a temporary location
function copyDatabaseForVercel() {
  try {
    const sourcePath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
    const targetPath = path.join('/tmp', 'wct.db');

    // Ensure the target directory exists
    fs.mkdirSync('/tmp', { recursive: true });

    // Copy the database file
    fs.copyFileSync(sourcePath, targetPath);

    console.log('📂 Copying database to /tmp for Vercel...');
    console.log('✅ Database copied successfully');

    // Make sure the file is writable
    fs.chmodSync(targetPath, 0o666);
    console.log('✅ Database permissions set to writable');

    // Update the environment variable to point to the new database location
    process.env.DATABASE_PATH = targetPath;
    process.env.DATABASE_URL = `file:${targetPath}`;

    console.log('🔄 Environment variables updated for Vercel');
  } catch (error) {
    console.error('❌ Failed to copy database:', error);
    throw error;
  }
}

// Function to run database initialization
function initializeDatabase() {
  try {
    // Use ts-node to run the initialization script
    execSync('npx ts-node scripts/init-users.ts', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('🚀 Database initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Main build script
function vercelBuild() {
  try {
    console.log('🔄 Running Vercel build script...');
    
    // Detect Vercel environment
    console.log('🌐 Detected Vercel environment');
    
    // Copy database for Vercel deployment
    copyDatabaseForVercel();
    
    // Initialize database
    initializeDatabase();
    
    console.log('🏗️ Proceeding with Next.js build...');
  } catch (error) {
    console.error('❌ Vercel build script failed:', error);
    process.exit(1);
  }
}

// Run the build script
vercelBuild();
