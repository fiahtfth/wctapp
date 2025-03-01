-- Create a function to create the necessary tables
CREATE OR REPLACE FUNCTION create_tables_if_not_exist()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  carts_exists boolean;
  cart_items_exists boolean;
BEGIN
  -- Check if carts table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'carts'
  ) INTO carts_exists;
  
  -- Check if cart_items table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cart_items'
  ) INTO cart_items_exists;
  
  -- Create carts table if it doesn't exist
  IF NOT carts_exists THEN
    EXECUTE '
      CREATE TABLE public.carts (
        id SERIAL PRIMARY KEY,
        test_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        metadata JSONB DEFAULT ''{}'',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_carts_user_id ON public.carts(user_id);
      CREATE INDEX idx_carts_test_id ON public.carts(test_id);
    ';
  END IF;
  
  -- Create cart_items table if it doesn't exist
  IF NOT cart_items_exists THEN
    EXECUTE '
      CREATE TABLE public.cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
      CREATE INDEX idx_cart_items_question_id ON public.cart_items(question_id);
    ';
  END IF;
  
  RETURN true;
END;
$$; 