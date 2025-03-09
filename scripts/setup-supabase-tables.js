#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function setupSupabaseTables() {
  console.log('Starting Supabase tables setup...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Service Role Key: ${serviceRoleKey.substring(0, 5)}...${serviceRoleKey.substring(serviceRoleKey.length - 5)}`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Create users table using direct SQL
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          username TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE
        );
      `
    });
    
    if (usersError) {
      console.warn('Error using RPC to create users table:', usersError.message);
      console.log('Trying direct SQL query...');
      
      // Try direct SQL query
      const { error: directError } = await supabase.from('users').select('count(*)').limit(1);
      
      if (directError && directError.code === '42P01') {
        console.error('Users table does not exist and could not be created automatically.');
        console.error('Please create the users table manually in the Supabase dashboard.');
        console.error('SQL for users table:');
        console.error(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
          );
        `);
        process.exit(1);
      }
    }
    
    // Create refresh_tokens table using direct SQL
    console.log('Creating refresh_tokens table...');
    const { error: tokensError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          revoked BOOLEAN NOT NULL DEFAULT false,
          UNIQUE(token)
        );
      `
    });
    
    if (tokensError) {
      console.warn('Error using RPC to create refresh_tokens table:', tokensError.message);
      console.log('Trying direct SQL query...');
      
      // Try direct SQL query
      const { error: directError } = await supabase.from('refresh_tokens').select('count(*)').limit(1);
      
      if (directError && directError.code === '42P01') {
        console.error('Refresh tokens table does not exist and could not be created automatically.');
        console.error('Please create the refresh_tokens table manually in the Supabase dashboard.');
        console.error('SQL for refresh_tokens table:');
        console.error(`
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            revoked BOOLEAN NOT NULL DEFAULT false,
            UNIQUE(token)
          );
        `);
      }
    }
    
    // Create carts table using direct SQL
    console.log('Creating carts table...');
    const { error: cartsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS carts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          session_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (cartsError) {
      console.warn('Error using RPC to create carts table:', cartsError.message);
      console.log('Trying direct SQL query...');
      
      // Try direct SQL query
      const { error: directError } = await supabase.from('carts').select('count(*)').limit(1);
      
      if (directError && directError.code === '42P01') {
        console.error('Carts table does not exist and could not be created automatically.');
        console.error('Please create the carts table manually in the Supabase dashboard.');
        console.error('SQL for carts table:');
        console.error(`
          CREATE TABLE IF NOT EXISTS carts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            session_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
      }
    }
    
    // Create cart_items table using direct SQL
    console.log('Creating cart_items table...');
    const { error: cartItemsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cart_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (cartItemsError) {
      console.warn('Error using RPC to create cart_items table:', cartItemsError.message);
      console.log('Trying direct SQL query...');
      
      // Try direct SQL query
      const { error: directError } = await supabase.from('cart_items').select('count(*)').limit(1);
      
      if (directError && directError.code === '42P01') {
        console.error('Cart items table does not exist and could not be created automatically.');
        console.error('Please create the cart_items table manually in the Supabase dashboard.');
        console.error('SQL for cart_items table:');
        console.error(`
          CREATE TABLE IF NOT EXISTS cart_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
      }
    }
    
    // Check if admin user exists
    console.log('Checking if admin user exists...');
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@nextias.com')
      .single();
    
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error('Error checking admin user:', adminCheckError);
    }
    
    // Create admin user if it doesn't exist
    if (!adminUser) {
      console.log('Creating admin user...');
      
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      // Insert admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          email: 'admin@nextias.com',
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Failed to create admin user:', insertError);
        process.exit(1);
      }
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Supabase tables setup completed successfully');
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
    process.exit(1);
  }
}

// Run the setup function
setupSupabaseTables().catch(error => {
  console.error('Unhandled error during setup:', error);
  process.exit(1);
}); 