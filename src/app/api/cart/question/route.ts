import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get database path with proper permissions
function getDatabasePath() {
  // For local development
  let dbPath = path.join(process.cwd(), 'wct.db');
  if (!fs.existsSync(dbPath)) {
    dbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
  }
  
  // For Vercel environment
  if (process.env.VERCEL === '1') {
    // In Vercel, we need to use /tmp directory which is writable
    const tmpDbPath = '/tmp/wct.db';
    
    // If the database doesn't exist in /tmp, copy it from the source
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, tmpDbPath);
        console.log('✅ Database copied to /tmp for write access');
      } catch (error) {
        console.error('❌ Failed to copy database to /tmp:', error);
      }
    }
    
    if (fs.existsSync(tmpDbPath)) {
      // Make sure the file is writable
      try {
        fs.accessSync(tmpDbPath, fs.constants.W_OK);
        console.log('✅ Database is writable');
      } catch (error) {
        console.log('⚠️ Database is not writable, attempting to set permissions');
        try {
          // Try to make it writable
          fs.chmodSync(tmpDbPath, 0o666);
        } catch (chmodError) {
          console.error('❌ Failed to set database permissions:', chmodError);
        }
      }
      
      return tmpDbPath;
    }
  }
  
  return dbPath;
}

// Helper function to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number> {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided, using default user ID 0');
      return 0; // Default user ID if no token
    }
    
    // Get the JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables');
      return 0; // Default user ID if no JWT secret
    }
    
    try {
      // Verify the token
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      const userId = payload.userId as number;
      console.log('✅ User authenticated:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return 0; // Default user ID if token verification fails
    }
  } catch (error) {
    console.error('❌ Error getting user ID from token:', error);
    return 0; // Default user ID if any error occurs
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { testId, questionId } = body;
    
    console.log('DELETE /api/cart/question:', { testId, questionId });
    
    if (!testId || !questionId) {
      return NextResponse.json({ 
        error: 'Missing required parameters', 
        success: false 
      }, { status: 400 });
    }
    
    // Get database path with proper permissions
    const dbPath = getDatabasePath();
    
    console.log('Opening database at:', dbPath);
    console.log('Database exists:', fs.existsSync(dbPath));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist',
        success: false
      }, { status: 500 });
    }
    
    const db = new Database(dbPath, { readonly: false });
    
    try {
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      try {
        // Start transaction
        db.prepare('BEGIN').run();
        
        // First check if cart exists
        const cart = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(testId);
        
        if (!cart) {
          db.prepare('ROLLBACK').run();
          return NextResponse.json({ 
            error: 'Test not found', 
            success: false 
          }, { status: 404 });
        }
        
        const cartId = (cart as any).id;
        
        // Delete the question from cart_items
        const result = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND question_id = ?').run(cartId, questionId);
        
        // Commit transaction
        db.prepare('COMMIT').run();
        
        // Re-enable foreign key constraints
        db.pragma('foreign_keys = ON');
        
        if (result.changes === 0) {
          return NextResponse.json({ 
            message: 'Question not found in test', 
            success: false 
          }, { status: 404 });
        }
        
        return NextResponse.json({ 
          message: 'Question removed from test successfully', 
          success: true,
          changes: result.changes
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
      console.error('Database error removing question from test:', dbError);
      return NextResponse.json({ 
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
        success: false
      }, { status: 500 });
    } finally {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  } catch (error) {
    console.error('Error in cart/question API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to remove question from test',
      success: false
    }, { status: 500 });
  }
}

// Add POST method to handle adding questions to cart
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Received request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body', 
        success: false,
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }
    
    let { testId, questionId } = body;
    
    console.log('POST /api/cart/question:', { testId, questionId });
    
    if (!questionId) {
      return NextResponse.json({ 
        error: 'Question ID is required', 
        success: false 
      }, { status: 400 });
    }
    
    // Generate a test ID if not provided
    if (!testId) {
      testId = uuidv4();
      console.log('Generated new test ID:', testId);
    }
    
    // Get user ID from token
    const userId = await getUserIdFromToken(request);
    console.log('User ID for cart operation:', userId);
    
    // Get database path with proper permissions
    const dbPath = getDatabasePath();
    
    console.log('Opening database at:', dbPath);
    console.log('Database exists:', fs.existsSync(dbPath));
    
    try {
      console.log('Checking if database is writable');
      fs.accessSync(dbPath, fs.constants.W_OK);
      console.log('Database is writable');
    } catch (error) {
      console.error('Database is not writable:', error);
      // Try to make it writable
      try {
        fs.chmodSync(dbPath, 0o666);
        console.log('Set database permissions to writable');
      } catch (chmodError) {
        console.error('Failed to set database permissions:', chmodError);
        return NextResponse.json({ 
          error: 'Database permissions error', 
          success: false,
          details: chmodError instanceof Error ? chmodError.message : String(chmodError)
        }, { status: 500 });
      }
    }
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist',
        success: false
      }, { status: 500 });
    }
    
    // Open database connection
    let db;
    try {
      db = new Database(dbPath);
      console.log('Database opened successfully');
    } catch (dbError) {
      console.error('Error opening database:', dbError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        success: false,
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
    
    try {
      // Begin transaction
      db.prepare('BEGIN TRANSACTION').run();
      console.log('Transaction started');
      
      // Check if cart exists for the test ID
      const existingCart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);
      console.log('Existing cart:', existingCart);
      
      let cartId;
      
      if (existingCart) {
        cartId = existingCart.id;
        console.log('Using existing cart ID:', cartId);
      } else {
        // Create a new cart
        const insertCart = db.prepare('INSERT INTO carts (test_id, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
        const cartResult = insertCart.run(testId, userId);
        cartId = cartResult.lastInsertRowid;
        console.log('Created new cart with ID:', cartId);
      }
      
      // Check if question is already in the cart
      const existingItem = db.prepare('SELECT id FROM cart_items WHERE cart_id = ? AND question_id = ?').get(cartId, questionId);
      console.log('Existing item in cart:', existingItem);
      
      if (existingItem) {
        // Question already in cart, commit transaction and return success
        db.prepare('COMMIT').run();
        console.log('Question already in cart, transaction committed');
        return NextResponse.json({ 
          success: true, 
          message: 'Question already in cart',
          testId,
          cartId
        });
      }
      
      // Add question to cart
      try {
        const insertItem = db.prepare('INSERT INTO cart_items (cart_id, question_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
        const itemResult = insertItem.run(cartId, questionId);
        console.log('Item added to cart:', itemResult);
        
        // Commit transaction
        db.prepare('COMMIT').run();
        console.log('Transaction committed');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Question added to cart',
          testId,
          cartId
        });
      } catch (insertError) {
        // Rollback transaction on error
        db.prepare('ROLLBACK').run();
        console.error('Error adding item to cart, transaction rolled back:', insertError);
        return NextResponse.json({ 
          error: 'Failed to add question to cart', 
          success: false,
          details: insertError instanceof Error ? insertError.message : String(insertError)
        }, { status: 500 });
      }
    } catch (txError) {
      // Attempt to rollback transaction on error
      try {
        db.prepare('ROLLBACK').run();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      
      console.error('Transaction error:', txError);
      return NextResponse.json({ 
        error: 'Transaction error', 
        success: false,
        details: txError instanceof Error ? txError.message : String(txError)
      }, { status: 500 });
    } finally {
      // Close database connection
      if (db) {
        try {
          db.close();
          console.log('Database connection closed');
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error in POST /api/cart/question:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      success: false,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
