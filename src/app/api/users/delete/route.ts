import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
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
  
  return logEntry;
}

export async function DELETE(request: NextRequest) {
  try {
    log('info', 'User deletion request received');
    
    // Check if we should use mock data
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (useMockData) {
      log('info', 'Using mock data for user deletion');
      return NextResponse.json({ success: true, message: 'User deleted (mock)' }, { status: 200 });
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
      log('error', 'Non-admin user attempted to delete a user', { userId: payload.sub, role: payload.role });
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    log('info', 'Received user deletion request', { userId: body.id });
    
    // Validate required fields
    if (!body.id) {
      log('error', 'Missing user ID');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent admin from deleting themselves
    if (payload.userId && String(payload.userId) === String(body.id)) {
      log('error', 'Admin attempted to delete their own account', { userId: body.id });
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role')
      .eq('id', body.id)
      .single();
    
    if (fetchError || !existingUser) {
      log('error', 'User not found', { userId: body.id, error: fetchError });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    log('info', 'Found user to delete', { 
      userId: existingUser.id, 
      username: existingUser.username,
      email: existingUser.email 
    });
    
    // Delete the user from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', body.id);
    
    if (deleteError) {
      log('error', 'User deletion failed', { userId: body.id, error: deleteError });
      return NextResponse.json({ error: 'Failed to delete user', details: deleteError.message }, { status: 500 });
    }
    
    log('info', 'User deleted successfully', { 
      userId: existingUser.id, 
      username: existingUser.username 
    });
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email
      }
    }, { status: 200 });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Unexpected error in user deletion', { error: errorMessage });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
