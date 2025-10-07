// This script creates a regular user in the database
// Run with: node scripts/create-user.js

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
// Prefer .env.local to match Next.js local development behavior
require('dotenv').config({ path: '.env.local' });

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple CLI arg parser: --email, --username, --password, --role
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// User details (CLI args override env, which override defaults)
const userEmail = getArg('email') || process.env.USER_EMAIL || 'user@example.com';
const userUsername = getArg('username') || process.env.USER_USERNAME || 'user';
const userPassword = getArg('password') || process.env.USER_PASSWORD || 'user123';
const userRole = getArg('role') || process.env.USER_ROLE || 'user';

async function createUser() {
  try {
    console.log('Creating regular user...');
    console.log(`Email: ${userEmail}`);
    console.log(`Username: ${userUsername}`);
    console.log(`Password: ${userPassword}`);
    console.log(`Role: ${userRole}`);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userPassword, salt);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      console.log('User already exists. Updating password...');
      
      // Update the existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username: userUsername,
          password_hash: passwordHash,
          role: userRole,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }
      
      console.log('User updated successfully');
      return;
    }

    // Create the user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userEmail,
          username: userUsername,
          password_hash: passwordHash,
          role: userRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    console.log('User created successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser(); 