import { NextRequest, NextResponse } from 'next/server';
import getSupabaseClient from '@/lib/database/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId, testName, batch, date, questionIds, existingTestId } = await request.json();
    
    // Validate inputs
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!testName) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 });
    }
    
    if (!questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: 'Question IDs are required' }, { status: 400 });
    }
    
    // Ensure userId is a valid number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId) || numericUserId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Create a cart entry with a generated test_id or use the existing one
    const testId = existingTestId || `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Get the Supabase client
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
      }
      
      // Ensure all questionIds are valid numbers
      const validQuestionIds = questionIds
        .map((id: any) => {
          // Convert to number if it's a string
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          // Check if it's a valid number
          return !isNaN(numId) ? numId : null;
        })
        .filter((id: number | null) => id !== null) as number[];
      
      if (validQuestionIds.length === 0) {
        return NextResponse.json({ error: 'No valid question IDs provided' }, { status: 400 });
      }
      
      // If we're updating an existing draft, first check if it exists
      if (existingTestId) {
        const { data: existingCart, error: existingCartError } = await supabase
          .from('carts')
          .select('id')
          .eq('test_id', existingTestId)
          .eq('user_id', numericUserId)
          .single();
        
        if (!existingCartError && existingCart) {
          // Delete existing cart items first
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', existingCart.id);
          
          if (deleteError) {
            console.error('Error deleting existing cart items:', deleteError);
            return NextResponse.json({ error: 'Failed to update cart items' }, { status: 500 });
          }
          
          // Add new cart items
          const cartItems = validQuestionIds.map((questionId: number) => ({
            cart_id: existingCart.id,
            question_id: questionId
          }));
          
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert(cartItems);
          
          if (insertError) {
            console.error('Error inserting cart items:', insertError);
            return NextResponse.json({ error: 'Failed to add cart items' }, { status: 500 });
          }
          
          return NextResponse.json({ success: true, testId });
        }
      }
      
      // Create a new cart entry
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .insert({
          test_id: testId,
          user_id: numericUserId,
          metadata: {
            testName,
            batch,
            date
          }
        })
        .select();

      if (cartError) {
        console.error('Error creating cart:', cartError);
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }

      const cartId = cartData[0].id;

      // Then add cart items
      const cartItems = validQuestionIds.map((questionId: number) => ({
        cart_id: cartId,
        question_id: questionId
      }));

      const { error: insertError } = await supabase
        .from('cart_items')
        .insert(cartItems);

      if (insertError) {
        console.error('Error inserting cart items:', insertError);
        // If we fail to insert items, clean up the cart we just created
        await supabase.from('carts').delete().eq('id', cartId);
        return NextResponse.json({ error: 'Failed to add cart items' }, { status: 500 });
      }

      return NextResponse.json({ success: true, testId });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in saveDraftCart:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 