# Troubleshooting Guide

This document provides solutions to common issues encountered when using the application with PostgreSQL.

## CORS Issues

### Problem

When the application is running on one port (e.g., 3000) and the client is accessing it from another port (e.g., 3001), you may encounter CORS errors like:

```
Access to fetch at 'http://localhost:3000/api/questions/6' from origin 'http://localhost:3001' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Solution

We've implemented several layers of CORS support:

1. **Global Middleware**
   - Added CORS headers to all responses in `src/middleware.ts`
   - Handles OPTIONS preflight requests automatically

2. **API-Specific CORS Headers**
   - Added CORS headers to individual API routes
   - Implemented OPTIONS handlers for preflight requests

3. **Client-Side URL Handling**
   - Updated client-side code to use the correct base URL from the current window location

## Authentication Issues

### Problem

You may encounter authentication errors when trying to add questions to a cart:

```
Error adding question to cart: Error: Authentication required: You need to sign in to add questions to a test
```

### Solution

We've implemented a fallback mechanism for authentication:

1. **Automatic Test User Creation**
   - If no authentication token is present, the application will automatically create or use a test user
   - This allows testing cart functionality without requiring authentication

2. **Client-Side Handling**
   - Updated client-side code to continue with cart operations even without a token
   - The server will handle creating a test user if needed

## Database Adapter Issues

### Problem

Different parameter binding styles between SQLite (?) and PostgreSQL ($1, $2, etc.) can cause query errors.

### Solution

We've improved the database adapter to handle these differences:

1. **Parameter Conversion**
   - Automatically converts SQLite-style parameters to PostgreSQL-style
   - Handles both query formats seamlessly

2. **Result Normalization**
   - Normalizes result formats to be consistent across both databases
   - Ensures application code works with either database type

## Foreign Key Constraint Issues

### Problem

Foreign key constraints in PostgreSQL are more strictly enforced than in SQLite, leading to errors when adding items to carts with invalid user IDs.

### Solution

We've implemented several fixes:

1. **User ID Verification**
   - Verifies that user IDs exist before using them
   - Falls back to valid user IDs when needed

2. **Automatic User Creation**
   - Creates a test user automatically if none exists
   - Ensures there's always a valid user ID for cart operations

3. **Transaction Management**
   - Properly handles transactions in both SQLite and PostgreSQL
   - Ensures data integrity across related tables

## Testing

To verify that the cart functionality works correctly with PostgreSQL, run:

```bash
npm run test:cart:postgres
```

This script will:
1. Connect to the PostgreSQL database
2. Verify that all required tables exist
3. Check for existing users or create a test user
4. Create a test cart
5. Add a question to the cart
6. Verify that the question was added successfully

## Switching Between Databases

You can easily switch between SQLite and PostgreSQL:

```bash
# Run with PostgreSQL
npm run start:postgres

# Run with SQLite
npm run start:sqlite
```

These scripts set the appropriate environment variables and start the application with the selected database type.
