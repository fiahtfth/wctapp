import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import supabase from '@/lib/database/supabaseClient';

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

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// Function to check if we should use mock data
function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

export async function POST(request: NextRequest) {
  try {
    // Ensure JWT secret is available and consistent
    const jwtSecret = process.env.JWT_SECRET || generateJwtSecret();
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
        { 
          status: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
        { 
          status: 415,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
        { 
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // If we're using mock data (either in Vercel or development)
    if (shouldUseMockData()) {
      log('info', 'Using mock authentication');
      
      // For demo purposes, allow a specific test account
      if (email === 'admin@nextias.com' && password === 'admin123') {
        const token = await new SignJWT({ 
          userId: 1,
          email: 'admin@nextias.com',
          role: 'admin',
          username: 'admin'
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(new TextEncoder().encode(jwtSecret));
        
        return NextResponse.json(
          {
            success: true,
            message: 'Login successful (mock)',
            token,
            user: {
              id: 1,
              email: 'admin@nextias.com',
              username: 'admin',
              role: 'admin'
            },
            vercelMode: true
          },
          { 
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      } else {
        return NextResponse.json(
          {
            error: 'Authentication Failed',
            details: 'Invalid credentials (mock)',
            vercelMode: true
          },
          { 
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
    }
    
    // Find user by email using Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      log('error', 'User not found', { email, error: userError?.message });
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          details: 'Invalid email or password',
        },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      log('error', 'Password mismatch', { email });
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          details: 'Invalid email or password',
        },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Update last login timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    if (updateError) {
      log('warn', 'Failed to update last login time', { userId: user.id, error: updateError.message });
      // Continue anyway, this is not critical
    }
    
    // Generate JWT token
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(jwtSecret));
    
    log('info', 'Login successful', { userId: user.id, email: user.email });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Unhandled exception during login', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: 'An unexpected error occurred during login',
        rawError: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}
