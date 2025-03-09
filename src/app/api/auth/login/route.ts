import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import getSupabaseClient from '@/lib/database/supabaseClient';

// Enhanced logging with environment-aware behavior
function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
  // In production, don't log debug messages and sensitive data
  const isProd = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Skip debug logs in production
  if (isProd && level === 'debug') return;
  
  // Sanitize sensitive data in production
  const sanitizedData = isProd && data ? sanitizeSensitiveData(data) : data;
  
  if (sanitizedData) {
    console[level](logMessage, typeof sanitizedData === 'object' ? JSON.stringify(sanitizedData, null, 2) : sanitizedData);
  } else {
    console[level](logMessage);
  }
}

// Sanitize sensitive data for logging
function sanitizeSensitiveData(data: any): any {
  if (!data) return data;
  
  // Clone the data to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // List of sensitive fields to mask
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'password_hash'];
  
  // Recursively sanitize objects
  function sanitizeObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].length > 0 ? '***REDACTED***' : '';
        }
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
  }
  
  sanitizeObject(sanitized);
  return sanitized;
}

// Function to check if we should use mock data
function shouldUseMockData(): boolean {
  // In production, never use mock data unless explicitly forced
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_MOCK_DATA !== 'true') {
    return false;
  }
  
  // Otherwise, check environment variable
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// JWT token expiration time
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export async function POST(request: NextRequest) {
  try {
    log('info', 'Login API route called');
    
    // Set CORS headers
    const origin = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
      : '*';
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (origin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      log('error', 'Failed to parse request body', { error });
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400, headers }
      );
    }
    
    // Validate input using Zod
    try {
      loginSchema.parse(body);
    } catch (validationError) {
      log('warn', 'Validation error', { validationError });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: validationError instanceof z.ZodError ? validationError.errors : undefined 
        },
        { status: 400, headers }
      );
    }
    
    const { email, password } = body;
    log('info', `Login attempt`, { email });
    
    // Check if we should use mock data (only in development)
    if (shouldUseMockData()) {
      log('warn', 'Using mock data for login - NOT FOR PRODUCTION');
      
      // For testing purposes, accept admin@example.com/admin123
      if (email === 'admin@example.com' && password === process.env.ADMIN_PASSWORD) {
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString(),
        };
        
        // Generate a mock JWT token
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-for-testing';
        const accessToken = sign(
          { 
            userId: mockUser.id,
            email: mockUser.email,
            role: mockUser.role
          },
          jwtSecret,
          { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        log('info', 'Mock admin login successful');
        
        return NextResponse.json({
          success: true,
          message: 'Login successful (mock)',
          user: mockUser,
          accessToken,
        }, { headers });
      }
      
      // For testing purposes, accept user@example.com/user123
      if (email === 'user@example.com' && password === process.env.USER_PASSWORD) {
        const mockUser = {
          id: 2,
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          is_active: true,
          last_login: new Date().toISOString(),
        };
        
        // Generate a mock JWT token
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-for-testing';
        const accessToken = sign(
          { 
            userId: mockUser.id,
            email: mockUser.email,
            role: mockUser.role
          },
          jwtSecret,
          { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        log('info', 'Mock user login successful');
        
        return NextResponse.json({
          success: true,
          message: 'Login successful (mock)',
          user: mockUser,
          accessToken,
        }, { headers });
      }
      
      // If credentials don't match, return error
      log('warn', 'Mock login failed: Invalid credentials');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401, headers }
      );
    }
    
    // Get Supabase client using our utility function
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      log('error', 'Failed to initialize Supabase client');
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500, headers }
      );
    }
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      log('warn', 'User not found', { email, error: userError?.message });
      
      // Use a consistent error message to prevent email enumeration
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401, headers }
      );
    }
    
    log('debug', 'User found, verifying password');
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      log('warn', 'Invalid password attempt', { email });
      
      // Use a consistent error message to prevent email enumeration
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401, headers }
      );
    }
    
    log('debug', 'Password verified successfully');
    
    // Check if user is active
    if (!user.is_active) {
      log('warn', 'Inactive account login attempt', { email });
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact support.' },
        { status: 403, headers }
      );
    }
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      log('error', 'JWT_SECRET environment variable is not defined');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500, headers }
      );
    }
    
    log('debug', 'Generating access token');
    
    // Generate access token
    const accessToken = sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    log('debug', 'Access token generated successfully');
    log('debug', 'Generating refresh token');
    
    // Generate refresh token
    const refreshToken = sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    
    log('debug', 'Refresh token generated successfully');
    log('debug', 'Storing refresh token in database');
    
    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const { error: tokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt.toISOString(),
      });
    
    if (tokenError) {
      log('error', 'Error storing refresh token', { error: tokenError.message });
      return NextResponse.json(
        { success: false, message: 'Authentication error' },
        { status: 500, headers }
      );
    }
    
    log('debug', 'Refresh token stored successfully');
    log('debug', 'Updating last login time');
    
    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    log('debug', 'Setting cookies');
    
    // Set cookies
    const cookieStore = cookies();
    
    // Set refresh token as HTTP-only cookie
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
    
    // Create user object without sensitive data
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
    };
    
    log('info', 'Login successful', { username: safeUser.username, role: safeUser.role });
    
    // Return success response with user data and access token
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      accessToken,
    }, { headers });
  } catch (error) {
    log('error', 'Unexpected error during login', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Set CORS headers even for error responses
    const origin = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
      : '*';
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (origin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const origin = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
    : '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': origin !== '*' ? 'true' : '',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
