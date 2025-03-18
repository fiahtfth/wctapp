import { NextRequest, NextResponse } from 'next/server';
import getSupabaseClient, { supabaseAdmin } from '@/lib/database/supabaseClient';
import { removeQuestionFromCart } from '@/lib/database/cartQueries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { questionId, testId, userId } = await request.json();
    
    // Validate inputs
    if (!questionId || !testId) {
      return NextResponse.json({ error: 'Question ID and Test ID are required' }, { status: 400 });
    }
    
    // Try to remove question from cart using Supabase
    try {
      // If userId is provided, use it
      if (userId) {
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        const result = await removeQuestionFromCart(questionId, testId, numericUserId);
        return NextResponse.json({ success: true, message: 'Question removed from cart successfully' });
      }
      
      // Otherwise, try to remove from local storage (client-side only)
      return NextResponse.json({ 
        success: { 
          success: false, 
          message: 'Failed to initialize Supabase client and local storage failed' 
        } 
      });
    } catch (error) {
      console.error('Error removing question from cart:', error);
      
      // Try to remove from local storage as fallback
      return NextResponse.json({ 
        success: { 
          success: false, 
          message: 'Failed to remove question from cart, try using local storage' 
        } 
      });
    }
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return NextResponse.json({ 
      error: 'Failed to remove question from cart',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
