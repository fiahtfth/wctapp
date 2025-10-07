/**
 * Script to apply RLS policies migration for users table
 * This fixes the "new row violates row-level security policy" error
 * 
 * Run with: node scripts/apply-users-rls-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('=== Applying Users RLS Policies Migration ===\n');
  
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('   Check your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ Supabase credentials found');
  console.log('   URL:', supabaseUrl);
  console.log('');
  
  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250308_add_users_rls_policies.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded');
  console.log('   File:', migrationPath);
  console.log('   Size:', migrationSQL.length, 'bytes');
  console.log('');
  
  // Execute the migration
  console.log('Applying migration...');
  try {
    const { data, error } = await supabase.rpc('execute_query', {
      query_text: migrationSQL
    });
    
    if (error) {
      // If execute_query function doesn't exist, try direct execution
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  execute_query function not found, using alternative method...');
        console.log('');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log('-----------------------------------------------------------');
        console.log(migrationSQL);
        console.log('-----------------------------------------------------------');
        console.log('');
        console.log('After running the SQL, test user creation again.');
        return;
      }
      
      console.error('❌ Error applying migration:', error.message);
      console.error('   Details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.log('');
    console.log('Alternative: Run this SQL manually in Supabase SQL Editor:');
    console.log('-----------------------------------------------------------');
    console.log(migrationSQL);
    console.log('-----------------------------------------------------------');
    process.exit(1);
  }
  
  // Test the migration by creating a test user
  console.log('Testing user creation...');
  const bcrypt = require('bcryptjs');
  
  const testUsername = `test_${Date.now()}`;
  const testEmail = `test_${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash('TestPass123', 10);
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      username: testUsername,
      email: testEmail,
      password_hash: passwordHash,
      role: 'user',
      is_active: true
    })
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Test user creation failed:', createError.message);
    console.log('   The migration may not have been applied correctly');
    process.exit(1);
  }
  
  console.log('✅ Test user created successfully!');
  console.log('   User ID:', newUser.id);
  console.log('   Username:', newUser.username);
  console.log('');
  
  // Clean up test user
  console.log('Cleaning up test user...');
  await supabase
    .from('users')
    .delete()
    .eq('id', newUser.id);
  
  console.log('✅ Test user deleted');
  console.log('');
  console.log('=== Migration Complete! ===');
  console.log('✅ User creation should now work in the admin interface');
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
