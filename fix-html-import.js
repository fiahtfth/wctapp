const fs = require('fs');
const path = require('path');

// Function to check and fix HTML import issues
function fixHtmlImportIssues() {
  console.log('🔍 Checking for HTML import issues...');
  
  try {
    // Check if the pages directory exists
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    const appDir = path.join(process.cwd(), 'src', 'app');
    
    if (fs.existsSync(pagesDir) && fs.existsSync(appDir)) {
      console.log('Both pages and app directories exist - checking for conflicts...');
      
      // Fix 404 page in pages directory
      const pages404Path = path.join(pagesDir, '404.tsx');
      if (fs.existsSync(pages404Path)) {
        console.log('Found 404.tsx in pages directory - ensuring it does not use Html component...');
        
        // Create a clean 404 page without any Html imports
        const clean404Content = `import Link from 'next/link';

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
        
        // Backup the original file
        const backupPath = path.join(pagesDir, '404.tsx.bak');
        if (fs.existsSync(pages404Path)) {
          fs.copyFileSync(pages404Path, backupPath);
          console.log(`Backed up original 404.tsx to ${backupPath}`);
        }
        
        // Write the clean content
        fs.writeFileSync(pages404Path, clean404Content);
        console.log('Updated 404.tsx with clean content');
      }
      
      // Check if _document.tsx exists and ensure it's properly configured
      const documentPath = path.join(pagesDir, '_document.tsx');
      if (fs.existsSync(documentPath)) {
        console.log('Found _document.tsx - ensuring it uses Html component correctly...');
        
        // Create a clean _document.tsx with proper Html import
        const cleanDocumentContent = `import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
          <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png" />
          <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" type="image/png" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" sizes="192x192" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;`;
        
        // Backup the original file
        const backupPath = path.join(pagesDir, '_document.tsx.bak');
        if (fs.existsSync(documentPath)) {
          fs.copyFileSync(documentPath, backupPath);
          console.log(`Backed up original _document.tsx to ${backupPath}`);
        }
        
        // Write the clean content
        fs.writeFileSync(documentPath, cleanDocumentContent);
        console.log('Updated _document.tsx with clean content');
      }
    }
    
    console.log('✅ HTML import issues check complete');
  } catch (error) {
    console.error('❌ Error fixing HTML import issues:', error);
  }
}

// Run the fix
fixHtmlImportIssues();
