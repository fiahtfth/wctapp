import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseTables } from '@/lib/database/setupUtils';
import { directDatabaseSetup } from '@/lib/database/directSetup';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/database/init - Checking database status');
    const status = await checkDatabaseTables();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check database status',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/database/init - Initializing database');
    
    // Use the new direct setup function
    const result = await directDatabaseSetup();
    
    if (!result.success) {
      console.error('Database initialization failed:', result.message);
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          details: result.details
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      details: result.details
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initialize database',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 