import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';
import path from 'path';
export async function POST(request: NextRequest) {
  let db;
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    let decoded;
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      // Validate payload structure
      if (!payload.role || !payload.userId) {
        throw new Error('Invalid token payload');
      }
      decoded = payload as {
        userId: number;
        role: string;
        email: string;
        exp: number;
      };
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return NextResponse.json(
        {
          error: 'Invalid token',
          details:
            verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        },
        { status: 401 }
      );
    }
    // Only admins can create users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    // Parse request body
    const { email, password, role = 'user' } = await request.json();
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Validate role
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    // Resolve database path dynamically
    const dbPath = path.resolve(process.cwd(), 'dev.db');
    // Open database connection
    try {
      db = new Database(dbPath);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    try {
      // Prepare insert statement
      const stmt = db.prepare(`
                INSERT INTO users 
                (email, password, role) 
                VALUES (?, ?, ?)
            `);
      const result = stmt.run(email, passwordHash, role);
      // Fetch the newly created user
      const getUserStmt = db.prepare(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?'
      );
      const newUser = getUserStmt.get(result.lastInsertRowid);
      return NextResponse.json(
        {
          message: 'User created successfully',
          user: newUser,
        },
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (insertError) {
      console.error('User creation error:', insertError);
      // Check for unique constraint violation
      if (insertError instanceof Error && insertError.message.includes('UNIQUE constraint')) {
        return NextResponse.json(
          {
            error: 'User creation failed',
            details: 'Email already exists',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error: 'Failed to create user',
          details: insertError instanceof Error ? insertError.message : 'Unknown error',
        },
        { status: 500 }
      );
    } finally {
      // Always close the database connection
      if (db) db.close();
    }
  } catch (unexpectedError) {
    console.error('Unexpected error in user creation:', unexpectedError);
    return NextResponse.json(
      {
        error: 'Critical server error',
        details: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
