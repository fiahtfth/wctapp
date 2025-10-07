import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import getSupabaseClient from '@/lib/database/supabaseClient';

// Get cookie domain based on environment
function getCookieDomain(): string {
  // In production, use the actual domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.COOKIE_DOMAIN || '';
  }
  // In development, use localhost
  return 'localhost';
}

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the HTTP-only cookie
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // If there's a refresh token, revoke it in the database
    if (refreshToken) {
      // Get Supabase client
      const supabase = getSupabaseClient();
      
      if (supabase) {
        await supabase
          .from('refresh_tokens')
          .update({ is_revoked: true })
          .eq('token', refreshToken);
      }
    }

    // Clear the cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    cookieStore.delete('refresh_token');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  // Get the origin from the request
  const origin = process.env.NODE_ENV === 'production' 
    ? 'http://localhost:3000' // In production, be more restrictive
    : '*';  // In development, allow any origin
    
  // If using credentials with '*' origin, browsers will block the request
  // So we need to set Access-Control-Allow-Credentials only when not using '*'
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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