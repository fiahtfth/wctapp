import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function POST(request: NextRequest) {
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
    const { username, email, password, role = 'user' } = await request.json();
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Validate role
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // Insert user into Supabase
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          username,
          email,
          password_hash: passwordHash,
          role,
          is_active: true
        })
        .select('id, username, email, role, is_active, last_login, created_at, updated_at')
        .single();

      if (error) {
        console.error('User creation error:', error);
        
        // Check for unique constraint violation
        if (error.code === '23505') { // PostgreSQL unique constraint violation code
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
            details: error.message,
          },
          { status: 500 }
        );
      }

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
      return NextResponse.json(
        {
          error: 'Failed to create user',
          details: insertError instanceof Error ? insertError.message : 'Unknown error',
        },
        { status: 500 }
      );
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
