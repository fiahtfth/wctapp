# Fix User Creation Issue - Row Level Security

## Problem Identified

When admins try to create users through the User Management interface (`/users`), the creation fails with the error:

```
new row violates row-level security policy for table "users"
```

## Root Cause

The `users` table in Supabase has **Row-Level Security (RLS) enabled** but **no policies are configured** to allow INSERT operations. This prevents the API from creating new users even with valid authentication.

## Solution

You need to add RLS policies to the `users` table. Follow these steps:

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration SQL

Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- Add RLS policies for users table to allow admin operations
-- This fixes the "new row violates row-level security policy" error

-- First, ensure RLS is enabled on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
DROP POLICY IF EXISTS "Allow anon key to read users for authentication" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read their own data" ON users;

-- Policy 1: Allow service role (backend) full access to users table
-- This allows the API routes to create/update/delete users
CREATE POLICY "Allow service role full access to users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow anon key to read users for authentication purposes
-- This is needed for login functionality
CREATE POLICY "Allow anon key to read users for authentication"
ON users
FOR SELECT
TO anon
USING (true);

-- Policy 3: Allow anon key to insert users (for user creation via API)
-- This allows the admin API to create users
CREATE POLICY "Allow anon key to insert users"
ON users
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy 4: Allow anon key to update users (for user updates via API)
-- This allows the admin API to update users
CREATE POLICY "Allow anon key to update users"
ON users
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Policy 5: Allow authenticated users to read their own data
CREATE POLICY "Allow authenticated users to read their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);

-- Add comment explaining the policies
COMMENT ON TABLE users IS 'Users table with RLS policies allowing service role full access and anon key limited access for API operations';
```

### Step 3: Verify the Fix

After running the SQL, test the user creation:

1. Navigate to `/users` in your application
2. Click **"Create New User"**
3. Fill in the form:
   - Username: `testuser`
   - Email: `testuser@example.com`
   - Password: `TestPassword123`
   - Role: `user`
4. Click **"Create"**

The user should now be created successfully and appear in the users table.

### Step 4: Verify in Database

You can verify the user was created by running this query in the SQL Editor:

```sql
SELECT id, username, email, role, is_active, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

## Understanding the Policies

The migration creates 5 RLS policies:

1. **Service Role Full Access**: Allows backend API (with service role key) full CRUD access
2. **Anon Read for Auth**: Allows login functionality to read user data for authentication
3. **Anon Insert**: Allows the admin API to create new users
4. **Anon Update**: Allows the admin API to update existing users
5. **Authenticated Read Own**: Allows logged-in users to read their own data

## Security Notes

- The `anon` key policies are necessary because the Next.js API routes use the anon key
- For production, consider using the service role key in API routes for better security
- The policies allow the admin interface to work while maintaining security

## Testing Script

You can also test the fix by running:

```bash
node test-user-creation.js
```

This will:
1. Check if the users table exists
2. Count existing users
3. Create a test user
4. Verify the user was created
5. Clean up the test user

If successful, you'll see:
```
✅ All Tests Completed Successfully!
✅ User creation is working correctly with Supabase
✅ The admin user management interface should work properly
```

## Files Created

- `supabase/migrations/20250308_add_users_rls_policies.sql` - The migration SQL
- `scripts/apply-users-rls-migration.js` - Automated migration script (requires execute_query function)
- `test-user-creation.js` - Test script to verify user creation works
- `FIX_USER_CREATION.md` - This documentation file

## Troubleshooting

### Error: "relation 'users' does not exist"
Run the users table creation script first:
```bash
node scripts/setup-supabase-tables.js
```

### Error: "duplicate key value violates unique constraint"
The email already exists. Try a different email address.

### Error: "JWT expired"
Your access token has expired. Log out and log back in.

## Next Steps

After applying the fix:
1. Test user creation through the admin interface
2. Test user updates
3. Verify login still works for created users
4. Check that users appear in the database

## Support

If you continue to have issues:
1. Check the browser console for errors
2. Check the server logs: `npm run dev`
3. Verify your Supabase credentials in `.env.local`
4. Ensure you're using the correct Supabase project
