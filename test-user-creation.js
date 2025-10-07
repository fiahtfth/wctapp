/**
 * Test script to verify user creation is working with Supabase
 * Run with: node test-user-creation.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function testUserCreation() {
  console.log('=== Testing User Creation in Supabase ===\n');
  
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created\n');
  
  // Test 1: Check if users table exists
  console.log('Test 1: Checking if users table exists...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing users table:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('\n⚠️  Users table does not exist. Run migrations first.');
      }
      return;
    }
    console.log('✅ Users table exists\n');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return;
  }
  
  // Test 2: Count existing users
  console.log('Test 2: Counting existing users...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Error counting users:', error.message);
      return;
    }
    
    console.log(`✅ Found ${data.length} users in database`);
    if (data.length > 0) {
      console.log('   Existing users:');
      data.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}`);
      });
    }
    console.log('');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return;
  }
  
  // Test 3: Try to create a test user
  console.log('Test 3: Creating a test user...');
  const testUsername = `testuser_${Date.now()}`;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(testPassword, 10);
    console.log('✅ Password hashed');
    
    // Insert the user
    const { data, error } = await supabase
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
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ User created successfully!');
    console.log('   User ID:', data.id);
    console.log('   Username:', data.username);
    console.log('   Email:', data.email);
    console.log('   Role:', data.role);
    console.log('');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return;
  }
  
  // Test 4: Verify the user was created
  console.log('Test 4: Verifying user was created...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (error) {
      console.error('❌ Error fetching created user:', error.message);
      return;
    }
    
    console.log('✅ User verified in database');
    console.log('   Username:', data.username);
    console.log('   Email:', data.email);
    console.log('   Created at:', data.created_at);
    console.log('');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return;
  }
  
  // Test 5: Clean up - delete the test user
  console.log('Test 5: Cleaning up test user...');
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', testEmail);
    
    if (error) {
      console.error('❌ Error deleting test user:', error.message);
      console.log('   You may need to manually delete user:', testEmail);
      return;
    }
    
    console.log('✅ Test user deleted successfully\n');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return;
  }
  
  console.log('=== All Tests Completed Successfully! ===');
  console.log('\n✅ User creation is working correctly with Supabase');
  console.log('✅ The admin user management interface should work properly');
}

// Run the tests
testUserCreation().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
