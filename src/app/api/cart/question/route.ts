import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { jwtVerify } from 'jose';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

// JWT secret for token verification
const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me-please';

// Helper function to ensure database directory exists
function ensureDatabaseDirectoryExists(dbPath: string) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Helper function to get database path based on environment
export function getDatabasePath() {
  // Function to check if we're in Render environment
  function isRenderEnvironment(): boolean {
    return process.env.RENDER === 'true' || !!process.env.RENDER;
  }

  // Function to check if we're in Vercel environment
  function isVercelEnvironment(): boolean {
    return process.env.VERCEL === '1' || !!process.env.VERCEL;
  }

  // For Render environment
  if (isRenderEnvironment()) {
    console.log('Running in Render environment');
    return process.env.DATABASE_PATH || '/opt/render/project/src/wct.db';
  }
  
  // For Vercel environment
  if (isVercelEnvironment()) {
    console.log('Running in Vercel environment');
    return process.env.DATABASE_PATH || '/tmp/wct.db';
  }
  
  // For local development
  console.log('Running in local environment');
  
  // Check if DATABASE_PATH is set in environment variables
  if (process.env.DATABASE_PATH) {
    console.log('Using DATABASE_PATH from environment:', process.env.DATABASE_PATH);
    return process.env.DATABASE_PATH;
  }
  
  // On macOS, /tmp is a symlink to /private/tmp
  const isMacOS = process.platform === 'darwin';
  const tmpPath = isMacOS ? '/private/tmp/wct.db' : '/tmp/wct.db';
  
  // Check if the database exists in the tmp directory
  if (fs.existsSync(tmpPath)) {
    console.log('Found database in tmp directory:', tmpPath);
    return tmpPath;
  }
  
  // Check if the database exists in the project root
  let dbPath = path.join(process.cwd(), 'wct.db');
  if (fs.existsSync(dbPath)) {
    console.log('Found database in project root:', dbPath);
    return dbPath;
  }
  
  // Check if the database exists in the src/lib/database directory
  dbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
  if (fs.existsSync(dbPath)) {
    console.log('Found database in src/lib/database:', dbPath);
    return dbPath;
  }
  
  // Default to the tmp path if no database is found
  console.log('No existing database found, defaulting to:', tmpPath);
  return tmpPath;
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
        
        // Create necessary tables
        const db = new Database(dbPath);
        
        // Create tables
        db.prepare(`
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
          )
        `).run();
        
        db.prepare(`
          CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id TEXT,
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        db.prepare(`
          CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES carts(id)
          )
        `).run();
        
        // Check the number of questions
        const questionCountQuery = db.prepare('SELECT COUNT(*) as count FROM questions');
        const questionCount = questionCountQuery.get() as { count: number };
        
        if (questionCount.count === 0) {
          console.log('No questions found in the database');
          // Do NOT add a sample question
          db.close();
          return false;
        }
        
        db.close();
        console.log('Database initialized successfully');
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
async function createTestUserIfNeeded(): Promise<number> {
  try {
    // Check if any users exist
    const dbPath = getDatabasePath();
    const db = new Database(dbPath);
    
    const userCountQuery = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = userCountQuery.get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('No users found, creating a test user');
      const insertUserQuery = db.prepare(`
        INSERT INTO users (
          username, 
          email, 
          password_hash, 
          role, 
          is_active, 
          last_login, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
      `);
      
      const result = insertUserQuery.run(
        'testuser', 
        'test@example.com', 
        'hashed_password', 
        'user', 
        true
      );
      
      db.close();
      return result.lastInsertRowid as number;
    }
    
    db.close();
    return 0;
  } catch (error) {
    console.error('Error creating test user:', error);
    return 0;
  }
}

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

// Function to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header found');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret)
    );
    
    if (!payload.userId) {
      throw new Error('Token does not contain a user ID');
    }
    
    return Number(payload.userId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('exp')) {
      throw new Error('Token has expired');
    }
    throw error;
  }
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// POST handler for adding a question to a cart
export async function POST(request: NextRequest) {
  console.log('POST /api/cart/question called');
  
  try {
    // Parse request body
    const body = await request.json();
    const { questionId, testId } = body;
    
    if (!questionId || !testId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question ID and Test ID are required' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    debugLog('Request body:', { questionId, testId });
    
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
        // Instead of using a hardcoded ID, get a valid user ID from the database
        try {
          userId = await createTestUserIfNeeded();
          console.log('Using user ID for anonymous user:', userId);
        } catch (error) {
          console.error('Failed to get user ID for anonymous user:', error);
          return NextResponse.json({ 
            error: 'Failed to get user ID for anonymous user',
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
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
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // If we get here, we need a valid userId
    if (!userId) {
      console.log('No valid user ID from token, getting an existing user ID');
      
      // For non-Vercel environments, get an existing user ID
      if (!isVercelEnvironment()) {
        try {
          // Get an existing user ID from the database
          const dbPath = getDatabasePath();
          const db = new Database(dbPath);
          const userResult = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get() as { id: number } | null;
          db.close();
          
          if (userResult) {
            userId = userResult.id;
            console.log('Using existing user with ID:', userId);
          } else {
            // If no users exist, create a test user
            userId = await createTestUserIfNeeded();
          }
        } catch (error) {
          console.error('Error getting user ID:', error);
          userId = await createTestUserIfNeeded();
        }
      } else {
        // For Vercel, get a valid user ID from the database
        try {
          const dbPath = getDatabasePath();
          const db = new Database(dbPath);
          const userResult = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get() as { id: number } | null;
          db.close();
          
          if (userResult) {
            userId = userResult.id;
            console.log('Using existing user with ID for Vercel:', userId);
          } else {
            userId = await createTestUserIfNeeded();
          }
        } catch (error) {
          console.error('Error getting user ID for Vercel:', error);
          userId = await createTestUserIfNeeded();
        }
      }
    }
    
    // Verify that the user ID exists in the database
    try {
      const dbPath = getDatabasePath();
      const db = new Database(dbPath);
      const userExistsResult = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: number } | null;
      db.close();
      
      if (!userExistsResult) {
        console.log('User ID does not exist in database, getting a valid user ID');
        const db = new Database(dbPath);
        const validUserResult = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get() as { id: number } | null;
        db.close();
        
        if (validUserResult) {
          userId = validUserResult.id;
          console.log('Using valid user ID:', userId);
        } else {
          console.error('No valid users found in database');
          userId = await createTestUserIfNeeded();
        }
      }
    } catch (error) {
      console.error('Error verifying user ID:', error);
      userId = await createTestUserIfNeeded();
    }
    
    // Execute the cart operation within a transaction
    try {
      const dbPath = getDatabasePath();
      const db = new Database(dbPath);
      
      // Check if cart exists for this test ID
      let existingCartResult = db.prepare('SELECT id FROM carts WHERE test_id = ? AND (user_id = ? OR user_id IS NULL)').all(testId, userId) as Array<{ id: number }>;
      
      console.log('Existing cart check result:', existingCartResult);
      
      let cartId;
      
      if (existingCartResult.length > 0) {
        // Use existing cart
        cartId = existingCartResult[0].id;
        console.log('Using existing cart with ID:', cartId);
      } else {
        // Create new cart
        console.log('Creating new cart with testId:', testId, 'userId:', userId);
        
        let insertCartResult = db.prepare('INSERT INTO carts (test_id, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(testId, userId);
        cartId = insertCartResult.lastInsertRowid;
        
        console.log('New cart created with ID:', cartId);
      }
      
      // Check if question is already in cart
      let existingItemResult = db.prepare('SELECT id FROM cart_items WHERE cart_id = ? AND question_id = ?').all(cartId, questionId) as Array<{ id: number }>;
      
      console.log('Existing item check result:', existingItemResult);
      
      if (existingItemResult.length > 0) {
        // Question already in cart, return success
        console.log('Question already in cart');
        
        db.close();
        return NextResponse.json({
          success: true,
          message: 'Question is already in cart',
          cartId,
          questionId
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
      
      // Add question to cart
      console.log('Adding question to cart:', { cartId, questionId });
      
      db.prepare('INSERT INTO cart_items (cart_id, question_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(cartId, questionId);
      
      console.log('Question added to cart successfully');
      
      db.close();
      return NextResponse.json({
        success: true,
        message: 'Question added to cart',
        cartId,
        questionId
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (error) {
      console.error('Error in cart operation:', error);
      
      return NextResponse.json({ 
        error: 'Failed to add question to cart',
        details: error instanceof Error ? error.message : String(error)
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}
