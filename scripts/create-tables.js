import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function createUsersTable() {
  console.log('Creating users table directly...');
  
  try {
    // Check if the table exists
    const { error } = await supabase.from('users').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Users table does not exist, creating it...');
      
      // Create the table using raw SQL
      const createTableQuery = `
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
      `;
      
      // Execute the query directly using Supabase's REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'X-Client-Info': 'supabase-js/2.0.0'
        },
        body: JSON.stringify({
          query: createTableQuery
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating users table:', errorData);
      } else {
        console.log('Users table created successfully');
      }
    } else if (error) {
      console.error('Error checking users table:', error);
    } else {
      console.log('Users table already exists');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createUsersTable().catch(console.error); 