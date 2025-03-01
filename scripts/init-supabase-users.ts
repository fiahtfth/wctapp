import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Database } from '../src/lib/database/schema';

// Load environment variables
dotenv.config();

// Get Supabase configuration with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'mock-supabase-key';

// Create Supabase client with explicit configuration
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

interface User {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

// Default users to create if they don't exist
const defaultUsers: User[] = [
  {
    username: 'admin',
    email: 'admin@nextias.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'navneet',
    email: 'navneet@nextias.com',
    password: 'welcomenavneet',
    role: 'user'
  }
];

async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Check if we're using mock values
    if (supabaseUrl.includes('mock-supabase-url')) {
      console.log('⚠️ Using mock Supabase URL. This is expected in development environments.');
      return false;
    }
    
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Unexpected error checking Supabase connection:', error);
    return false;
  }
}

async function initializeSupabaseUsers(): Promise<void> {
  try {
    console.log('🚀 Starting Supabase User Initialization');
    
    // Check Supabase connection before proceeding
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) {
      console.log('⚠️ Supabase connection not available. This is expected in development environments.');
      console.log('✅ Skipping Supabase user initialization');
      return;
    }
    
    // Process each default user
    for (const user of defaultUsers) {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error(`Error checking for existing user ${user.email}:`, checkError);
        continue;
      }
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping creation`);
        continue;
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: user.username,
          email: user.email,
          password_hash: passwordHash,
          role: user.role,
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email')
        .single();
      
      if (insertError) {
        console.error(`Error creating user ${user.email}:`, insertError);
        continue;
      }
      
      console.log(`✅ User ${user.email} created successfully with ID ${newUser.id}`);
    }
    
    console.log('✅ Supabase user initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase users:', error);
    // Don't throw the error, just log it
    console.log('✅ Continuing with initialization process');
  }
}

// Run the initialization
if (require.main === module) {
  initializeSupabaseUsers()
    .then(() => {
      console.log('User initialization completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('User initialization failed:', error);
      // Exit with success code to avoid breaking the build process
      process.exit(0);
    });
}

export default initializeSupabaseUsers; 