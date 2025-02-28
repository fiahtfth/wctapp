# WCT Exam Creation Manager - Render Deployment

This README provides a quick overview of deploying the WCT Exam Creation Manager to Render.

## Deployment Options

The application can be deployed to Render with either:
1. SQLite database (simpler but less scalable)
2. PostgreSQL database (more scalable and robust)

## Quick Deployment Steps

### Option 1: Deploy with PostgreSQL (Recommended)

1. Create a Secret Group in Render named `wctapp-secrets` with the following secrets:
   - `JWT_SECRET`: Your JWT secret
   - `POSTGRES_USER`: Username for PostgreSQL
   - `POSTGRES_PASSWORD`: Password for PostgreSQL
   - `POSTGRES_DB`: Database name (e.g., `wctdb`)
   - `POSTGRES_HOST`: This will be automatically set by Render, but you can use `wctdb.internal` as a placeholder

2. Run the deployment helper script:
   ```bash
   npm run deploy:render
   ```

3. Follow the instructions provided by the script to deploy to Render.

### Option 2: Deploy with SQLite

1. Create a Secret Group in Render named `wctapp-secrets` with the following secret:
   - `JWT_SECRET`: Your JWT secret

2. Edit `render.yaml` to set `DB_TYPE` to `sqlite`.

3. Run the deployment helper script:
   ```bash
   npm run deploy:render
   ```

4. Follow the instructions provided by the script to deploy to Render.

## Detailed Documentation

For more detailed instructions, please refer to:

- [PostgreSQL Deployment Guide](./RENDER_POSTGRES_DEPLOYMENT.md): Comprehensive guide for deploying with PostgreSQL
- [SQLite Deployment Guide](./RENDER_DEPLOYMENT.md): Guide for deploying with SQLite

## Environment Variables

The application uses the following environment variables:

- `DB_TYPE`: Set to `postgres` for PostgreSQL or `sqlite` for SQLite
- `JWT_SECRET`: Secret key for JWT authentication
- `POSTGRES_*`: PostgreSQL connection parameters (when using PostgreSQL)
- `DATABASE_PATH`: Path to SQLite database file (when using SQLite)

## Testing the Deployment

After deployment, you can test the application by:

1. Navigating to your Render URL (e.g., https://wctapp.onrender.com)
2. Creating a new account or logging in with an existing account
3. Creating a test and adding questions to it

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Render logs for error messages
2. Verify that all environment variables are set correctly
3. Ensure the database is properly configured
4. Refer to the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues and solutions

## Local Development

For local development:

- With PostgreSQL: `npm run start:postgres`
- With SQLite: `npm run start:sqlite`
