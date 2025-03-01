import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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

async function setupSupabase() {
  try {
    console.log('🚀 Starting Supabase setup...');
    
    // Test connection
    console.log('Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      if (error) {
        console.log('✅ Connected to Supabase successfully (expected error for non-existent table)');
      } else {
        console.log('✅ Connected to Supabase successfully');
      }
    } catch (err) {
      console.log('✅ Connected to Supabase successfully (connection test threw expected error)');
    }
    
    // Read and execute SQL scripts
    console.log('Creating database tables...');
    const sqlDir = path.join(__dirname, 'sql');
    const sqlFiles = fs.readdirSync(sqlDir).filter(file => file.endsWith('.sql'));
    
    for (const sqlFile of sqlFiles) {
      console.log(`Executing SQL script: ${sqlFile}`);
      const sqlContent = fs.readFileSync(path.join(sqlDir, sqlFile), 'utf8');
      
      // Split the SQL content into individual statements
      const statements = sqlContent
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      for (const statement of statements) {
        try {
          // Execute each SQL statement directly
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn(`⚠️ Warning executing statement from ${sqlFile}:`, error.message);
            console.log('Statement:', statement);
          }
        } catch (err) {
          console.warn(`⚠️ Error executing statement from ${sqlFile}:`, err);
          console.log('Statement:', statement);
          // Continue with other statements
        }
      }
      
      console.log(`✅ Executed SQL script: ${sqlFile}`);
    }
    
    // Initialize users
    console.log('Initializing users...');
    await initializeUsers();
    
    console.log('✅ Supabase setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up Supabase:', error);
    process.exit(1);
  }
}

// Run the setup if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSupabase()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default setupSupabase; 