import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';

// Helper function to get database path with proper permissions
function getDatabasePath() {
  // For Render environment
  if (isRenderEnvironment()) {
    console.log('Running in Render environment');
    return process.env.DATABASE_PATH || '/opt/render/project/src/wct.db';
  }
  
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

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// Function to check if we're in Render environment
function isRenderEnvironment(): boolean {
  return process.env.RENDER === 'true' || !!process.env.RENDER;
}

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

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
    
    // Get user ID from token (if available)
    const userId = await getUserIdFromToken(request);
    console.log('User ID for cart operation:', userId);
    
    // Get database path with proper permissions
    const dbPath = getDatabasePath();
    
    console.log('Opening database at:', dbPath);
    console.log('Database exists:', fs.existsSync(dbPath));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist'
      }, { status: 500 });
    }
    
    // Explicitly set readonly: false to ensure write access
    const db = new Database(dbPath, { readonly: false });
    
    try {
      // Disable foreign key constraints temporarily for flexibility
      db.pragma('foreign_keys = OFF');
      
      // Start a transaction
      db.prepare('BEGIN').run();
      
      try {
        // Check if the test already exists in carts
        const testExists = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(finalTestId);
        
        let cartId;
        
        if (!testExists) {
          // Create a new cart entry if test doesn't exist
          const now = new Date().toISOString();
          console.log('Creating new cart with test ID:', finalTestId, 'and user ID:', userId);
          
          const insertCart = db.prepare('INSERT INTO carts (test_id, user_id, created_at) VALUES (?, ?, ?)');
          const cartResult = insertCart.run(finalTestId, userId, now);
          
          // Get the ID of the newly created cart
          cartId = cartResult.lastInsertRowid;
          console.log('Created new cart with ID:', cartId);
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
    // Get test ID from URL
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    console.log('Getting cart for test:', testId);
    debugLog('Environment:', process.env.NODE_ENV, 'Vercel:', isVercelEnvironment());
    
    // Get user ID from token (if available)
    let userId = null;
    try {
      userId = await getUserIdFromToken(request);
      console.log('User ID for cart operation:', userId);
    } catch (authError) {
      console.log('No valid authentication, proceeding as anonymous user');
      // Continue as anonymous user
    }
    
    // If we're in Vercel environment, use a simplified approach
    if (isVercelEnvironment()) {
      debugLog('Using simplified cart handling for Vercel environment');
      
      // In Vercel, we'll just return an empty cart
      return NextResponse.json({
        testId,
        userId: userId || 1,
        questions: [],
        vercelMode: true
      });
    }
    
    console.log('Getting cart for test:', testId);
    
    // Get database path with proper permissions
    const dbPath = getDatabasePath();
    
    console.log('Opening database at:', dbPath);
    console.log('Database exists:', fs.existsSync(dbPath));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist'
      }, { status: 500 });
    }
    
    // Check if the database has the required tables
    try {
      const tempDb = new Database(dbPath, { readonly: true });
      const tables = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('Database tables:', tables.map((t: any) => t.name));
      
      // Check if carts table exists
      const cartTableExists = tables.some((t: any) => t.name === 'carts');
      console.log('Carts table exists:', cartTableExists);
      
      // Check if cart_items table exists
      const cartItemsTableExists = tables.some((t: any) => t.name === 'cart_items');
      console.log('Cart_items table exists:', cartItemsTableExists);
      
      // Check if there are any carts in the database
      if (cartTableExists) {
        const cartCount = tempDb.prepare('SELECT COUNT(*) as count FROM carts').get();
        console.log('Total carts in database:', (cartCount as any).count);
        
        // Check if there's a cart with this test ID
        const cartWithTestId = tempDb.prepare('SELECT COUNT(*) as count FROM carts WHERE test_id = ?').get(testId);
        console.log('Carts with test ID', testId, ':', (cartWithTestId as any).count);
        
        // List all carts in the database
        const allCarts = tempDb.prepare('SELECT id, test_id, user_id FROM carts').all();
        console.log('All carts in database:', allCarts);
        
        // Check for cart items
        if (cartItemsTableExists) {
          const cartItemsCount = tempDb.prepare('SELECT COUNT(*) as count FROM cart_items').get();
          console.log('Total cart items in database:', (cartItemsCount as any).count);
          
          // List all cart items
          const allCartItems = tempDb.prepare('SELECT cart_id, question_id FROM cart_items').all();
          console.log('All cart items in database:', allCartItems);
        }
      }
      
      tempDb.close();
    } catch (checkError) {
      console.error('Error checking database tables:', checkError);
    }
    
    // Explicitly set readonly: false to ensure write access
    const db = new Database(dbPath, { readonly: false });
    
    try {
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      try {
        console.log('Looking for cart with testId:', testId, 'and userId:', userId);
        
        // Modified query to handle both authenticated and anonymous users
        let cartQuery;
        let cartParams;
        
        if (userId) {
          // For authenticated users, try to find their cart first
          cartQuery = 'SELECT id FROM carts WHERE test_id = ? AND user_id = ?';
          cartParams = [testId, userId];
        } else {
          // For anonymous users, look for carts with null user_id
          cartQuery = 'SELECT id FROM carts WHERE test_id = ? AND user_id IS NULL';
          cartParams = [testId];
        }
        
        const cart = db.prepare(cartQuery).get(...cartParams);
        console.log('Cart lookup result:', cart);
        
        // If authenticated user doesn't have a cart, check for anonymous cart with same test ID
        if (!cart && userId) {
          console.log('No authenticated cart found, checking for anonymous cart');
          const anonymousCart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id IS NULL').get(testId);
          console.log('Anonymous cart lookup result:', anonymousCart);
          
          if (anonymousCart) {
            console.log('Found anonymous cart, using it');
            return getCartItems(db, (anonymousCart as any).id);
          }
        }

        if (!cart) {
          console.log('No cart found for testId:', testId, 'and userId:', userId);
          db.close();
          return NextResponse.json({ questions: [], count: 0 }, { status: 200 });
        }

        return getCartItems(db, (cart as any).id);
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

function getCartItems(db: DatabaseType, cartId: number) {
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
}
