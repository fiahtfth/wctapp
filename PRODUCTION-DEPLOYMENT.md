# Production Deployment Guide

This guide provides instructions for deploying the WCT App to production using Supabase for authentication and database.

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Access to a Supabase project
- A hosting provider (Vercel, Netlify, or your own server)

## Environment Setup

1. **Configure Environment Variables**

   The application uses the following environment variables for production:

   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Security
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-jwt-refresh-secret

   # Application Settings
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NODE_ENV=production
   ```

   These variables should be set in your hosting provider's environment configuration.

2. **Database Initialization**

   Before deploying, initialize the database by running:

   ```bash
   NODE_ENV=production node scripts/init-production-db.js
   ```

   This script will:
   - Create necessary tables if they don't exist
   - Set up the initial admin user
   - Configure Row Level Security policies

## Deployment Options

### Option 1: Using the Deployment Script

We provide a deployment script that automates the process:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
1. Check for required environment variables
2. Install dependencies
3. Initialize the database
4. Build the application
5. Run tests
6. Deploy to your configured hosting provider

### Option 2: Manual Deployment

#### For Vercel

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

#### For Netlify

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

#### For Custom Server

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy the build files to your server:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/path/to/deployment/
   ```

3. Start the application on your server:
   ```bash
   npm start
   ```

## Post-Deployment Verification

After deployment, verify that:

1. The application loads correctly
2. Authentication works (login/logout)
3. Database operations work correctly
4. All critical functionality is working as expected

## Security Considerations

1. **Environment Variables**: Ensure sensitive environment variables are properly secured in your hosting provider.
2. **Database Access**: The Supabase service role key has full access to your database. Keep it secure.
3. **JWT Secrets**: Use strong, unique secrets for JWT tokens.
4. **RLS Policies**: Verify that Row Level Security policies are correctly applied in Supabase.

## Troubleshooting

If you encounter issues during deployment:

1. Check the application logs
2. Verify environment variables are correctly set
3. Ensure the database is properly initialized
4. Check network connectivity to Supabase

For more detailed troubleshooting, refer to the error logs in your hosting provider's dashboard.

## Maintenance

Regular maintenance tasks:

1. Keep dependencies updated
2. Monitor database performance
3. Regularly backup your database
4. Review and update security policies

## Support

If you need assistance with deployment, please contact the development team. 