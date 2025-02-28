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

// Function to check for common build issues and fix them
function checkAndFixBuildIssues() {
  console.log('🔍 Checking for common build issues...');
  
  // Check if we're in Render environment
  if (process.env.RENDER) {
    try {
      // Check if the app directory exists
      const appDir = path.join(process.cwd(), 'src', 'app');
      const pagesDir = path.join(process.cwd(), 'src', 'pages');
      
      // Ensure error and not-found pages exist in app directory
      const appErrorPath = path.join(appDir, 'error.tsx');
      const appNotFoundPath = path.join(appDir, 'not-found.tsx');
      
      if (!fs.existsSync(appErrorPath)) {
        console.log('Creating error.tsx in app directory...');
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
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}`;
        fs.writeFileSync(appErrorPath, errorContent);
      }
      
      if (!fs.existsSync(appNotFoundPath)) {
        console.log('Creating not-found.tsx in app directory...');
        const notFoundContent = `import Link from 'next/link';

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
        fs.writeFileSync(appNotFoundPath, notFoundContent);
      }
      
      // Ensure error and 404 pages exist in pages directory
      const pagesErrorPath = path.join(pagesDir, '_error.tsx');
      const pages404Path = path.join(pagesDir, '404.tsx');
      
      if (!fs.existsSync(pagesErrorPath)) {
        console.log('Creating _error.tsx in pages directory...');
        const errorContent = `import { NextPage } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">
          {statusCode ? \`Error \${statusCode}\` : 'An error occurred'}
        </h1>
        <p className="text-gray-600 mb-6">
          {statusCode
            ? \`A server-side error occurred (\${statusCode}).\`
            : 'An error occurred on client.'}
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
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;`;
        fs.writeFileSync(pagesErrorPath, errorContent);
      }
      
      if (!fs.existsSync(pages404Path)) {
        console.log('Creating 404.tsx in pages directory...');
        const notFoundContent = `import Link from 'next/link';

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
        fs.writeFileSync(pages404Path, notFoundContent);
      }
      
      console.log('✅ Build issues check completed');
    } catch (error) {
      console.error('❌ Error checking for build issues:', error);
      // Don't throw the error to allow the build to continue
      console.log('Continuing with build despite error check failure');
    }
  }
}

// Function to set up App Router only configuration
function setupAppOnly() {
  console.log('🔧 Setting up App Router only configuration...');
  try {
    require('./create-nextjs-app-only');
    console.log('✅ App Router only configuration set up successfully');
  } catch (error) {
    console.error('❌ Error setting up App Router only configuration:', error);
    throw error;
  }
}

// Function to remove the Pages Router
function removePagesRouter() {
  console.log('🔧 Removing Pages Router to resolve conflicts...');
  try {
    require('./disable-pages-router');
    console.log('✅ Pages Router removed successfully');
  } catch (error) {
    console.error('❌ Error removing Pages Router:', error);
  }
}

// Function to run the HTML import fix script
function fixHtmlImports() {
  console.log('🔧 Running HTML import fix script...');
  try {
    require('./fix-html-import');
    console.log('✅ HTML import fixes applied');
  } catch (error) {
    console.error('❌ Error running HTML import fix script:', error);
  }
}

// Main build function
function renderBuild() {
  console.log('🚀 Starting Render build process...');
  
  try {
    // Ensure SQLite database is set up
    ensureSQLiteDatabase();
    
    // Run PostgreSQL migration if needed
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      runPostgresqlMigration();
    }
    
    // Set up App Router only configuration
    setupAppOnly();
    
    // Fix HTML import issues
    fixHtmlImports();
    
    // Check and fix common build issues
    checkAndFixBuildIssues();
    
    console.log('✅ Render build setup complete');
  } catch (error) {
    console.error('❌ Render build setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
renderBuild();
