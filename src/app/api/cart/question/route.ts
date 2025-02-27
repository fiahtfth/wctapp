import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Helper function to ensure database directory exists
function ensureDatabaseDirectoryExists(dbPath: string) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Helper function to get database connection
function getDatabase() {
  let dbPath = process.env.DATABASE_PATH || '/tmp/wct.db';
  
  // Ensure the database directory exists
  ensureDatabaseDirectoryExists(dbPath);
  
  try {
    // Check if the database file exists, if not create it
    if (!fs.existsSync(dbPath)) {
      console.log(`Database file does not exist at ${dbPath}, creating it`);
      fs.closeSync(fs.openSync(dbPath, 'w'));
    }
    
    // Open the database with verbose logging
    console.log(`Opening database at ${dbPath}`);
    const db = new Database(dbPath, { verbose: console.log });
    
    // Test the connection
    const testQuery = db.prepare('SELECT 1 AS test').get();
    console.log('Database connection test:', testQuery);
    
    return db;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request to /api/cart/question received');
  let db = null;
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { questionId, testId } = body;
    
    if (!questionId) {
      console.error('Missing questionId in request');
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Not present');
    
    // Verify JWT token
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await verifyJwtToken(token);
        userId = payload.userId;
        console.log('Verified user ID from token:', userId);
      } catch (error) {
        console.error('JWT verification error:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('No auth token provided, using anonymous cart');
    }
    
    // Connect to database
    db = getDatabase();
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    console.log('Transaction started');
    
    // Check if cart exists for this test
    let cartId;
    const existingCart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND (user_id = ? OR user_id IS NULL)').get(testId, userId);
    
    if (existingCart) {
      cartId = existingCart.id;
      console.log('Using existing cart ID:', cartId);
    } else {
      // Create a new cart with a simpler timestamp approach
      const now = new Date().toISOString();
      const insertCart = db.prepare('INSERT INTO carts (test_id, user_id, created_at) VALUES (?, ?, ?)');
      const cartResult = insertCart.run(testId, userId, now);
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
      const now = new Date().toISOString();
      const insertItem = db.prepare('INSERT INTO cart_items (cart_id, question_id, created_at) VALUES (?, ?, ?)');
      const itemResult = insertItem.run(cartId, questionId, now);
      console.log('Item added to cart:', itemResult);
      
      // Commit transaction
      db.prepare('COMMIT').run();
      console.log('Transaction committed successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Question added to cart',
        testId,
        cartId
      });
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      console.error('Error adding item to cart, transaction rolled back:', error);
      
      return NextResponse.json({ 
        error: 'Failed to add question to cart',
        details: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cart/question POST handler:', error);
    
    // Rollback transaction if it was started
    if (db) {
      try {
        db.prepare('ROLLBACK').run();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  } finally {
    // Close database connection
    if (db) {
      try {
        db.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}
