# Deploying to Render with SQLite

This document outlines the steps to deploy the WCT application to Render using SQLite as the database.

## Prerequisites

- A Render account (sign up at [render.com](https://render.com))
- Git repository with your application code

## Deployment Steps

### 1. Create a Secret Group in Render

1. Go to the Render Dashboard
2. Navigate to "Secrets" in the left sidebar
3. Click "New Secret Group"
4. Name it `wctapp-secrets`
5. Add the following secret:
   - Key: `JWT_SECRET`
   - Value: Your JWT secret (e.g., `66J5NovcG/rEn1luBGDyKG7DjtfrrRs/TR9VsDg7guM=`)

### 2. Deploy Using render.yaml

1. Make sure your repository contains the `render.yaml` file
2. Go to the Render Dashboard
3. Click "New" > "Blueprint"
4. Connect your repository
5. Render will automatically detect the `render.yaml` file and set up the services
6. Click "Apply" to start the deployment

### 3. Environment Configuration

The following environment variables are configured in the `render.yaml` file:

- `NODE_ENV`: Set to `production`
- `DATABASE_PATH`: Set to `/opt/render/project/src/wct.db`
- `DATABASE_URL`: Set to `file:/opt/render/project/src/wct.db`
- `JWT_SECRET`: Pulled from the `wctapp-secrets` secret group
- `NEXT_PUBLIC_SITE_URL`: Set to your Render app URL
- `RENDER`: Set to `true` to indicate the Render environment

### 4. Database Persistence

The SQLite database is stored in the `/opt/render/project/src` directory, which is persistent across deployments and restarts. The `render-build.js` script ensures the database is properly set up during the build process.

### 5. Troubleshooting

If you encounter any issues with the database:

1. Check the Render logs for any error messages
2. Verify that the database file exists in the specified path
3. Ensure the database file has the correct permissions
4. Check that the `render-build.js` script ran successfully during deployment

## Local Development

For local development, the application will continue to use the local SQLite database file. The environment detection in the code ensures that the correct database path is used based on the environment.

## Switching Between Environments

The application is designed to work seamlessly in both Vercel and Render environments, as well as locally. The code detects the environment and uses the appropriate database path and configuration.
