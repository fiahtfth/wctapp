const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set up paths
const appDir = path.join(process.cwd(), 'src', 'app');
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const pagesBackupDir = path.join(process.cwd(), 'src', 'pages-backup');
const publicDir = path.join(process.cwd(), 'public');
const nextDir = path.join(process.cwd(), '.next');

// Function to clean up any references to problematic error pages in the .next directory
function cleanNextCache() {
  if (!fs.existsSync(nextDir)) {
    console.log('No .next directory found, skipping cache cleanup');
    return;
  }

  console.log('Cleaning .next cache of error pages...');
  
  // Files to remove
  const filesToRemove = [
    path.join(nextDir, 'server', 'pages', '_error.js'),
    path.join(nextDir, 'server', 'pages', '404.js'),
    path.join(nextDir, 'server', 'pages', '500.js')
  ];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Removed ${file}`);
    }
  });
  
  console.log('Finished cleaning .next cache');
}

// Function to move pages folder and create necessary App Router files
function setupAppOnly() {
  console.log('🔧 Setting up App Router only configuration...');
  
  try {
    // Step 1: Backup and Remove Pages Directory
    if (fs.existsSync(pagesDir)) {
      console.log('Found pages directory - backing up and removing...');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(pagesBackupDir)) {
        fs.mkdirSync(pagesBackupDir, { recursive: true });
        console.log('Created backup directory');
      }
      
      // Copy all files from pages to backup
      if (fs.existsSync(pagesDir)) {
        // Use shell command for reliable copying
        if (process.platform === 'win32') {
          execSync(`xcopy "${pagesDir}" "${pagesBackupDir}" /E /I /Y`);
        } else {
          execSync(`cp -R "${pagesDir}/." "${pagesBackupDir}/"`);
        }
        console.log('Backed up pages directory');
      }
      
      // Remove the pages directory completely
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${pagesDir}"`);
      } else {
        execSync(`rm -rf "${pagesDir}"`);
      }
      console.log('Removed pages directory completely');
    }
    
    // Step 2: Ensure all necessary App Router files exist
    console.log('Ensuring all necessary App Router files exist...');
    
    // Create app directory if it doesn't exist
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
      console.log('Created app directory');
    }
    
    // Ensure not-found.tsx exists
    const notFoundPath = path.join(appDir, 'not-found.tsx');
    if (!fs.existsSync(notFoundPath)) {
      const notFoundContent = `import Link from 'next/link';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for cannot be found.'
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}`;
      fs.writeFileSync(notFoundPath, notFoundContent);
      console.log('Created not-found.tsx');
    }
    
    // Ensure error.tsx exists
    const errorPath = path.join(appDir, 'error.tsx');
    if (!fs.existsSync(errorPath)) {
      const errorContent = `'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong!</h1>
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Try again
          </button>
          <Link 
            href="/" 
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}`;
      fs.writeFileSync(errorPath, errorContent);
      console.log('Created error.tsx');
    }
    
    // Ensure global-error.tsx exists
    const globalErrorPath = path.join(appDir, 'global-error.tsx');
    if (!fs.existsSync(globalErrorPath)) {
      const globalErrorContent = `'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">500 - Server Error</h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. A server error has occurred.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Try again
              </button>
              <Link 
                href="/" 
                className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}`;
      fs.writeFileSync(globalErrorPath, globalErrorContent);
      console.log('Created global-error.tsx');
    }
    
    // Place a 500.html in public directory to handle static 500 errors
    const static500Path = path.join(publicDir, '500.html');
    if (!fs.existsSync(static500Path)) {
      const static500Content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 - Server Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f3f4f6;
    }
    .error-container {
      background-color: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 28rem;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 1rem;
    }
    p {
      color: #4b5563;
      margin-bottom: 1.5rem;
    }
    a {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      font-weight: 500;
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>500 - Server Error</h1>
    <p>We apologize for the inconvenience. A server error has occurred.</p>
    <a href="/">Return Home</a>
  </div>
</body>
</html>`;
      fs.writeFileSync(static500Path, static500Content);
      console.log('Created static 500.html');
    }
    
    // Clean up .next cache
    cleanNextCache();
    
    console.log('✅ App Router only configuration set up successfully');
  } catch (error) {
    console.error('❌ Error setting up App Router only configuration:', error);
  }
}

// Run the function
setupAppOnly();
