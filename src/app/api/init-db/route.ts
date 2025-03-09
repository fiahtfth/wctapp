import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if we're in production (Vercel) or development
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode, skipping SQLite initialization');
      return NextResponse.json({ 
        message: 'Database initialization skipped in production. Using Supabase instead.',
        environment: process.env.NODE_ENV
      }, { status: 200 });
    } else {
      // Only import the SQLite initialization in development
      const { initializeDatabase } = await import('../../../lib/database/init');
      await initializeDatabase();
      console.log('Database initialization complete.');
      return NextResponse.json({ message: 'Database initialization complete' }, { status: 200 });
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed', 
      details: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
