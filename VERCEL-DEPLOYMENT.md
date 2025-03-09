# Vercel Deployment Guide

This guide provides specific instructions for deploying the WCT App to Vercel using Supabase for authentication and database.

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- A Vercel account
- Access to your Supabase project

## Deployment Steps

### Option 1: Using the Deployment Script (Recommended)

We provide a Vercel-specific deployment script that automates the process:

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

The script will:
1. Check for required configuration files
2. Initialize the database
3. Log you into Vercel if needed
4. Deploy your application

### Option 2: Manual Deployment

1. **Install the Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Initialize the database**:
   ```bash
   NODE_ENV=production node scripts/init-production-db.js
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

## Environment Variables

After deployment, verify that these environment variables are set in the Vercel dashboard:

### Public Variables (included in vercel.json)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_USE_MOCK_DATA`

### Secret Variables (must be added manually in Vercel dashboard)
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## Important Security Notes

1. **Never include sensitive keys in vercel.json** - They should be added through the Vercel dashboard
2. **Service Role Key** - The Supabase service role key has full access to your database. It must be kept secure.
3. **JWT Secrets** - These should be strong, unique strings

## Post-Deployment Steps

1. **Set up environment variables** in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" section
   - Add the secret variables mentioned above

2. **Verify RLS policies** are correctly set up in Supabase:
   - Log into your Supabase dashboard
   - Go to the SQL Editor
   - Run the RLS policy statements from the database initialization script

3. **Test authentication** to ensure it's working correctly

## Troubleshooting

If you encounter issues:

1. **Check Vercel logs** in the Vercel dashboard
2. **Verify environment variables** are correctly set
3. **Test locally** before deploying to identify any issues
4. **Check Supabase connection** by testing authentication

## Updating Your Deployment

To update your deployment after making changes:

1. Make your changes locally
2. Test thoroughly
3. Run the deployment script again or use `vercel --prod`

## Vercel-Specific Features

Consider using these Vercel features:

1. **Preview Deployments** - Each PR gets its own preview URL
2. **Custom Domains** - Set up your own domain name
3. **Analytics** - Monitor performance and usage
4. **Serverless Functions** - Optimize API routes 