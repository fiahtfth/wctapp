import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';
import path from 'path';
import fs from 'fs';
import { User } from '@/types/user';
function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    console[level](logMessage, JSON.stringify(data, null, 2));
  } else {
    console[level](logMessage);
  }
  // Optional: Log to file for persistent debugging
  try {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'users_list.log');
    fs.appendFileSync(
      logFile,
      `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`
    );
  } catch (fileLogError) {
    console.error('Error logging to file:', fileLogError);
  }
}
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'email' in obj &&
    'role' in obj &&
    typeof (obj as User).email === 'string' &&
    typeof (obj as User).role === 'string'
  );
}
function isUserArray(arr: unknown): arr is User[] {
  return Array.isArray(arr) && arr.every(isUser);
}
export async function GET(request: NextRequest) {
  let db;
  try {
    // Log incoming request details
    log('debug', 'Incoming user list request', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      log('warn', 'No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      log('warn', 'No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      log('error', 'JWT_SECRET is not set');
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
        username?: string;
        exp: number;
      };
      log('debug', 'Token verification successful', {
        userId: decoded.userId,
        role: decoded.role,
      });
    } catch (verifyError) {
      log('error', 'Token verification error', verifyError);
      return NextResponse.json(
        {
          error: 'Invalid token',
          details:
            verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        },
        { status: 401 }
      );
    }
    // Only admins can list users
    if (decoded.role !== 'admin') {
      log('warn', 'Unauthorized access attempt', { role: decoded.role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    // Resolve database path dynamically
    const dbPath = path.resolve(process.cwd(), 'dev.db');
    // Verify database file exists
    if (!fs.existsSync(dbPath)) {
      log('error', 'Database file not found', { dbPath });
      return NextResponse.json(
        {
          error: 'Database file not found',
          details: `Path: ${dbPath}`,
        },
        { status: 500 }
      );
    }
    // Open database connection
    try {
      db = new Database(dbPath, { readonly: true });
      log('debug', 'Database connection established', { dbPath });
    } catch (dbError) {
      log('error', 'Database connection error', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    // Prepare select statement with error handling
    let users: User[] = [];
    try {
      const stmt = db.prepare(`
                SELECT 
                    id, 
                    email, 
                    role, 
                    created_at,
                    updated_at
                FROM users 
                ORDER BY created_at DESC
            `);
      const rawUsers = stmt.all();
      // Log detailed information about retrieved users
      log('debug', 'Users retrieval details', {
        userCount: rawUsers ? rawUsers.length : 0,
        usersType: typeof rawUsers,
        usersIsArray: Array.isArray(rawUsers),
      });
      // Validate and filter users
      if (isUserArray(rawUsers)) {
        users = rawUsers;
      } else {
        const validUsers = rawUsers.filter(isUser);
        log('warn', 'Some retrieved users did not match the User type', {
          totalRetrieved: rawUsers.length,
          validUsersCount: validUsers.length,
        });
        users = validUsers;
      }
      // Optional: Add a default user if no users exist (for testing/development)
      if (users.length === 0) {
        log('warn', 'No users found in database. Adding a default admin user.');
        // Prepare a default admin user insertion statement
        const insertStmt = db.prepare(`
                    INSERT INTO users 
                    (email, password, role) 
                    VALUES (?, ?, ?)
                `);
        // Use a hashed password for the default admin (in a real scenario, this would be more secure)
        const hashedPassword = '$2a$10$ExampleHashedPasswordForDevelopment';
        try {
          const result = insertStmt.run('default_admin@example.com', hashedPassword, 'admin');
          log('info', 'Default admin user created', {
            insertedId: result.lastInsertRowid,
          });
          // Refetch users to get the newly inserted user
          const newRawUsers = stmt.all();
          if (isUserArray(newRawUsers)) {
            users = newRawUsers;
          } else {
            const validNewUsers = newRawUsers.filter(isUser);
            users = validNewUsers;
          }
        } catch (insertError) {
          log('error', 'Failed to insert default admin user', insertError);
        }
      }
    } catch (queryError) {
      log('error', 'User query error', queryError);
      return NextResponse.json(
        {
          error: 'Failed to retrieve users',
          details: queryError instanceof Error ? queryError.message : 'Unknown error',
          suggestedAction: 'Check database connection and user table',
        },
        { status: 500 }
      );
    } finally {
      // Always close the database connection
      if (db) {
        db.close();
        log('debug', 'Database connection closed');
      }
    }
    // Return users with additional metadata
    return NextResponse.json(
      {
        users: users as User[],
        total: users.length,
        timestamp: new Date().toISOString(),
        message: users.length === 0 ? 'No users found' : 'Users retrieved successfully',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (unexpectedError) {
    log('error', 'Unexpected error in user listing', unexpectedError);
    return NextResponse.json(
      {
        error: 'Critical server error',
        details: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
