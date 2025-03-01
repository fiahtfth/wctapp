const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing for Render build...');

// Set up paths
const appDir = path.join(process.cwd(), 'src', 'app');
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const backupDir = path.join(process.cwd(), 'src', 'pages-backup');
const publicDir = path.join(process.cwd(), 'public');

// Function to ensure directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Function to safely remove a directory
function safeRemoveDirectory(dir) {
  if (fs.existsSync(dir)) {
    console.log(`Removing directory: ${dir}`);
    if (process.platform === 'win32') {
      try {
        execSync(`rmdir /s /q "${dir}"`);
      } catch (error) {
        console.error(`Failed to remove directory ${dir}: ${error.message}`);
      }
    } else {
      try {
        execSync(`rm -rf "${dir}"`);
      } catch (error) {
        console.error(`Failed to remove directory ${dir}: ${error.message}`);
      }
    }
  }
}

// 1. Handle Pages directory
console.log('Handling Pages directory...');
if (fs.existsSync(pagesDir)) {
  // Backup pages directory if not already backed up
  if (!fs.existsSync(backupDir)) {
    ensureDirectoryExists(backupDir);
    try {
      if (process.platform === 'win32') {
        execSync(`xcopy "${pagesDir}" "${backupDir}" /E /I /Y`);
      } else {
        execSync(`cp -R "${pagesDir}/." "${backupDir}/"`);
      }
      console.log('Created backup of pages directory');
    } catch (error) {
      console.error(`Failed to backup pages directory: ${error.message}`);
    }
  }
  
  // Remove pages directory
  safeRemoveDirectory(pagesDir);
}

// 2. Create essential static error pages
console.log('Creating static error pages...');
ensureDirectoryExists(publicDir);

// Create 404.html
const static404Path = path.join(publicDir, '404.html');
const static404Content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
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
      font-size: 5rem;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
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
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a href="/">Return Home</a>
  </div>
</body>
</html>`;
fs.writeFileSync(static404Path, static404Content);
console.log('Created 404.html');

// Create 500.html
const static500Path = path.join(publicDir, '500.html');
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
console.log('Created 500.html');

// 3. Create App Router error pages if they don't exist
console.log('Creating App Router error pages...');
ensureDirectoryExists(appDir);

// Create not-found.tsx
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

// Create error.tsx
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

// Create global-error.tsx
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

// Add custom 404.tsx client component
const custom404Path = path.join(appDir, '404.tsx');
if (!fs.existsSync(custom404Path)) {
  const custom404Content = `'use client';

import Link from 'next/link';

export default function Custom404() {
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
  fs.writeFileSync(custom404Path, custom404Content);
  console.log('Created 404.tsx');
}

// Add custom _error.tsx client component
const customErrorPath = path.join(appDir, '_error.tsx');
if (!fs.existsSync(customErrorPath)) {
  const customErrorContent = `'use client';

import Link from 'next/link';

export default function CustomError({ statusCode }: { statusCode?: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">
          {statusCode ? \`\${statusCode}\` : 'Error'}
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {statusCode ? \`An error \${statusCode} occurred\` : 'An error occurred'}
        </h2>
        <p className="text-gray-600 mb-6">
          Please try again later or contact support if the problem persists.
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
  fs.writeFileSync(customErrorPath, customErrorContent);
  console.log('Created _error.tsx');
}

// 4. Update .next directory if it exists
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('Cleaning up .next directory...');
  
  // List of problematic files to remove
  const filesToRemove = [
    path.join(nextDir, 'server', 'pages', '_error.js'),
    path.join(nextDir, 'server', 'pages', '404.js'),
    path.join(nextDir, 'server', 'pages', '500.js'),
  ];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Removed ${file}`);
    }
  });
}

console.log('✅ Render build preparation completed successfully');

// Execute the next build command if asked to
if (process.argv.includes('--build')) {
  console.log('🏗️ Starting Next.js build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}
