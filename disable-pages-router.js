const fs = require('fs');
const path = require('path');

// Function to disable the Pages Router
function disablePagesRouter() {
  console.log('🔧 Disabling Pages Router to resolve conflicts...');
  
  try {
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    const backupDir = path.join(process.cwd(), 'src', 'pages-backup');
    
    // Check if pages directory exists
    if (fs.existsSync(pagesDir)) {
      console.log('Found pages directory - creating backup and disabling...');
      
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
      
      // Create an empty _app.tsx file to satisfy Next.js
      const appContent = `import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
`;
      fs.writeFileSync(path.join(pagesDir, '_app.tsx'), appContent);
      console.log('Created minimal _app.tsx');
      
      // Create an empty _document.tsx file without Html component
      const documentContent = `import { Head, Main, NextScript } from 'next/document';
import Document from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

export default MyDocument;
`;
      fs.writeFileSync(path.join(pagesDir, '_document.tsx'), documentContent);
      console.log('Created minimal _document.tsx');
      
      console.log('✅ Pages Router disabled successfully');
    } else {
      console.log('Pages directory not found - nothing to disable');
    }
  } catch (error) {
    console.error('❌ Error disabling Pages Router:', error);
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
  fs.rmdirSync(directory);
}

// Run the function
disablePagesRouter();
