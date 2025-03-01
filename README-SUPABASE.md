# Supabase Setup for WCT Exam Creator

This document provides instructions for setting up Supabase for the WCT Exam Creator application.

## Prerequisites

- A Supabase account and project
- Access to the Supabase SQL Editor
- The project's environment variables properly configured in `.env`

## Setup Instructions

### 1. Create the Users Table

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `scripts/create-supabase-tables.sql` 
4. Paste it into the SQL Editor and run the query

This will create the `users` table with the necessary indexes, row-level security policies, and comments.

### 2. Initialize Default Users

After creating the table, you can initialize default users by running:

```bash
npm run init-supabase-users
```

This will create the following default users:
- Admin: admin@nextias.com / admin123
- Regular User: user1@example.com / user123

### 3. Configure the Application

To use the actual Supabase database instead of mock data:

1. Open the `.env` file
2. Set `USE_MOCK_DATA=false`
3. Restart the application

## Troubleshooting

### Error: "operator does not exist: text = uuid"

This error occurs when there's a type mismatch in the row-level security policy. The SQL script in this repository has been updated to fix this issue by properly casting the types:

```sql
USING (id::text = (auth.uid())::text);
```

### Error: "relation 'public.users' does not exist"

This error means the users table hasn't been created yet. Follow the steps in the "Create the Users Table" section above.

### Authentication Issues

If you're having authentication issues:

1. Make sure your Supabase URL and keys are correct in the `.env` file
2. Check that the users table exists and has the correct structure
3. Verify that the user you're trying to authenticate with exists in the database

## Manual Database Operations

You can perform manual operations on the database using the Supabase dashboard:

- **View Users**: Go to the Table Editor and select the `users` table
- **Add Users**: Use the Table Editor to insert new rows, or run SQL queries
- **Modify Users**: Update user records through the Table Editor or SQL

Remember to hash passwords using bcrypt before inserting them directly into the database.

## Switching Between Mock and Real Data

The application supports both mock data and real Supabase data:

- For development without Supabase: Set `USE_MOCK_DATA=true` in `.env`
- For production with Supabase: Set `USE_MOCK_DATA=false` in `.env`

This allows for flexible development and testing without requiring a Supabase connection at all times. 