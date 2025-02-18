import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth/actions';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Call the login function from actions
    const result = await login({ email, password });
    
    if (result.success) {
      // You might want to set a cookie or create a session here
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
