import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
        success: false
      }, { status: 500 });
    }
    
    const db = new Database(dbPath);
    
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
