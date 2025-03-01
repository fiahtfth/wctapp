import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const results: any = {
      success: true,
      migrations: []
    };

    // Path to migrations directory
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // Check if directory exists
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({
        success: false,
        error: `Migrations directory not found: ${migrationsDir}`
      }, { status: 404 });
    }
    
    // Get all SQL files in the migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically
    
    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No SQL migration files found'
      }, { status: 404 });
    }
    
    // Execute each migration file
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        // Execute the SQL directly using the raw SQL method
        // @ts-ignore - Supabase client types may not include this method
        const { error } = await supabaseAdmin.from('questions').select('*').limit(0).then(() => {
          // If we can connect to the database, try to execute the SQL
          // @ts-ignore - Supabase client types may not include this method
          return supabaseAdmin.rpc('exec_sql', { sql }).catch(() => {
            // If the RPC method fails, try direct SQL execution
            // @ts-ignore - Supabase client types may not include this method
            return supabaseAdmin.sql(sql);
          });
        });
        
        if (error) {
          results.migrations.push({
            file,
            success: false,
            error: error.message
          });
          
          // Don't mark the overall process as failed if it's just the diagnostic functions
          // that already exist (to handle idempotent migrations)
          if (!error.message.includes('already exists') || 
              !file.includes('diagnostic_functions')) {
            results.success = false;
          }
        } else {
          results.migrations.push({
            file,
            success: true
          });
        }
      } catch (err) {
        results.migrations.push({
          file,
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
        results.success = false;
      }
    }
    
    // If no migrations succeeded, create the cart tables directly
    if (results.migrations.length === 0 || !results.success) {
      try {
        const createTablesSql = `
          -- Create carts table
          CREATE TABLE IF NOT EXISTS carts (
            id SERIAL PRIMARY KEY,
            test_id TEXT,
            user_id TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create index on test_id for faster lookups
          CREATE INDEX IF NOT EXISTS carts_test_id_idx ON carts(test_id);
          
          -- Create cart_items table
          CREATE TABLE IF NOT EXISTS cart_items (
            id SERIAL PRIMARY KEY,
            cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
            question_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create index on cart_id for faster lookups
          CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
          
          -- Create questions table if needed for testing
          CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            text TEXT,
            subject TEXT,
            topic TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert test questions if needed
          INSERT INTO questions (id, text, subject, topic)
          VALUES 
            (1001, 'Test question 1', 'Math', 'Algebra'),
            (1002, 'Test question 2', 'Science', 'Physics')
          ON CONFLICT (id) DO NOTHING;
        `;
        
        // @ts-ignore - Supabase client types may not include this method
        const { error } = await supabaseAdmin.sql(createTablesSql);
        
        if (error) {
          results.migrations.push({
            file: 'create_cart_tables_direct.sql',
            success: false,
            error: error.message
          });
        } else {
          results.migrations.push({
            file: 'create_cart_tables_direct.sql',
            success: true
          });
          results.success = true;
        }
      } catch (err) {
        results.migrations.push({
          file: 'create_cart_tables_direct.sql',
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error running migrations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run migrations'
    }, { status: 500 });
  }
} 