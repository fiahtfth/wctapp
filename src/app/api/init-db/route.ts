import { initializeDatabase } from '../../../lib/database/init';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await initializeDatabase();
    console.log('Database initialization complete.');
    return NextResponse.json({ message: 'Database initialization complete' }, { status: 200 });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
  }
}
