import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
    const body = await request.json();
    const { testId, questionId, userId = 0 } = body;
    
    console.log('POST /api/cart/question:', { testId, questionId, userId });
    
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
    console.log('Database writable:', fs.accessSync(dbPath, fs.constants.W_OK));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist',
        success: false
      }, { status: 500 });
    }
    
    // Explicitly set readonly: false to ensure write access
    const db = new Database(dbPath, { readonly: false });
    
    try {
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      try {
        // Start transaction
        db.prepare('BEGIN').run();
        
        // First check if cart exists, if not create it
        let cart = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(testId);
        let cartId;
        
        if (!cart) {
          // Create a new cart
          const result = db.prepare('INSERT INTO carts (test_id, user_id, created_at) VALUES (?, ?, datetime("now"))').run(testId, userId);
          cartId = result.lastInsertRowid;
          console.log('Created new cart with ID:', cartId);
        } else {
          cartId = (cart as any).id;
          console.log('Using existing cart with ID:', cartId);
        }
        
        // Check if question already exists in cart
        const existingItem = db.prepare('SELECT id FROM cart_items WHERE cart_id = ? AND question_id = ?').get(cartId, questionId);
        
        if (existingItem) {
          db.prepare('COMMIT').run();
          return NextResponse.json({ 
            message: 'Question already in test', 
            success: true,
            cartId,
            questionId
          }, { status: 200 });
        }
        
        // Add the question to cart_items
        const result = db.prepare('INSERT INTO cart_items (cart_id, question_id, created_at) VALUES (?, ?, datetime("now"))').run(cartId, questionId);
        
        // Commit transaction
        db.prepare('COMMIT').run();
        
        // Re-enable foreign key constraints
        db.pragma('foreign_keys = ON');
        
        return NextResponse.json({ 
          message: 'Question added to test successfully', 
          success: true,
          cartId,
          questionId,
          itemId: result.lastInsertRowid
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
      error: error instanceof Error ? error.message : 'Failed to add question to test',
      success: false
    }, { status: 500 });
  }
}
