import getSupabaseClient from './supabaseClient';
import bcrypt from 'bcryptjs';
import { User } from '@/types/user';

// Get the admin client for server-side operations
const supabaseAdmin = getSupabaseClient();

/**
 * Creates the default admin user if it doesn't already exist
 * This function is used to initialize the database with a default admin user
 * when the application is first set up.
 */
export async function createDefaultAdminIfNeeded(): Promise<{ 
  success: boolean; 
  user?: User; 
  error?: string 
}> {
  try {
    console.log('Checking if default admin user needs to be created');
    
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase admin client is not available'
      };
    }
    
    // First, check if the users table exists
    const { error: tableCheckError } = await supabaseAdmin.from('users').select('count').limit(1);
    
    // If the table doesn't exist, create it
    if (tableCheckError && tableCheckError.message.includes('relation "users" does not exist')) {
      console.log('Users table does not exist, creating it');
      
      // Create the users table
      const { error: createTableError } = await supabaseAdmin.rpc('create_users_table');
      
      if (createTableError) {
        console.error('Failed to create users table:', createTableError);
        
        // If the RPC function doesn't exist, we can't create the table directly from here
        // This would typically be handled by a migration script or SQL function
        return { 
          success: false, 
          error: `Failed to create users table: ${createTableError.message}. Please run the database migrations or setup script.` 
        };
      }
    }
    
    // Check if admin user already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking for existing admin:', checkError);
      return { 
        success: false, 
        error: `Error checking for existing admin: ${checkError.message}` 
      };
    }
    
    // If admin already exists, return success
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('Admin user already exists');
      return { 
        success: true, 
        user: existingAdmins[0] as User 
      };
    }
    
    // Create default admin user
    console.log('Creating default admin user');
    
    // Get default admin credentials from environment variables or use defaults
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, salt);
    
    // Insert the admin user
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          username: defaultAdminUsername,
          email: defaultAdminEmail,
          password_hash: hashedPassword,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating default admin:', insertError);
      return { 
        success: false, 
        error: `Error creating default admin: ${insertError.message}` 
      };
    }
    
    console.log('Default admin user created successfully');
    return { 
      success: true, 
      user: newAdmin as User 
    };
  } catch (error) {
    console.error('Unexpected error in createDefaultAdminIfNeeded:', error);
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Checks if all required database tables exist and are properly configured
 * This function is used to verify the database setup
 */
export async function checkDatabaseTables(): Promise<{ 
  success: boolean; 
  message: string;
  tables?: { name: string; exists: boolean }[];
  error?: string 
}> {
  try {
    console.log('Checking database tables');
    
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Database check failed',
        error: 'Supabase admin client is not available'
      };
    }
    
    // List of tables to check
    const requiredTables = [
      'users',
      'questions',
      'tests',
      'cart_questions',
      'user_tokens'
    ];
    
    const tableStatus = [];
    let allTablesExist = true;
    
    // Check each table
    for (const tableName of requiredTables) {
      // Try to select a single row to check if table exists
      const { error } = await supabaseAdmin.from(tableName).select('*').limit(1);
      
      const exists = !error || !error.message.includes('does not exist');
      tableStatus.push({ name: tableName, exists });
      
      if (!exists) {
        allTablesExist = false;
      }
    }
    
    return {
      success: allTablesExist,
      message: allTablesExist 
        ? 'All required database tables exist' 
        : 'Some required database tables are missing',
      tables: tableStatus
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      success: false,
      message: 'Database check failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 