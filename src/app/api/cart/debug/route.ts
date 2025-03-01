import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get test ID from URL
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    console.log('Debugging cart for test:', testId);
    
    const results: any = {
      testId,
      steps: [],
      success: false,
      cart: null,
      cartItems: [],
      questions: []
    };
    
    // Step 1: Check if tables exist
    try {
      results.steps.push({ name: 'Check tables', status: 'running' });
      
      // Check carts table
      const { data: cartsTable, error: cartsError } = await supabaseAdmin
        .from('carts')
        .select('id')
        .limit(1);
      
      if (cartsError) {
        results.steps[0].status = 'error';
        results.steps[0].error = cartsError.message;
        results.error = 'Carts table does not exist or cannot be accessed';
        return NextResponse.json(results);
      }
      
      // Check cart_items table
      const { data: cartItemsTable, error: cartItemsError } = await supabaseAdmin
        .from('cart_items')
        .select('id')
        .limit(1);
      
      if (cartItemsError) {
        results.steps[0].status = 'error';
        results.steps[0].error = cartItemsError.message;
        results.error = 'Cart_items table does not exist or cannot be accessed';
        return NextResponse.json(results);
      }
      
      // Check questions table
      const { data: questionsTable, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select('id')
        .limit(1);
      
      if (questionsError) {
        results.steps[0].status = 'error';
        results.steps[0].error = questionsError.message;
        results.error = 'Questions table does not exist or cannot be accessed';
        return NextResponse.json(results);
      }
      
      results.steps[0].status = 'success';
      results.steps[0].message = 'All required tables exist';
    } catch (error) {
      results.steps[0].status = 'error';
      results.steps[0].error = error instanceof Error ? error.message : String(error);
      results.error = 'Error checking tables';
      return NextResponse.json(results);
    }
    
    // Step 2: Check if cart exists
    try {
      results.steps.push({ name: 'Check cart', status: 'running' });
      
      const { data: cart, error: cartError } = await supabaseAdmin
        .from('carts')
        .select('*')
        .eq('test_id', testId)
        .single();
      
      if (cartError) {
        results.steps[1].status = 'error';
        results.steps[1].error = cartError.message;
        results.error = `Cart with test_id ${testId} not found`;
        return NextResponse.json(results);
      }
      
      results.steps[1].status = 'success';
      results.steps[1].message = `Found cart with ID ${cart.id}`;
      results.cart = cart;
    } catch (error) {
      results.steps[1].status = 'error';
      results.steps[1].error = error instanceof Error ? error.message : String(error);
      results.error = 'Error checking cart';
      return NextResponse.json(results);
    }
    
    // Step 3: Check cart items
    try {
      results.steps.push({ name: 'Check cart items', status: 'running' });
      
      const { data: cartItems, error: cartItemsError } = await supabaseAdmin
        .from('cart_items')
        .select('*')
        .eq('cart_id', results.cart.id);
      
      if (cartItemsError) {
        results.steps[2].status = 'error';
        results.steps[2].error = cartItemsError.message;
        results.error = `Error fetching cart items for cart ID ${results.cart.id}`;
        return NextResponse.json(results);
      }
      
      if (!cartItems || cartItems.length === 0) {
        results.steps[2].status = 'warning';
        results.steps[2].message = `No cart items found for cart ID ${results.cart.id}`;
        results.error = 'Cart exists but has no items';
        return NextResponse.json(results);
      }
      
      results.steps[2].status = 'success';
      results.steps[2].message = `Found ${cartItems.length} cart items`;
      results.cartItems = cartItems;
    } catch (error) {
      results.steps[2].status = 'error';
      results.steps[2].error = error instanceof Error ? error.message : String(error);
      results.error = 'Error checking cart items';
      return NextResponse.json(results);
    }
    
    // Step 4: Check questions
    try {
      results.steps.push({ name: 'Check questions', status: 'running' });
      
      const questionIds = results.cartItems.map((item: any) => item.question_id);
      
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select('*')
        .in('id', questionIds);
      
      if (questionsError) {
        results.steps[3].status = 'error';
        results.steps[3].error = questionsError.message;
        results.error = 'Error fetching questions';
        return NextResponse.json(results);
      }
      
      if (!questions || questions.length === 0) {
        results.steps[3].status = 'warning';
        results.steps[3].message = 'No questions found for the given IDs';
        results.error = 'Cart items exist but questions not found';
        return NextResponse.json(results);
      }
      
      if (questions.length !== questionIds.length) {
        results.steps[3].status = 'warning';
        results.steps[3].message = `Found ${questions.length} questions out of ${questionIds.length} expected`;
        results.warning = 'Some questions are missing';
      } else {
        results.steps[3].status = 'success';
        results.steps[3].message = `Found all ${questions.length} questions`;
      }
      
      results.questions = questions;
    } catch (error) {
      results.steps[3].status = 'error';
      results.steps[3].error = error instanceof Error ? error.message : String(error);
      results.error = 'Error checking questions';
      return NextResponse.json(results);
    }
    
    // All steps completed successfully
    results.success = true;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in cart debug API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to debug cart',
      success: false
    }, { status: 500 });
  }
} 