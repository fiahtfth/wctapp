import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Bearer token is required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    try {
      const decoded = verify(token, process.env.JWT_SECRET as string) as {
        userId: number;
        role: string;
        email: string;
      };
      
      // Return the protected data
      return NextResponse.json({
        message: 'You have access to protected data',
        user: {
          userId: decoded.userId,
          role: decoded.role,
          email: decoded.email
        }
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Protected route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 