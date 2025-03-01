import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function PUT(request: NextRequest) {
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
    // Only admins can update users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    // Parse request body
    let { id, username, email, password, role, is_active } = await request.json();
    // Validate input
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Validate role if provided
    if (role !== undefined && role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role. Must be either "user" or "admin".' }, { status: 400 });
    }

    // Check if user exists and is active
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!existingUser.is_active && is_active !== true) {
      return NextResponse.json({ error: 'Cannot update inactive user' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    
    if (username) {
      updateData.username = username;
    }
    
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }
    
    if (email) {
      updateData.email = email;
    }
    
    if (role !== undefined) {
      updateData.role = role;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    try {
      // Update user in Supabase
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, username, email, role, is_active, last_login, created_at, updated_at')
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update user',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found or no changes made' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser,
        changes: 1, // Supabase doesn't return changes count like SQLite
      });
    } catch (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update user',
          details: updateError instanceof Error ? updateError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (unexpectedError) {
    console.error('Unexpected error in user update:', unexpectedError);
    return NextResponse.json(
      {
        error: 'Critical server error',
        details: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
