import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { questionId, testId } = await request.json();
    
    // Validate required fields
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Generate a test ID if not provided
    const finalTestId = testId || uuidv4();
    
    console.log('Adding question to test:', { questionId, finalTestId });
    
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
        error: 'Database file does not exist'
      }, { status: 500 });
    }
    
    const db = new Database(dbPath);
    
    try {
      // Disable foreign key constraints temporarily for flexibility
      db.pragma('foreign_keys = OFF');
      
      // Start a transaction
      db.prepare('BEGIN').run();
      
      try {
        // Use a fixed user ID for now (this would be replaced with actual user authentication)
        const userId = 1;
        
        // Check if the test already exists in carts
        const testExists = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(finalTestId);
        
        let cartId;
        
        if (!testExists) {
          // Create a new cart entry if test doesn't exist
          const insertCart = db.prepare('INSERT INTO carts (test_id, user_id) VALUES (?, ?)');
          insertCart.run(finalTestId, userId);
          
          // Get the newly created cart ID
          const newCart = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(finalTestId);
          cartId = (newCart as any).id;
        } else {
          cartId = (testExists as any).id;
        }
        
        // Check if the question exists
        const questionExists = db.prepare('SELECT COUNT(*) as count FROM questions WHERE id = ?').get(questionId);
        
        if (!questionExists || (questionExists as any).count === 0) {
          db.prepare('ROLLBACK').run();
          return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }
        
        // Check if the question is already in the cart
        const questionInCart = db.prepare('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ? AND question_id = ?').get(cartId, questionId);
        
        if (questionInCart && (questionInCart as any).count > 0) {
          // If already in cart, we'll consider this a success
          db.prepare('COMMIT').run();
          return NextResponse.json({ 
            message: 'Question already in test',
            testId: finalTestId
          }, { status: 200 });
        }
        
        // Add the question to the cart
        db.prepare('INSERT INTO cart_items (cart_id, question_id) VALUES (?, ?)').run(cartId, questionId);
        
        // Commit the transaction
        db.prepare('COMMIT').run();
        
        // Re-enable foreign key constraints
        db.pragma('foreign_keys = ON');
        
        return NextResponse.json({ 
          message: 'Question added to test successfully',
          testId: finalTestId,
          questionId
        }, { status: 200 });
      } catch (transactionError) {
        // Rollback on error
        console.error('Transaction error:', transactionError);
        try {
          db.prepare('ROLLBACK').run();
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }
        throw transactionError;
      }
    } catch (dbError) {
      console.error('Database error adding question to test:', dbError);
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
      return NextResponse.json({ 
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError))
      }, { status: 500 });
    } finally {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  } catch (error) {
    console.error('Error in cart API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to add question to test'
    }, { status: 500 });
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
