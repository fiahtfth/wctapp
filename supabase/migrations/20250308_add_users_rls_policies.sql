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
