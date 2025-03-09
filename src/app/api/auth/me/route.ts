import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import getSupabaseClient from '@/lib/database/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/auth/me - Checking authentication status');
    
    // Set CORS headers
    const origin = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000' 
      : '*';
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (origin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    let accessToken = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      console.log('Access token found in Authorization header');
    } else {
      console.log('No access token in Authorization header');
    }
    
    // If no access token in header, check for it in the request cookies
    if (!accessToken) {
      const cookieStore = cookies();
      const refreshToken = cookieStore.get('refresh_token')?.value;
      
      if (!refreshToken) {
        console.log('No refresh token found in cookies');
        return NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 }
        );
      }
      
      console.log('Refresh token found in cookies, verifying');
      
      // Verify the refresh token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET environment variable is not defined');
        throw new Error('JWT_SECRET is not defined');
      }
      
      try {
        // Verify and decode the refresh token
        const decoded = jwt.verify(refreshToken, jwtSecret) as { userId: string };
        console.log('Refresh token verified, checking if valid in database');
        
        // Get Supabase client using our utility function
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.error('Failed to initialize Supabase client');
          return NextResponse.json(
            { success: false, message: 'Database connection error' },
            { status: 500 }
          );
        }
        
        // Check if the refresh token exists in the database and is not revoked
        const { data: tokenData, error: tokenError } = await supabase
          .from('refresh_tokens')
          .select('*')
          .eq('token', refreshToken)
          .eq('revoked', false)
          .single();
        
        if (tokenError || !tokenData) {
          console.log('Invalid or revoked refresh token');
          return NextResponse.json(
            { success: false, message: 'Not authenticated' },
            { status: 401 }
          );
        }
        
        console.log('Refresh token valid, getting user data');
        
        // Get the user from the database
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();
        
        if (userError || !user) {
          console.log('User not found for refresh token');
          return NextResponse.json(
            { success: false, message: 'Not authenticated' },
            { status: 401 }
          );
        }
        
        console.log('User found, generating new access token');
        
        // Generate a new access token
        accessToken = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            role: user.role
          },
          jwtSecret,
          { expiresIn: '1h' }
        );
        
        console.log('New access token generated successfully');
        
        // Create user object without sensitive data
        const safeUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
        };
        
        console.log('Authentication successful via refresh token for user:', safeUser.username);
        
        // Return the user data and new access token
        return NextResponse.json({
          success: true,
          message: 'Authentication successful',
          user: safeUser,
          accessToken,
        }, { headers });
      } catch (error) {
        console.error('Error verifying refresh token:', error);
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    
    console.log('Verifying access token');
    
    // Verify the access token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not defined');
      throw new Error('JWT_SECRET is not defined');
    }
    
    try {
      // Verify and decode the access token
      const decoded = jwt.verify(accessToken, jwtSecret) as { userId: string };
      console.log('Access token verified, getting user data');
      
      // Get Supabase client using our utility function
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.error('Failed to initialize Supabase client');
        return NextResponse.json(
          { success: false, message: 'Database connection error' },
          { status: 500 }
        );
      }
      
      // Get the user from the database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
      
      if (userError || !user) {
        console.log('User not found for access token');
        return NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 }
        );
      }
      
      // Create user object without sensitive data
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login,
      };
      
      console.log('Authentication successful via access token for user:', safeUser.username);
      
      // Return the user data
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: safeUser,
      }, { headers });
    } catch (error) {
      console.error('Error verifying access token:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    
    // Set CORS headers even for error responses
    const origin = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000' 
      : '*';
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (origin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication check failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  // Get the origin from the request
  const origin = process.env.NODE_ENV === 'production' 
    ? 'http://localhost:3000' // In production, be more restrictive
    : '*';  // In development, allow any origin
    
  // If using credentials with '*' origin, browsers will block the request
  // So we need to set Access-Control-Allow-Credentials only when not using '*'
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  // Only add credentials header if not using wildcard origin
  if (origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return new NextResponse(null, {
    status: 204,
    headers,
  });
} 