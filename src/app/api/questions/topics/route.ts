import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    // Get subject from query params
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');
    
    if (!subject) {
      return NextResponse.json({ 
        error: 'Subject parameter is required', 
        topics: [] 
      }, { status: 400 });
    }
    
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
        topics: []
      }, { status: 500 });
    }
    
    const db = new Database(dbPath);
    
    try {
      // Get distinct topics for the given subject
      const topics = db.prepare('SELECT DISTINCT Topic FROM questions WHERE Subject = ? ORDER BY Topic').all(subject);
      
      // Extract topic names from the result
      const topicList = topics.map((row: any) => row.Topic);
      
      db.close();
      
      return NextResponse.json({
        topics: topicList,
        count: topicList.length
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database error fetching topics:', dbError);
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
      return NextResponse.json({ 
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
        topics: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch topics',
      topics: []
    }, { status: 500 });
  }
}
