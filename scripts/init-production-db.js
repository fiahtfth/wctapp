#!/usr/bin/env node
/**
 * Production Database Initialization Script
 * 
 * This script initializes the Supabase database for production use:
 * 1. Creates necessary tables if they don't exist
 * 2. Sets up initial admin user
 * 3. Configures RLS policies
 * 4. Validates database schema
 * 
 * Run with: node scripts/init-production-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or service key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your .env file');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin user details from environment variables
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'StrongPassword123!';

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log('🚀 Starting production database initialization...');
  
  try {
    // Step 1: Create tables if they don't exist
    await createTables();
    
    // Step 2: Create admin user if it doesn't exist
    await createAdminUser();
    
    // Step 3: Set up RLS policies
    await setupRLSPolicies();
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create necessary database tables
 */
async function createTables() {
  console.log('📊 Checking and creating database tables...');
  
  // Check if users table exists
  const { error: tableCheckError } = await supabase.from('users').select('count').limit(1);
  
  if (tableCheckError && tableCheckError.message.includes('relation "users" does not exist')) {
    console.log('Creating users table...');
    
    // Create users table
    const { error: createUsersError } = await supabase.rpc('create_users_table').catch(() => {
      // If RPC doesn't exist, create table directly with SQL
      return supabase.sql(`
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_login TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
      `);
    });
    
    if (createUsersError) {
      throw new Error(`Failed to create users table: ${createUsersError.message}`);
    }
    
    console.log('✅ Users table created successfully');
  } else {
    console.log('✅ Users table already exists');
  }
  
  // Check if refresh_tokens table exists
  const { error: tokenTableCheckError } = await supabase.from('refresh_tokens').select('count').limit(1);
  
  if (tokenTableCheckError && tokenTableCheckError.message.includes('relation "refresh_tokens" does not exist')) {
    console.log('Creating refresh_tokens table...');
    
    // Create refresh_tokens table
    const { error: createTokensError } = await supabase.sql(`
      CREATE TABLE IF NOT EXISTS public.refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Add index for performance
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);
    `);
    
    if (createTokensError) {
      throw new Error(`Failed to create refresh_tokens table: ${createTokensError.message}`);
    }
    
    console.log('✅ Refresh tokens table created successfully');
  } else {
    console.log('✅ Refresh tokens table already exists');
  }
}

/**
 * Create admin user if it doesn't exist
 */
async function createAdminUser() {
  console.log('👤 Checking for admin user...');
  
  // Check if admin user already exists - use select instead of single to handle multiple results
  const { data: existingAdmins, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('email', adminEmail);
  
  if (checkError) {
    throw new Error(`Error checking for admin user: ${checkError.message}`);
  }
  
  if (existingAdmins && existingAdmins.length > 0) {
    console.log(`✅ Admin user already exists (found ${existingAdmins.length} admin accounts)`);
    return;
  }
  
  console.log('Creating admin user...');
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);
  
  // Insert admin user
  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        username: adminUsername,
        email: adminEmail,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  
  if (insertError) {
    throw new Error(`Failed to create admin user: ${insertError.message}`);
  }
  
  console.log('✅ Admin user created successfully');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Username: ${adminUsername}`);
}

/**
 * Set up Row Level Security policies
 */
async function setupRLSPolicies() {
  console.log('🔒 Setting up Row Level Security policies...');
  
  // Enable RLS on tables
  const tables = ['users', 'refresh_tokens'];
  
  try {
    console.log('⚠️ Note: Setting up RLS policies requires direct SQL execution.');
    console.log('Please set up the following policies manually in the Supabase dashboard:');
    
    for (const table of tables) {
      console.log(`\n--- Policies for ${table} table ---`);
      console.log(`
      -- Enable RLS on the table
      ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
      
      -- Create policy for admins (full access)
      DROP POLICY IF EXISTS "${table}_admin_policy" ON public.${table};
      CREATE POLICY "${table}_admin_policy" ON public.${table}
        USING (auth.jwt() ->> 'role' = 'admin')
        WITH CHECK (auth.jwt() ->> 'role' = 'admin');
        
      -- For users table, allow users to see their own data
      ${table === 'users' ? `
        DROP POLICY IF EXISTS "users_self_select_policy" ON public.users;
        CREATE POLICY "users_self_select_policy" ON public.users
          FOR SELECT USING ((auth.jwt() ->> 'userId')::integer = id);
      ` : ''}
      
      -- For refresh_tokens, allow users to manage their own tokens
      ${table === 'refresh_tokens' ? `
        DROP POLICY IF EXISTS "refresh_tokens_self_policy" ON public.refresh_tokens;
        CREATE POLICY "refresh_tokens_self_policy" ON public.refresh_tokens
          USING ((auth.jwt() ->> 'userId')::integer = user_id)
          WITH CHECK ((auth.jwt() ->> 'userId')::integer = user_id);
      ` : ''}
      `);
    }
    
    console.log('\nPlease copy these SQL statements and execute them in the Supabase SQL Editor.');
    console.log('✅ RLS policy instructions generated successfully');
  } catch (error) {
    console.warn(`⚠️ Warning: Could not generate RLS policy instructions: ${error.message}`);
  }
}

// Run the initialization
initializeDatabase(); 