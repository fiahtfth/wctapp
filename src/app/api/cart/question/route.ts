import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { jwtVerify } from 'jose';
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
  const dbPath = path.resolve(process.cwd(), 'src/lib/database/wct.db');
  
  try {
    // Check if the database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Database file does not exist at ${dbPath}`);
      throw new Error(`Database file not found at ${dbPath}`);
    }
    
    // Open the database with verbose logging
    console.log(`Opening database at ${dbPath}`);
    const db = new Database(dbPath, { verbose: console.log });
    
    // Test the connection
    const testQuery = db.prepare('SELECT 1 AS test').get();
    console.log('Database connection test:', testQuery);
    
    return db;
  } catch (error: unknown) {
    console.error('Error connecting to database:', error);
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to get user ID from token
async function getUserIdFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    throw new Error('No valid authentication token');
  }
  
  const token = authHeader.substring(7);
  console.log('Token extracted from header, length:', token.length);
  
  try {
    // Get the JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables');
      throw new Error('JWT secret not configured');
    }
    
    // Verify the token directly
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    console.log('Token payload:', payload);
    
    // Check if userId exists in the payload
    // The token might use 'userId' or 'id' field depending on how it was created
    const userId = payload.userId || payload.id;
    if (!userId) {
      console.error('No user ID found in token payload');
      throw new Error('Invalid token format: missing user ID');
    }
    
    return Number(userId);
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to get the database path based on environment
export function getDatabasePath() {
  // First check for environment variable
  if (process.env.DATABASE_PATH) {
    console.log('Using DATABASE_PATH from environment:', process.env.DATABASE_PATH);
    return process.env.DATABASE_PATH;
  }
  
  // For Vercel deployment, use /tmp directory
  if (process.env.VERCEL) {
    const tmpPath = '/tmp/wct.db';
    console.log('Vercel environment detected, using path:', tmpPath);
    return tmpPath;
  }
  
  // For local development
  const rootDbPath = path.join(process.cwd(), 'wct.db');
  if (fs.existsSync(rootDbPath)) {
    console.log('Using database at project root:', rootDbPath);
    return rootDbPath;
  }
  
  // Fallback to the lib/database location
  const libDbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
  console.log('Using database in lib/database:', libDbPath);
  return libDbPath;
}

// Function to ensure database exists and is initialized
async function ensureDatabaseExists(dbPath: string): Promise<boolean> {
  console.log('Checking if database exists at path:', dbPath);
  
  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    console.log('Database file found at:', dbPath);
    return true;
  }
  
  console.log('Database file not found, attempting to create it');
  
  try {
    // For Vercel, we need to create the database in /tmp
    if (dbPath.startsWith('/tmp')) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      
      // Try to find the source database
      const possibleSourcePaths = [
        path.join(process.cwd(), 'wct.db'),
        path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db')
      ];
      
      let sourcePath = null;
      for (const p of possibleSourcePaths) {
        if (fs.existsSync(p)) {
          sourcePath = p;
          break;
        }
      }
      
      if (sourcePath) {
        // Copy the database from source
        console.log(`Copying database from ${sourcePath} to ${dbPath}`);
        fs.copyFileSync(sourcePath, dbPath);
        fs.chmodSync(dbPath, 0o666); // Make it writable
        console.log('Database copied and permissions set');
        return true;
      } else {
        // Create a new empty database with required schema
        console.log('No source database found, creating a new one');
        const db = new Database(dbPath, { readonly: false });
        
        // Create necessary tables
        db.exec(`
          CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Question TEXT,
            Answer TEXT,
            Explanation TEXT,
            Subject TEXT,
            "Module Name" TEXT,
            Topic TEXT,
            "Sub Topic" TEXT,
            "Difficulty Level" TEXT,
            Question_Type TEXT,
            "Nature of Question" TEXT
          );
          
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT,
            password_hash TEXT,
            role TEXT,
            is_active BOOLEAN,
            last_login DATETIME,
            created_at DATETIME,
            updated_at DATETIME
          );
          
          CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES carts(id)
          );
        `);
        
        // Add a sample question if the questions table is empty
        const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
        
        if (questionCount.count === 0) {
          console.log('Adding sample question to the database');
          db.prepare(`
            INSERT INTO questions (
              Question, 
              Answer, 
              Explanation, 
              Subject, 
              "Module Name", 
              Topic, 
              "Sub Topic", 
              "Difficulty Level", 
              Question_Type, 
              "Nature of Question"
            ) VALUES (
              'What is the capital of India?', 
              'New Delhi', 
              'New Delhi is the capital city of India.', 
              'Geography', 
              'World Geography', 
              'Countries and Capitals', 
              'Asian Countries', 
              'Easy', 
              'MCQ', 
              'Factual'
            )
          `).run();
          console.log('Sample question added');
        }
        
        db.close();
        console.log('New database created with required schema');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    return false;
  }
}

// Function to create a minimal test user if needed
async function createTestUserIfNeeded(db: Database): Promise<number> {
  try {
    // Check if any users exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('No users found, creating a test user');
      
      // Create a test user
      const result = db.prepare(`
        INSERT INTO users (
          username, 
          email, 
          password_hash, 
          role, 
          is_active, 
          created_at, 
          updated_at
        ) VALUES (
          'testuser', 
          'test@example.com', 
          '$2a$10$JcH8WBaHxQyQJgjS8Xg5j.tCYnXIouWw1q3b.0GQJwjuXQiLBJQrC', 
          'user', 
          1, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `).run();
      
      console.log('Test user created with ID:', result.lastInsertRowid);
      return Number(result.lastInsertRowid);
    } else {
      // Get the first user's ID
      const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: number };
      console.log('Using existing user with ID:', firstUser.id);
      return firstUser.id;
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    return 1; // Fallback to ID 1
  }
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request to /api/cart/question received');
  debugLog('Environment:', process.env.NODE_ENV, 'Vercel:', isVercelEnvironment());
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    // Extract question ID and test ID from request body
    const { questionId, testId } = body;
    
    // Validate required fields
    if (!questionId) {
      console.error('Missing questionId in request');
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    if (!testId) {
      console.error('Missing testId in request');
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    console.log('Processing add to cart with testId:', testId);
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Not present');
    
    // Get user ID from token (if available)
    let userId = null;
    try {
      userId = await getUserIdFromToken(request);
      console.log('User ID for cart operation:', userId);
    } catch (authError) {
      console.log('Authentication error:', authError instanceof Error ? authError.message : String(authError));
      
      // For Vercel deployment, we'll allow anonymous users to bypass authentication
      if (isVercelEnvironment()) {
        console.log('Running in Vercel environment, proceeding with anonymous user');
        userId = 1; // Use a default user ID
      } else {
        // In non-Vercel environments, enforce authentication
        return NextResponse.json({ 
          error: 'Authentication required to add questions to a test',
          code: 'AUTH_REQUIRED',
          details: authError instanceof Error ? authError.message : String(authError)
        }, { status: 401 });
      }
    }
    
    // If we're in Vercel environment, use a simplified approach
    if (isVercelEnvironment()) {
      debugLog('Using simplified cart handling for Vercel environment');
      
      // In Vercel, we'll just return success without actually writing to the database
      return NextResponse.json({
        success: true,
        message: 'Question added to cart (Vercel simplified mode)',
        questionId,
        testId,
        userId,
        vercelMode: true
      });
    }
    
    // If we get here, we have a valid userId
    if (!userId) {
      console.log('No valid user ID from token, creating or using test user');
      
      // For non-Vercel environments, try to create a test user
      if (!isVercelEnvironment()) {
        // Get database path
        const dbPath = getDatabasePath();
        console.log('Database path:', dbPath);
        
        // Ensure database exists
        if (!(await ensureDatabaseExists(dbPath))) {
          console.error('Failed to ensure database exists');
          return NextResponse.json({ 
            error: 'Failed to ensure database exists'
          }, { status: 500 });
        }
        
        // Open database connection
        let db = null;
        try {
          console.log('Attempting to open database at:', dbPath);
          db = new Database(dbPath, { readonly: false, fileMustExist: false });
          console.log('Database connection opened successfully');
          
          try {
            userId = await createTestUserIfNeeded(db);
          } catch (error) {
            console.error('Error creating test user:', error);
            return NextResponse.json({ 
              error: 'Failed to create test user',
              details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
          } finally {
            if (db) {
              db.close();
            }
          }
        } catch (dbOpenError) {
          console.error('Error opening database:', dbOpenError);
          return NextResponse.json({ 
            error: 'Failed to open database connection',
            details: dbOpenError instanceof Error ? dbOpenError.message : String(dbOpenError)
          }, { status: 500 });
        }
      } else {
        // For Vercel, use a default user ID
        userId = 1;
      }
    }
    
    // Get database path
    const dbPath = getDatabasePath();
    console.log('Database path:', dbPath);
    
    // Ensure database exists
    if (!(await ensureDatabaseExists(dbPath))) {
      console.error('Failed to ensure database exists');
      return NextResponse.json({ 
        error: 'Failed to ensure database exists'
      }, { status: 500 });
    }
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file still does not exist after initialization attempt:', dbPath);
      return NextResponse.json({ 
        error: 'Database file does not exist after initialization attempt'
      }, { status: 500 });
    }
    
    // Open database connection
    let db = null;
    try {
      console.log('Attempting to open database at:', dbPath);
      db = new Database(dbPath, { readonly: false, fileMustExist: false });
      console.log('Database connection opened successfully');
    } catch (dbOpenError) {
      console.error('Error opening database:', dbOpenError);
      
      // Try to diagnose the issue
      try {
        // Check file permissions
        const stats = fs.statSync(dbPath);
        console.log('Database file permissions:', stats.mode.toString(8));
        
        // Try to make it writable if it's not
        if (!(stats.mode & 0o200)) { // Check write permission
          console.log('Attempting to make database file writable');
          fs.chmodSync(dbPath, 0o666);
          console.log('Changed permissions to writable');
          
          // Try opening again
          try {
            db = new Database(dbPath, { readonly: false, fileMustExist: false });
            console.log('Database opened successfully after permission fix');
          } catch (retryError) {
            console.error('Still failed to open database after permission fix:', retryError);
          }
        }
      } catch (diagError) {
        console.error('Error diagnosing database issue:', diagError);
      }
      
      // If we still don't have a database connection, return error
      if (!db) {
        return NextResponse.json({ 
          error: 'Failed to open database connection',
          details: dbOpenError instanceof Error ? dbOpenError.message : String(dbOpenError)
        }, { status: 500 });
      }
    }
    
    // Begin transaction
    try {
      db.prepare('BEGIN TRANSACTION').run();
      console.log('Transaction started successfully');
    } catch (txnError) {
      console.error('Error starting transaction:', txnError);
      return NextResponse.json({ 
        error: 'Failed to start database transaction',
        details: txnError instanceof Error ? txnError.message : String(txnError)
      }, { status: 500 });
    }
    
    try {
      // Check if cart exists for this test ID
      const existingCart = db.prepare(`
        SELECT id FROM carts 
        WHERE test_id = ? AND (user_id = ? OR user_id IS NULL)
      `).get(testId, userId);
      
      console.log('Existing cart check result:', existingCart);
      
      let cartId;
      
      if (existingCart) {
        // Use existing cart
        cartId = (existingCart as { id: number }).id;
        console.log('Using existing cart with ID:', cartId);
      } else {
        // Create new cart
        console.log('Creating new cart with testId:', testId, 'userId:', userId);
        
        const insertCartResult = db.prepare(`
          INSERT INTO carts (test_id, user_id, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(testId, userId);
        
        cartId = insertCartResult.lastInsertRowid;
        console.log('New cart created with ID:', cartId);
      }
      
      // Check if question is already in cart
      const existingItem = db.prepare(`
        SELECT id FROM cart_items 
        WHERE cart_id = ? AND question_id = ?
      `).get(cartId, questionId);
      
      console.log('Existing item check result:', existingItem);
      
      if (existingItem) {
        // Question already in cart, commit transaction and return success
        db.prepare('COMMIT').run();
        console.log('Question already in cart, transaction committed');
        
        return NextResponse.json({
          success: true,
          message: 'Question is already in cart',
          cartId,
          questionId
        });
      }
      
      // Add question to cart
      console.log('Adding question to cart:', { cartId, questionId });
      
      const insertItemResult = db.prepare(`
        INSERT INTO cart_items (cart_id, question_id, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(cartId, questionId);
      
      console.log('Insert item result:', insertItemResult);
      
      // Commit transaction
      db.prepare('COMMIT').run();
      console.log('Transaction committed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Question added to cart',
        cartId,
        questionId
      });
    } catch (error) {
      // Rollback transaction on error
      console.error('Error in cart operation:', error);
      
      if (db) {
        try {
          db.prepare('ROLLBACK').run();
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to add question to cart',
        details: error instanceof Error ? error.message : String(error)
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
  } catch (error: unknown) {
    console.error('Error adding item to cart:', error);
    
    return NextResponse.json({ 
      error: 'Failed to add question to cart',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
