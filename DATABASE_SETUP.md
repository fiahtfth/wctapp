# Database Setup Instructions

## Fixing the "Failed to save draft cart due to a database error" Issue

If you're encountering the error "Failed to save draft cart due to a database error", it's likely because the necessary database tables don't exist in your Supabase database. Follow these steps to fix the issue:

### Option 1: Run the SQL Migration Directly

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the following SQL code:

```sql
-- Create carts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.carts (
  id SERIAL PRIMARY KEY,
  test_id TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for carts
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_test_id ON public.carts(test_id);

-- Create cart_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
);

-- Create indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_question_id ON public.cart_items(question_id);
```

4. Click "Run" to execute the SQL

### Option 2: Use the Supabase CLI

If you have the Supabase CLI installed, you can run the migration file directly:

```bash
supabase db push --db-url=YOUR_SUPABASE_DB_URL
```

### Option 3: Use the Application's Auto-Creation Feature

The application has been updated to attempt to create the necessary tables automatically when you try to save a draft cart. This approach might work in some cases, but it's more reliable to use one of the options above.

## Verifying the Fix

After running the SQL, try saving a draft cart again. The error should be resolved, and your cart should be saved successfully.

## Database Schema

The database schema includes:

### `carts` Table
- `id`: Serial primary key
- `test_id`: Unique text identifier for the test
- `user_id`: Integer reference to the user who created the cart
- `metadata`: JSONB field containing test details (name, batch, date)
- `created_at`: Timestamp of creation

### `cart_items` Table
- `id`: Serial primary key
- `cart_id`: Foreign key reference to the carts table
- `question_id`: Integer reference to the question
- `created_at`: Timestamp of creation

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify that your Supabase database is accessible
3. Ensure that the user has permission to create tables in the database
4. Check if there are any foreign key constraint issues (e.g., referenced questions don't exist)

For further assistance, please contact the system administrator. 