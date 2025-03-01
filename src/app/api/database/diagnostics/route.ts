import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with proper authorization
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    
    if (!isDevEnvironment) {
      // In production, require authorization
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.SETUP_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const body = await request.json();
    const action = body.action;
    
    if (action === 'checkConnection') {
      // Test database connection using a simple query
      try {
        // Execute a simple SQL query to check connection
        const { data, error } = await supabaseAdmin.auth.getSession();
        
        if (error) {
          console.error('Database connection error:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Failed to connect to database: ${error.message}` 
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Database connection successful' 
        });
      } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}` 
        });
      }
    } 
    else if (action === 'checkTables') {
      // Check required tables
      const requiredTables = ['carts', 'cart_items', 'questions'];
      const tableStatuses = [];
      
      for (const tableName of requiredTables) {
        try {
          // Try to query the table to see if it exists
          let exists = false;
          let rowCount = 0;
          let columns: string[] = [];
          let errorMessage: string | undefined = undefined;
          
          // Check if table exists by attempting to query it
          if (tableName === 'carts') {
            const { data, error, count } = await supabaseAdmin
              .from('carts')
              .select('*', { count: 'exact', head: true });
            
            exists = !error || !error.message.includes('does not exist');
            rowCount = count || 0;
            errorMessage = error?.message;
            
            // Get column names if table exists
            if (exists) {
              const { data: sampleData } = await supabaseAdmin
                .from('carts')
                .select('*')
                .limit(1);
              
              if (sampleData && sampleData.length > 0) {
                columns = Object.keys(sampleData[0]);
              }
            }
          } 
          else if (tableName === 'cart_items') {
            const { data, error, count } = await supabaseAdmin
              .from('cart_items')
              .select('*', { count: 'exact', head: true });
            
            exists = !error || !error.message.includes('does not exist');
            rowCount = count || 0;
            errorMessage = error?.message;
            
            // Get column names if table exists
            if (exists) {
              const { data: sampleData } = await supabaseAdmin
                .from('cart_items')
                .select('*')
                .limit(1);
              
              if (sampleData && sampleData.length > 0) {
                columns = Object.keys(sampleData[0]);
              }
            }
          }
          else if (tableName === 'questions') {
            const { data, error, count } = await supabaseAdmin
              .from('questions')
              .select('*', { count: 'exact', head: true });
            
            exists = !error || !error.message.includes('does not exist');
            rowCount = count || 0;
            errorMessage = error?.message;
            
            // Get column names if table exists
            if (exists) {
              const { data: sampleData } = await supabaseAdmin
                .from('questions')
                .select('*')
                .limit(1);
              
              if (sampleData && sampleData.length > 0) {
                columns = Object.keys(sampleData[0]);
              }
            }
          }
          
          tableStatuses.push({
            name: tableName,
            exists,
            columns,
            rowCount,
            error: errorMessage
          });
        } catch (error) {
          console.error(`Error checking table ${tableName}:`, error);
          tableStatuses.push({
            name: tableName,
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        tables: tableStatuses 
      });
    }
    else {
      return NextResponse.json({ 
        error: 'Invalid action' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in database diagnostics API route:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 