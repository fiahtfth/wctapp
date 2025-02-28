const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to completely remove the Pages Router
function removePagesRouter() {
  console.log('🔧 Completely removing Pages Router to resolve conflicts...');
  
  try {
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    const backupDir = path.join(process.cwd(), 'src', 'pages-backup');
    
    // Check if pages directory exists
    if (fs.existsSync(pagesDir)) {
      console.log('Found pages directory - creating backup and removing...');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('Created backup directory');
      }
      
      // Read all files in the pages directory
      const files = fs.readdirSync(pagesDir);
      
      // Move each file to the backup directory
      files.forEach(file => {
        const sourcePath = path.join(pagesDir, file);
        const targetPath = path.join(backupDir, file);
        
        // Skip if it's a backup file
        if (file.endsWith('.bak')) {
          return;
        }
        
        // Only copy if the file doesn't already exist in the backup directory
        if (!fs.existsSync(targetPath)) {
          const stats = fs.statSync(sourcePath);
          
          if (stats.isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Backed up ${file} to backup directory`);
          } else if (stats.isDirectory()) {
            // For directories, we need to copy recursively
            copyDirectoryRecursive(sourcePath, targetPath);
            console.log(`Backed up directory ${file} to backup directory`);
          }
        }
        
        // Now remove the file or directory from the pages directory
        if (fs.statSync(sourcePath).isDirectory()) {
          // For directories, we need to remove recursively
          removeDirectoryRecursive(sourcePath);
        } else {
          fs.unlinkSync(sourcePath);
        }
        console.log(`Removed ${file} from pages directory`);
      });
      
      // Use a more robust method to remove the directory
      try {
        // First try to remove it with fs.rmdirSync
        fs.rmdirSync(pagesDir);
      } catch (err) {
        if (err.code === 'ENOTEMPTY') {
          // If directory is not empty, use a shell command to force remove it
          console.log('Directory not empty, using force remove...');
          if (process.platform === 'win32') {
            execSync(`rmdir /s /q "${pagesDir}"`);
          } else {
            execSync(`rm -rf "${pagesDir}"`);
          }
        } else {
          throw err;
        }
      }
      
      console.log('Removed pages directory completely');
      console.log('✅ Pages Router completely removed');
    } else {
      console.log('Pages directory not found - nothing to remove');
    }
  } catch (error) {
    console.error('❌ Error removing Pages Router:', error);
  }
}

// Helper function to copy a directory recursively
function copyDirectoryRecursive(source, target) {
  // Create target directory
  fs.mkdirSync(target, { recursive: true });
  
  // Read all files in the source directory
  const files = fs.readdirSync(source);
  
  // Copy each file to the target directory
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    } else if (stats.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    }
  });
}

// Helper function to remove a directory recursively
function removeDirectoryRecursive(directory) {
  // Read all files in the directory
  const files = fs.readdirSync(directory);
  
  // Remove each file
  files.forEach(file => {
    const filePath = path.join(directory, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      removeDirectoryRecursive(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  
  // Remove the directory itself
  try {
    fs.rmdirSync(directory);
  } catch (err) {
    if (err.code === 'ENOTEMPTY') {
      // If directory is not empty, use a shell command to force remove it
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${directory}"`);
      } else {
        execSync(`rm -rf "${directory}"`);
      }
    } else {
      throw err;
    }
  }
}

// Run the function
removePagesRouter();
