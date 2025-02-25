import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    // Open database connection
    // Try both possible database paths
    let dbPath = path.join(process.cwd(), 'wct.db');
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
    }
    
    console.log('Opening database at:', dbPath);
    console.log('Database exists:', fs.existsSync(dbPath));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist',
        subjects: []
      }, { status: 500 });
    }
    
    const db = new Database(dbPath);
    
    try {
      // Get distinct subjects
      const subjects = db.prepare('SELECT DISTINCT Subject FROM questions ORDER BY Subject').all();
      
      // Extract subject names from the result
      const subjectList = subjects.map((row: any) => row.Subject);
      
      db.close();
      
      return NextResponse.json({
        subjects: subjectList,
        count: subjectList.length
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database error fetching subjects:', dbError);
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
      return NextResponse.json({ 
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
        subjects: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in subjects API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch subjects',
      subjects: []
    }, { status: 500 });
  }
}
