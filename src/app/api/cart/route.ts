import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';
import { getCartQuestions } from '@/lib/database/cartQueries';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

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

// Function to check if we're in Render environment
function isRenderEnvironment(): boolean {
  return process.env.RENDER === 'true' || !!process.env.RENDER;
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

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { testId, questionId } = await request.json();
    
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
    
    // Check if cart exists
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();
    
    let cartId: number;
    
    if (cartError) {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          test_id: testId,
          user_id: userId,
          metadata: {}
        })
        .select();
      
      if (createError) {
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }
      
      cartId = newCart[0].id;
    } else {
      cartId = cart.id;
    }
    
    // Check if question is already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cartId)
      .eq('question_id', questionId)
      .single();
    
    if (existingItem) {
      return NextResponse.json({
        success: true,
        message: 'Question is already in cart'
      });
    }
    
    // Add question to cart
    const { error: addError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        question_id: Number(questionId)
      });
    
    if (addError) {
      return NextResponse.json({ error: 'Failed to add question to cart' }, { status: 500 });
    }
    
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

export async function GET(request: NextRequest) {
  try {
    // Get test ID from query parameters
    const url = new URL(request.url);
    const testId = url.searchParams.get('testId');
    
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
    
    // Get cart questions
    const questions = await getCartQuestions(testId, userId);
    
    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      vercelMode: isVercelEnvironment()
    });
  } catch (error) {
    console.error('Error getting cart questions:', error);
    return NextResponse.json({ 
      error: 'Failed to get cart questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
