import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { SignJWT } from 'jose';
import path from 'path';
import crypto from 'crypto';
import * as init from '@/lib/database/init';
const DB_PATH = init.DB_PATH;

const LOG_LEVEL = 'debug'; // 'error', 'warn', 'info' | 'debug'
function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    console[level](logMessage, JSON.stringify(data, null, 2));
  } else {
    console[level](logMessage);
  }
}
function generateJwtSecret(): string {
  // Use a consistent method to generate a secure secret
  return crypto.randomBytes(32).toString('hex');
}
export async function POST(request: NextRequest) {
  let db;
  try {
    const DB_PATH = init.DB_PATH;
    // Ensure JWT secret is available and consistent
    const jwtSecret = process.env.JWT_SECRET || generateJwtSecret();
    log('debug', 'Database Path', { DB_PATH, DATABASE_URL: process.env.DATABASE_URL });
    log('debug', 'JWT Secret', {
      secretAvailable: !!jwtSecret,
      secretLength: jwtSecret.length,
      JWT_SECRET: process.env.JWT_SECRET
    });
    // Log full request details
    log('debug', 'Received login request', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });
    // Validate request method
    log('info', 'Validating request method');
    if (request.method !== 'POST') {
      log('error', 'Invalid HTTP method');
      return NextResponse.json(
        {
          error: 'Method Not Allowed',
          details: 'Only POST method is supported',
        },
        { status: 405 }
      );
    }
    // Check content type explicitly
    const contentType = request.headers.get('content-type');
    log('debug', 'Content Type', { contentType });
    if (!contentType || !contentType.includes('application/json')) {
      log('error', 'Invalid content type', { contentType });
      return NextResponse.json(
        {
          error: 'Unsupported Media Type',
          details: 'Content-Type must be application/json',
        },
        { status: 415 }
      );
    }
    // Safe JSON parsing with detailed error handling
    let body;
    try {
      body = await request.json();
      log('debug', 'Parsed request body', body);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      log('error', 'JSON parsing error', {
        errorName: parseError instanceof Error ? parseError.name : 'Unknown Error',
        errorMessage,
      });
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: 'Invalid JSON in request body',
          rawError: errorMessage,
        },
        { status: 400 }
      );
    }
    const { email, password } = body;
    // Comprehensive input validation
    if (!email || !password) {
      log('error', 'Missing credentials', {
        email: !!email,
        password: !!password,
      });
      return NextResponse.json(
        {
          error: 'Validation Failed',
          details: 'Email and password are required',
        },
        { status: 422 }
      );
    }
    // Database connection with error handling
    try {
      log('info', 'Connecting to database', { DB_PATH });
      db = new Database(DB_PATH, { readonly: true });
      log('info', 'Database connection successful', { DB_PATH });
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      log('error', 'Database connection failed', {
        errorName: dbError instanceof Error ? dbError.name : 'Unknown Error',
        errorMessage,
      });
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          details: 'Database connection failed',
          rawError: errorMessage,
        },
        { status: 500 }
      );
    }
    // User lookup with detailed logging
    log('info', 'Looking up user', { email });
    let user;
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      user = stmt.get(email) as
        | {
            id: number;
            email: string;
            password: string;
            role: 'admin' | 'user';
          }
        | undefined;
      log('debug', 'User lookup result', {
        userFound: !!user,
        email: user?.email,
      });
      log('debug', 'User object', { user });
    }  catch (lookupError: unknown) {
      const errorMessage = lookupError instanceof Error ? lookupError.message : String(lookupError);
      log('error', 'User lookup error', {
        errorName: lookupError instanceof Error ? lookupError.name : 'Unknown Error',
        errorMessage,
      });
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          details: 'User lookup failed',
          rawError: errorMessage,
        },
        { status: 500 }
      );
    } finally {
      db.close();
    }
    if (!user) {
      log('warn', 'User not found', { email });
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          details: 'Invalid credentials',
        },
        { status: 401 }
      );
    }
    // Validate role
    if (!['admin', 'user'].includes(user.role)) {
      log('error', 'Invalid user role', { role: user.role });
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: 'Invalid user role',
        },
        { status: 403 }
      );
    }
    // Password verification
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      log('debug', 'Password verification', { isPasswordValid });
    } catch (compareError: unknown) {
      const errorMessage =
        compareError instanceof Error ? compareError.message : String(compareError);
      log('error', 'Password comparison error', {
        errorName: compareError instanceof Error ? compareError.name : 'Unknown Error',
        errorMessage,
      });
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          details: 'Password comparison failed',
          rawError: errorMessage,
        },
        { status: 500 }
      );
    }
    if (!isPasswordValid) {
      log('warn', 'Invalid password', { email, isPasswordValid });
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          details: 'Invalid credentials',
        },
        { status: 401 }
      );
    }
    // Generate JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(jwtSecret));
    log('debug', 'Login successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    // Return token and user details
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (unexpectedError: unknown) {
    const errorMessage =
      unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
    log('error', 'Unexpected error in login process', {
      errorName: unexpectedError instanceof Error ? unexpectedError.name : 'Unknown Error',
      errorMessage,
      stack: unexpectedError instanceof Error ? unexpectedError.stack : undefined,
    });
    log('error', 'Returning 500 error', { errorMessage });
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: 'An unexpected error occurred during login',
        rawError: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}
