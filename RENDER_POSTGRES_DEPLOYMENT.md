# Deploying to Render with PostgreSQL

This document outlines the steps to deploy the WCT application to Render using PostgreSQL as the database.

## Prerequisites

- A Render account (sign up at [render.com](https://render.com))
- Git repository with your application code

## Deployment Steps

### 1. Create a Secret Group in Render

1. Go to the Render Dashboard
2. Navigate to "Secrets" in the left sidebar
3. Click "New Secret Group"
4. Name it `wctapp-secrets`
5. Add the following secrets:
   - `JWT_SECRET`: Your JWT secret (e.g., `66J5NovcG/rEn1luBGDyKG7DjtfrrRs/TR9VsDg7guM=`)
   - `POSTGRES_USER`: Username for PostgreSQL (e.g., `postgres`)
   - `POSTGRES_PASSWORD`: Password for PostgreSQL
   - `POSTGRES_DB`: Database name (e.g., `wctdb`)
   - `POSTGRES_HOST`: This will be automatically set by Render, but you can use `wctdb.internal` as a placeholder

### 2. Deploy Using render.yaml

1. Make sure your repository contains the updated `render.yaml` file
2. Go to the Render Dashboard
3. Click "New" > "Blueprint"
4. Connect your repository
5. Render will automatically detect the `render.yaml` file and set up the services:
   - A web service for the Next.js application
   - A PostgreSQL database service
6. Click "Apply" to start the deployment

### 3. Environment Configuration

The following environment variables are configured in the `render.yaml` file:

- `NODE_ENV`: Set to `production`
- `DATABASE_PATH`: Still included for SQLite fallback
- `DATABASE_URL`: Still included for SQLite fallback
- `JWT_SECRET`: Pulled from the `wctapp-secrets` secret group
- `NEXT_PUBLIC_SITE_URL`: Set to your Render app URL
- `RENDER`: Set to `true` to indicate the Render environment
- `DB_TYPE`: Set to `postgres` to use PostgreSQL
- `POSTGRES_USER`: Pulled from the `wctapp-secrets` secret group
- `POSTGRES_PASSWORD`: Pulled from the `wctapp-secrets` secret group
- `POSTGRES_HOST`: Pulled from the `wctapp-secrets` secret group
- `POSTGRES_DB`: Pulled from the `wctapp-secrets` secret group
- `POSTGRES_PORT`: Set to `5432` (default PostgreSQL port)

### 4. Database Migration

The `render-build.js` script has been updated to handle PostgreSQL migration. During the build process:

1. The script detects the database type from the `DB_TYPE` environment variable
2. If using PostgreSQL, it waits for the PostgreSQL service to be ready
3. It then runs the migration script to create tables and transfer data

### 5. Connecting to the PostgreSQL Database

Render automatically connects your web service to the PostgreSQL service. The connection details are:

- Host: `wctdb.internal` (internal hostname within Render)
- Port: `5432` (default PostgreSQL port)
- User: Value from `POSTGRES_USER` secret
- Password: Value from `POSTGRES_PASSWORD` secret
- Database: Value from `POSTGRES_DB` secret

### 6. Troubleshooting

If you encounter any issues with the PostgreSQL database:

1. Check the Render logs for any error messages
2. Verify that the PostgreSQL service is running
3. Check that the migration script ran successfully during deployment
4. Ensure the connection parameters are correct

Common issues:

- **Migration Errors**: If the migration fails, you may need to manually run the migration script from the Render shell
- **Connection Issues**: Ensure the `POSTGRES_HOST` is set correctly to the internal hostname
- **Permission Issues**: Verify that the PostgreSQL user has the necessary permissions

### 7. Manual Migration (if needed)

If you need to manually run the migration:

1. Go to the Render Dashboard
2. Navigate to your web service
3. Click on "Shell"
4. Run the following commands:
   ```bash
   export DB_TYPE=postgres
   npm run migrate:postgres
   ```

### 8. Monitoring Database Usage

Render's free PostgreSQL plan includes:

- 1GB storage
- 10 million rows
- Automatic daily backups (retained for 7 days)

To monitor your database usage:

1. Go to the Render Dashboard
2. Navigate to your PostgreSQL service
3. Click on "Metrics" to view usage statistics

### 9. Switching Between SQLite and PostgreSQL

The application is designed to work with both SQLite and PostgreSQL. To switch between them:

1. Update the `DB_TYPE` environment variable in the Render Dashboard:
   - Set to `postgres` for PostgreSQL
   - Set to `sqlite` for SQLite

2. Restart the web service to apply the changes

## Local Development

For local development with PostgreSQL:

1. Install PostgreSQL locally
2. Create a `.env.local` file with the following variables:
   ```
   DB_TYPE=postgres
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   POSTGRES_HOST=localhost
   POSTGRES_DB=wctdb
   POSTGRES_PORT=5432
   ```
3. Run the migration script:
   ```bash
   npm run migrate:postgres
   ```
4. Start the application with PostgreSQL:
   ```bash
   npm run start:postgres
   ```

## Conclusion

By following these steps, you'll have a fully functional deployment of the WCT application on Render using PostgreSQL as the database. The application will automatically handle the database connection based on the environment variables, making it easy to switch between SQLite and PostgreSQL as needed.
