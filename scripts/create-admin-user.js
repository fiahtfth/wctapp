// This script creates an admin user in the database
// Run with: node scripts/create-admin-user.js

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

// Admin user details
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    console.log(`Email: ${adminEmail}`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username: adminUsername,
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail);

      if (error) {
        throw new Error(`Failed to update admin user: ${error.message}`);
      }
      
      console.log('Admin user updated successfully');
      return;
    }

    // Create the admin user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: adminEmail,
          username: adminUsername,
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdminUser(); 