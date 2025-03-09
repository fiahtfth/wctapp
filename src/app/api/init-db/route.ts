import { NextResponse } from 'next/server';
import getSupabaseClient from '@/lib/database/supabaseClient';

export async function GET() {
  try {
    console.log('Checking Supabase connection and tables...');
    
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return NextResponse.json({ 
        error: 'Failed to initialize Supabase client',
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }
    
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      
      // Check if the error is because the table doesn't exist
      if (error.message.includes('relation "users" does not exist')) {
        console.log('Users table does not exist, attempting to create it...');
        
        // Create users table
        const createUsersQuery = `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        try {
          await supabase.rpc('exec_sql', { sql: createUsersQuery });
          console.log('Users table created successfully');
        } catch (createError) {
          console.error('Failed to create users table:', createError);
          return NextResponse.json({ 
            error: 'Failed to create users table',
            details: createError instanceof Error ? createError.message : String(createError)
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Supabase connection error',
          details: error.message
        }, { status: 500 });
      }
    }
    
    console.log('Supabase connection successful');
    return NextResponse.json({ 
      message: 'Supabase connection successful',
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    }, { status: 200 });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed', 
      details: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
