import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import supabase from '@/lib/database/supabaseClient';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function GET(request: NextRequest) {
  try {
    // Get the refresh token from the HTTP-only cookie
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not provided' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    try {
      // First verify the token signature
      const decoded = verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as {
        userId: number;
        role: string;
        email: string;
      };

      // Then check if the token exists in the database and is not revoked
      const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .eq('is_revoked', false)
        .single();

      if (error || !data) {
        console.error('Invalid refresh token:', error?.message || 'Token not found in database');
        return NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
      }

      // Check if the token has expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        console.error('Refresh token has expired');
        return NextResponse.json(
          { error: 'Refresh token has expired' },
          { status: 401 }
        );
      }

      // Get the user from the database to ensure they still exist and have the same role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError?.message || 'User does not exist');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Generate a new access token
      const accessToken = sign(
        {
          userId: userData.id,
          role: userData.role,
          email: userData.email
        },
        process.env.JWT_SECRET as string,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // Generate a new refresh token
      const newRefreshToken = sign(
        {
          userId: userData.id,
          role: userData.role,
          email: userData.email
        },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // Calculate the expiration date for the new refresh token
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + REFRESH_TOKEN_EXPIRY_MS);

      // Store the new refresh token in the database
      const { error: insertError } = await supabase
        .from('refresh_tokens')
        .insert({
          user_id: userData.id,
          token: newRefreshToken,
          expires_at: expirationDate.toISOString(),
          is_revoked: false
        });

      if (insertError) {
        console.error('Failed to store refresh token:', insertError.message);
        return NextResponse.json(
          { error: 'Failed to generate new refresh token' },
          { status: 500 }
        );
      }

      // Revoke the old refresh token
      await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token', refreshToken);

      // Set the new refresh token as an HTTP-only cookie
      cookieStore.set('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_EXPIRY_MS / 1000, // Convert to seconds
        path: '/'
      });

      // Return the new access token
      return NextResponse.json({ accessToken });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 