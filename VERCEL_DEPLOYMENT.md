# Vercel Deployment Guide

This document provides instructions for deploying the WCT Exam Creation Manager to Vercel.

## Database Configuration

The application uses SQLite, which requires special handling in Vercel's serverless environment. Here's how it works:

1. During the build process, the database file is copied to Vercel's `/tmp` directory, which is writable.
2. All database operations use this temporary location for read/write operations.
3. The database permissions are explicitly set to be writable (chmod 666).

## Deployment Steps

1. **Push your code to GitHub**: Make sure your code is in a GitHub repository.

2. **Connect to Vercel**: 
   - Go to [Vercel](https://vercel.com) and create a new project
   - Connect your GitHub repository
   - Select the repository containing this project

3. **Configure Build Settings**:
   - Build Command: `npm run build` (this will run our custom vercel-build.js script)
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Set Environment Variables**:
   The following environment variables should be set in your Vercel project settings:
   ```
   DATABASE_URL=file:/tmp/wct.db
   DATABASE_PATH=/tmp/wct.db
   JWT_SECRET=your_secret_key_here
   NODE_ENV=production
   ```

   **Important**: For the `JWT_SECRET`, generate a strong random string. You can use this command to generate a secure secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   The JWT_SECRET must be the same value in all environments to ensure tokens remain valid.

5. **Deploy**:
   - Click "Deploy" and wait for the build to complete

## Troubleshooting

If you encounter database-related issues:

1. **Check Logs**: Vercel provides detailed logs for each deployment and function execution.

2. **Database Permissions**: The most common issue is database permissions. The application tries to:
   - Copy the database to `/tmp`
   - Set permissions to writable
   - Use explicit `readonly: false` when opening the database

3. **File System Limitations**: Remember that Vercel's `/tmp` directory is the only writable location, and it's ephemeral (temporary).

4. **Authentication Issues**: If you encounter problems with authentication or "add to cart" functionality:
   - Ensure the `JWT_SECRET` environment variable is properly set in Vercel
   - Check that the token is being correctly passed in the Authorization header
   - Verify that the client is storing and retrieving the token correctly
   - Look for any CORS issues that might be preventing the token from being sent

5. **Debugging**: Add more console.log statements to the database access code to help identify where issues might be occurring.

## Important Notes

- The database in `/tmp` is ephemeral and will be recreated on each cold start
- For production use with frequent writes, consider using a proper database service instead of SQLite
- The vercel.json file contains important configuration for the database paths

## Static Assets and Manifest

When deploying to Vercel, ensure that static assets like `manifest.json` and icon files are properly accessible. The vercel.json file includes specific route configurations to ensure these files are served correctly:

```json
"routes": [
  {
    "src": "/manifest.json",
    "dest": "/manifest.json",
    "headers": {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    }
  },
  {
    "src": "/icons/(.*)",
    "dest": "/icons/$1",
    "headers": {
      "Cache-Control": "public, max-age=86400"
    }
  },
  {
    "src": "/(.*)",
    "dest": "/$1"
  }
]
```

This configuration ensures that:
1. The manifest.json file is publicly accessible
2. Icon files are properly cached
3. CORS headers are set correctly for the manifest file

## Common Issues and Solutions

### 1. Database Write Access

The SQLite database needs to be in a writable location in the Vercel environment. The `/tmp` directory is used for this purpose:

```
DATABASE_URL=file:/tmp/wct.db
DATABASE_PATH=/tmp/wct.db
```

### 2. SQL Syntax for Timestamps

When working with timestamps in SQLite queries, use `CURRENT_TIMESTAMP` instead of `datetime("now")` for better compatibility:

```sql
-- Correct way to insert current timestamp
INSERT INTO table_name (created_at) VALUES (CURRENT_TIMESTAMP)

-- Avoid using this format in Vercel environment
-- INSERT INTO table_name (created_at) VALUES (datetime("now"))
```

### 3. Static Assets Access

To ensure static assets like manifest.json and icon files are accessible without authentication, a middleware is implemented:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to manifest.json and icon files without authentication
  if (pathname === '/manifest.json' || pathname.startsWith('/icons/')) {
    return NextResponse.next();
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

This ensures that PWA assets are properly accessible even when authentication is required for other routes.
