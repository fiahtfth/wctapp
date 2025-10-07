import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

// Define types for cart items
interface CartItem {
  id: number;
  question_id: number;
  questions: any; // This could be more specific if needed
}

/**
 * API endpoint to test the cart functionality
 * GET /api/cart/test
 * Returns the current state of the cart for testing purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Supabase client
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
    }

    // Get the test ID from the query parameters
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId') || 'default-test-id';

    // For testing purposes, we'll skip authentication to avoid dynamic server usage
    let isAuthenticated = false;
    let userId = null;

    // If the user is authenticated, get the cart from the database
    let cartItems: CartItem[] = [];
    let cartDetails = null;

    if (isAuthenticated) {
      // Get the cart
      const { data: cart, error: cartError } = await supabaseAdmin
        .from('carts')
        .select('id, test_id, metadata')
        .eq('test_id', testId)
        .maybeSingle();

      if (cartError) {
        console.error('Error getting cart:', cartError);
        return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
      }

      if (cart) {
        cartDetails = cart;

        // Get the cart items
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('cart_items')
          .select(`
            id,
            question_id,
            questions:question_id (*)
          `)
          .eq('cart_id', cart.id);

        if (itemsError) {
          console.error('Error getting cart items:', itemsError);
          return NextResponse.json({ error: 'Failed to get cart items' }, { status: 500 });
        }

        cartItems = items || [];
      }
    }

    // Return the cart state
    return NextResponse.json({
      success: true,
      isAuthenticated,
      userId,
      testId,
      cartDetails,
      cartItems,
      localStorageCart: 'Check browser localStorage for client-side cart data'
    });
  } catch (error) {
    console.error('Error in cart test endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}