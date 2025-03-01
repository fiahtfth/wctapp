-- Direct SQL to create the necessary tables
-- Run this manually in the Supabase SQL editor

-- Create carts table if it doesn't exist
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  test_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS carts_test_id_idx ON carts(test_id);
CREATE INDEX IF NOT EXISTS carts_user_id_idx ON carts(user_id);

-- Create cart_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS cart_items_question_id_idx ON cart_items(question_id);

-- Create a simple questions table if it doesn't exist (for testing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
    CREATE TABLE questions (
      id SERIAL PRIMARY KEY,
      text TEXT,
      subject TEXT,
      topic TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert test questions if table is empty
    INSERT INTO questions (id, text, subject, topic)
    SELECT 1001, 'Test question 1', 'Math', 'Algebra'
    WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1);
    
    INSERT INTO questions (id, text, subject, topic)
    SELECT 1002, 'Test question 2', 'Science', 'Physics'
    WHERE NOT EXISTS (SELECT 1 FROM questions WHERE id = 1002);
  END IF;
END
$$; 