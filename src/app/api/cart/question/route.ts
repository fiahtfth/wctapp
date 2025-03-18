import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { jwtVerify } from 'jose';
import getSupabaseClient, { supabaseAdmin } from '@/lib/database/supabaseClient';
import { addQuestionToCart } from '@/lib/database/cartQueries';

// JWT secret for token verification
const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me-please';

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// Function to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header found');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret)
    );
    
    // Extract user ID from payload
    const userId = payload.userId;
    
    if (!userId || typeof userId !== 'number') {
      throw new Error('Invalid user ID in token');
    }
    
    return userId;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { questionId, testId } = await request.json();
    
    // Validate inputs
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    // Get user ID from token or use a default
    let userId: number;
    try {
      userId = await getUserIdFromToken(request);
    } catch (error) {
      console.log('No valid token found, using default user ID');
      
      // Use supabaseAdmin instead of supabase
      const supabase = supabaseAdmin;
      if (!supabase) {
        return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
      }
      
      // Check if a user exists with ID 1
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', 1)
        .single();
      
      if (user) {
        userId = 1;
      } else {
        // Create a test user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            role: 'user',
            is_active: true
          })
          .select();
        
        if (error) {
          console.error('Error creating test user:', error);
          return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
        }
        
        userId = newUser[0].id;
      }
    }
    
    // Add question to cart using Supabase
    const result = await addQuestionToCart(questionId, testId, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Question added to cart successfully',
      vercelMode: isVercelEnvironment()
    });
  } catch (error) {
    console.error('Error adding question to cart:', error);
    return NextResponse.json({ 
      error: 'Failed to add question to cart',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const { questionId, testId } = await request.json();
    
    // Validate inputs
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    // Get user ID from token or use a default
    let userId: number;
    try {
      userId = await getUserIdFromToken(request);
    } catch (error) {
      console.log('No valid token found, using default user ID');
      userId = 1; // Default user ID
    }
    
    // Use supabaseAdmin instead of supabase
    const supabase = supabaseAdmin;
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
    }
    
    // Get cart ID
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }
    
    // Remove question from cart
    const { error: removeError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('question_id', questionId);
    
    if (removeError) {
      return NextResponse.json({ error: 'Failed to remove question from cart' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Question removed from cart successfully' 
    });
  } catch (error) {
    console.error('Error removing question from cart:', error);
    return NextResponse.json({ 
      error: 'Failed to remove question from cart',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
