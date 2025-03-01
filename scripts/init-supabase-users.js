import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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

// Default users to create if they don't exist
const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@nextias.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'user1',
    email: 'user1@example.com',
    password: 'user123',
    role: 'user'
  }
];

async function initializeUsers() {
  try {
    console.log('🚀 Starting user initialization');
    
    // Check if the users table exists
    const { error: tableCheckError } = await supabase.from('users').select('id').limit(1);
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.error('❌ Users table does not exist. Please create the table first using the SQL script.');
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
    
    console.log('✅ User initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeUsers()
    .then(() => {
      console.log('User initialization completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('User initialization failed:', error);
      process.exit(1);
    });
}

export default initializeUsers;