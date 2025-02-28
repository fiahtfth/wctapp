const fs = require('fs');
const path = require('path');

// Function to ensure database directory exists
function ensureDatabaseDirectory() {
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

// Run the setup
ensureDatabaseDirectory();
