import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import getSupabaseClient from '@/lib/database/supabaseClient';

// Get the admin client for server-side operations
const supabaseAdmin = getSupabaseClient();

// Enhanced logging function
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data ? { data } : {})
  };
  
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
  
  // In production, you might want to log to a file or external service
  return logEntry;
}

export async function POST(request: NextRequest) {
  try {
    log('info', 'User creation request received');
    
    // Check if we should use mock data
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMockData) {
      log('info', 'Using mock data for user creation');
      return NextResponse.json({ success: true, message: 'User created (mock)' }, { status: 201 });
    }
    
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      log('error', 'Supabase admin client is not available');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log('error', 'Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    let payload;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me');
      payload = (await jwtVerify(token, secret)).payload;
      log('info', 'Token verified successfully', { userId: payload.sub });
    } catch (error) {
      log('error', 'Token verification failed', { error });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if the user has admin role
    if (payload.role !== 'admin') {
      log('error', 'Non-admin user attempted to create a user', { userId: payload.sub, role: payload.role });
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    log('info', 'Received user creation data', { username: body.username, email: body.email });
    
    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      log('error', 'Missing required fields', { 
        hasUsername: !!body.username, 
        hasEmail: !!body.email, 
        hasPassword: !!body.password 
      });
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }
    
    // Validate role
    if (body.role && !['user', 'admin'].includes(body.role)) {
      log('error', 'Invalid role specified', { role: body.role });
      return NextResponse.json({ error: 'Role must be either "user" or "admin"' }, { status: 400 });
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);
    log('info', 'Password hashed successfully');
    
    // Create the user in Supabase
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        username: body.username,
        email: body.email,
        password_hash: passwordHash,
        role: body.role || 'user',
        is_active: true
      })
      .select('id, username, email, role')
      .single();
    
    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        log('error', 'User creation failed: Email already exists', { email: body.email, error });
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      
      // Check for table doesn't exist error
      if (error.message.includes('relation "users" does not exist')) {
        log('error', 'Users table does not exist', { error });
        return NextResponse.json({ error: 'Database setup required' }, { status: 500 });
      }
      
      log('error', 'User creation failed', { error });
      return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
    }
    
    log('info', 'User created successfully', { userId: newUser.id, username: newUser.username });
    
    // Return the new user (without password)
    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Unexpected error in user creation', { error: errorMessage });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
