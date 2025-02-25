import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tests');
    
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
        tests: []
      }, { status: 500 });
    }
    
    const db = new Database(dbPath);
    
    try {
      // Get all tests (carts)
      const tests = db.prepare(`
        SELECT 
          c.id, 
          c.test_id, 
          c.created_at,
          COUNT(ci.id) as question_count
        FROM 
          carts c
        LEFT JOIN 
          cart_items ci ON c.id = ci.cart_id
        GROUP BY 
          c.id
        ORDER BY 
          c.created_at DESC
      `).all();
      
      // For each test, get the questions
      const testsWithQuestions = tests.map((test: any) => {
        const questions = db.prepare(`
          SELECT 
            q.id,
            q.Question as question,
            q.Subject as subject,
            q.Topic as topic,
            q."Difficulty Level" as difficultyLevel
          FROM 
            cart_items ci
          JOIN 
            questions q ON ci.question_id = q.id
          WHERE 
            ci.cart_id = ?
        `).all(test.id);
        
        return {
          ...test,
          questions
        };
      });
      
      return NextResponse.json({ 
        tests: testsWithQuestions
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database error fetching tests:', dbError);
      return NextResponse.json({ 
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
        tests: []
      }, { status: 500 });
    } finally {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  } catch (error) {
    console.error('Error in tests API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch tests',
      tests: []
    }, { status: 500 });
  }
}
