import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';
import { initializeDatabase } from '@/lib/database/init';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/cart: Starting cart operation');
    
    // Get the request body
    const body = await request.json();
    const { questionId, testId } = body;

    // Validate input
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Generate a test ID if not provided
    const finalTestId = testId || uuidv4();
    
    try {
      // Open database connection
      const db = new Database(path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db'));
      
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      try {
        // Start a transaction
        db.prepare('BEGIN').run();
        
        // Use a fixed user ID for now (this is a temporary fix)
        const userId = 267; // This is the ID for navneet@nextias.com
        
        // Get or create cart
        db.prepare('INSERT OR IGNORE INTO carts (test_id, user_id) VALUES (?, ?)').run(finalTestId, userId);
        
        const cartRow = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(finalTestId, userId);
        if (!cartRow) {
          db.prepare('ROLLBACK').run();
          db.close();
          return NextResponse.json({ error: 'Failed to create or find cart' }, { status: 500 });
        }
        
        const cartId = (cartRow as any).id;
        
        // Add question to cart
        const result = db.prepare('INSERT OR IGNORE INTO cart_items (cart_id, question_id) VALUES (?, ?)').run(cartId, questionId);
        
        // Commit transaction
        db.prepare('COMMIT').run();
        
        // Re-enable foreign key constraints
        db.pragma('foreign_keys = ON');
        
        db.close();
        
        return NextResponse.json(
          {
            success: true,
            testId: finalTestId,
            changes: result.changes
          },
          { status: 200 }
        );
      } catch (dbError) {
        console.error('Database error in cart operation:', dbError);
        try {
          db.prepare('ROLLBACK').run();
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
        db.close();
        return NextResponse.json({ error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)) }, { status: 500 });
      }
    } catch (dbConnectionError) {
      console.error('Failed to connect to database:', dbConnectionError);
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cart API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add question to cart',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/cart: Starting cart fetch operation');

    // Extract test ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('testId');
    console.log('Received cart request with testId:', testId);
    
    if (!testId) {
      console.error('GET /api/cart: No test ID provided');
      return NextResponse.json({ error: 'Test ID is required', questions: [] }, { status: 400 });
    }
    
    try {
      // Open database connection
      const db = new Database(path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db'));
      
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      try {
        // Use a fixed user ID for now (this is a temporary fix)
        const userId = 267; // This is the ID for navneet@nextias.com
        
        // First check if cart exists
        const cart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);
        console.log('Cart lookup result:', cart);

        if (!cart) {
          console.log('No cart found for testId:', testId, 'and userId:', userId);
          db.close();
          return NextResponse.json({ questions: [], count: 0 }, { status: 200 });
        }

        const cartId = (cart as any).id;
        
        // Get questions in cart with all necessary fields
        const questions = db.prepare(`
          SELECT 
            q.id,
            q.Question,
            q.Answer,
            q.Explanation,
            q.Subject,
            q."Module Name" as ModuleName,
            q.Topic,
            q."Sub Topic" as SubTopic,
            q."Difficulty Level" as DifficultyLevel,
            q.Question_Type as QuestionType
          FROM questions q
          JOIN cart_items ci ON ci.question_id = q.id
          WHERE ci.cart_id = ?
          ORDER BY ci.created_at DESC
        `).all(cartId);
        
        console.log('Found', questions.length, 'questions in cart');
        
        // Re-enable foreign key constraints
        db.pragma('foreign_keys = ON');
        
        db.close();
        
        return NextResponse.json(
          {
            questions: questions,
            count: questions.length,
          },
          { status: 200 }
        );
      } catch (dbError) {
        console.error('Database error in cart fetch operation:', dbError);
        try {
          db.close();
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
        return NextResponse.json({ 
          error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
          questions: [],
          count: 0
        }, { status: 500 });
      }
    } catch (dbConnectionError) {
      console.error('Failed to connect to database:', dbConnectionError);
      return NextResponse.json({ 
        error: 'Database connection error',
        questions: [],
        count: 0
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cart GET API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve cart questions',
        questions: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
