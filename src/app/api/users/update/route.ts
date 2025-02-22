import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';
import path from 'path';
export async function PUT(request: NextRequest) {
  let db;
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
    let { id, email, role } = await request.json();
    // Validate input
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    // Resolve database path dynamically
    const dbPath = path.resolve(process.cwd(), 'dev.db');
    // Open database connection
    try {
      db = new Database(dbPath);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    // Prepare update statement
    const updateFields = [];
    const params = [];
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    if (updateFields.length === 1) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }
    params.push(id);
    try {
      const stmt = db.prepare(`
                UPDATE users 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `);
      const result = stmt.run(...params);
      if (result.changes === 0) {
        return NextResponse.json({ error: 'User not found or no changes made' }, { status: 404 });
      }
      // Fetch updated user details
      const getUserStmt = db.prepare(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?'
      );
      const updatedUser = getUserStmt.get(id);
      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser,
        changes: result.changes,
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
    } finally {
      // Always close the database connection
      if (db) db.close();
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
