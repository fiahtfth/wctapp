-- Direct SQL to create the necessary tables
-- Run this manually in the Supabase SQL editor

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