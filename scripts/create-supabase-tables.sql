-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Add row level security policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for admins (can see all users)
CREATE POLICY admin_all_users ON public.users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy for users (can only see their own data)
-- Fixed type casting to avoid the "operator does not exist: text = uuid" error
CREATE POLICY user_own_data ON public.users
  FOR SELECT
  TO authenticated
  USING (id::text = (auth.uid())::text);

-- Comment on table and columns for better documentation
COMMENT ON TABLE public.users IS 'Stores user accounts for the WCT Exam Creator application';
COMMENT ON COLUMN public.users.id IS 'Primary key and unique identifier for each user';
COMMENT ON COLUMN public.users.username IS 'User''s display name';
COMMENT ON COLUMN public.users.email IS 'User''s email address (must be unique)';
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN public.users.role IS 'User role (admin or user)';
COMMENT ON COLUMN public.users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN public.users.last_login IS 'Timestamp of the user''s last login';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the user was last updated';