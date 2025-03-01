import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with proper authorization
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    
    if (!isDevEnvironment) {
      // In production, require authorization
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.SETUP_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Check if the carts table exists
    const { data: existingTables, error: tablesError } = await supabaseAdmin
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['carts', 'cart_items']);
    
    if (tablesError) {
      console.error('Error checking existing tables:', tablesError);
      return NextResponse.json({ error: 'Failed to check existing tables', details: tablesError }, { status: 500 });
    }
    
    const existingTableNames = existingTables?.map(t => t.tablename) || [];
    console.log('Existing tables:', existingTableNames);
    
    let tablesCreated = [];
    
    // Create carts table if it doesn't exist
    if (!existingTableNames.includes('carts')) {
      console.log('Creating carts table...');
      
      // Execute SQL directly
      const { error: createCartsError } = await supabaseAdmin.auth.admin.createUser({
        email: 'temp@example.com',
        password: 'temp_password',
        email_confirm: true,
      });
      
      if (createCartsError) {
        console.error('Error with admin access:', createCartsError);
      }
      
      // Use raw SQL query
      const { error: sqlError } = await supabaseAdmin.rpc('pg_catalog.pg_execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.carts (
            id SERIAL PRIMARY KEY,
            test_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
          CREATE INDEX IF NOT EXISTS idx_carts_test_id ON public.carts(test_id);
        `
      });
      
      if (sqlError) {
        console.error('Error creating carts table:', sqlError);
        
        // Try a different approach with direct SQL
        const { error: directSqlError } = await supabaseAdmin.from('_sql').rpc('execute', {
          query: `
            CREATE TABLE IF NOT EXISTS public.carts (
              id SERIAL PRIMARY KEY,
              test_id TEXT UNIQUE NOT NULL,
              user_id INTEGER NOT NULL,
              metadata JSONB DEFAULT '{}'::jsonb,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
            CREATE INDEX IF NOT EXISTS idx_carts_test_id ON public.carts(test_id);
          `
        });
        
        if (directSqlError) {
          console.error('Error with direct SQL execution:', directSqlError);
          return NextResponse.json({ 
            error: 'Failed to create carts table', 
            details: directSqlError 
          }, { status: 500 });
        }
      }
      
      tablesCreated.push('carts');
    }
    
    // Create cart_items table if it doesn't exist
    if (!existingTableNames.includes('cart_items')) {
      console.log('Creating cart_items table...');
      
      // Use raw SQL query
      const { error: sqlError } = await supabaseAdmin.rpc('pg_catalog.pg_execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.cart_items (
            id SERIAL PRIMARY KEY,
            cart_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
          );
          
          CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
          CREATE INDEX IF NOT EXISTS idx_cart_items_question_id ON public.cart_items(question_id);
        `
      });
      
      if (sqlError) {
        console.error('Error creating cart_items table:', sqlError);
        
        // Try a different approach with direct SQL
        const { error: directSqlError } = await supabaseAdmin.from('_sql').rpc('execute', {
          query: `
            CREATE TABLE IF NOT EXISTS public.cart_items (
              id SERIAL PRIMARY KEY,
              cart_id INTEGER NOT NULL,
              question_id INTEGER NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
            CREATE INDEX IF NOT EXISTS idx_cart_items_question_id ON public.cart_items(question_id);
          `
        });
        
        if (directSqlError) {
          console.error('Error with direct SQL execution:', directSqlError);
          return NextResponse.json({ 
            error: 'Failed to create cart_items table', 
            details: directSqlError 
          }, { status: 500 });
        }
      }
      
      tablesCreated.push('cart_items');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      tablesCreated
    });
  } catch (error) {
    console.error('Error in database setup API route:', error);
    return NextResponse.json({ 
      error: 'Failed to set up database', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 