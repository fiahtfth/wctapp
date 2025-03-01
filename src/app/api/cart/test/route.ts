import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      success: false,
      tests: [],
      testCart: null
    };

    // Test 1: Check if required tables exist
    try {
      results.tests.push({ name: 'Check required tables', status: 'running' });
      
      // Check if tables exist using raw SQL
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('carts', 'cart_items', 'questions');
      `;
      
      const { data: tables, error: tablesError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: tablesQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to check tables') };
      });
      
      if (tablesError) {
        results.tests[0].status = 'error';
        results.tests[0].error = tablesError.message;
        return NextResponse.json(results);
      }
      
      if (!tables || !Array.isArray(tables) || tables.length < 3) {
        const missingTables = ['carts', 'cart_items', 'questions'].filter(
          table => !tables?.some((t: any) => t.table_name === table)
        );
        
        results.tests[0].status = 'error';
        results.tests[0].error = `Missing tables: ${missingTables.join(', ')}`;
        return NextResponse.json(results);
      }
      
      results.tests[0].status = 'success';
      results.tests[0].message = 'All required tables exist';
    } catch (error) {
      results.tests[0].status = 'error';
      results.tests[0].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 2: Create a test cart
    try {
      results.tests.push({ name: 'Create test cart', status: 'running' });
      
      // Generate a unique test ID
      const testId = `test_${Date.now()}`;
      const userId = 'test_user';
      
      // Create a test cart
      const createCartQuery = `
        INSERT INTO carts (test_id, user_id, metadata)
        VALUES ('${testId}', '${userId}', '{"test": true, "name": "Test Cart", "batch": "Test Batch", "date": "2023-01-01"}'::jsonb)
        RETURNING *;
      `;
      
      const { data: cartResult, error: cartError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: createCartQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to create test cart') };
      });
      
      if (cartError || !cartResult || !Array.isArray(cartResult) || cartResult.length === 0) {
        results.tests[1].status = 'error';
        results.tests[1].error = cartError ? cartError.message : 'Failed to create test cart';
        return NextResponse.json(results);
      }
      
      const cart = cartResult[0];
      results.testCart = cart;
      
      results.tests[1].status = 'success';
      results.tests[1].message = `Created test cart with ID ${testId}`;
    } catch (error) {
      results.tests[1].status = 'error';
      results.tests[1].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 3: Add items to the cart
    try {
      results.tests.push({ name: 'Add items to cart', status: 'running' });
      
      // Check if questions exist, if not create test questions
      const checkQuestionsQuery = `SELECT COUNT(*) as count FROM questions;`;
      const { data: questionsCountResult, error: countError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: checkQuestionsQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to check questions') };
      });
      
      if (countError || !questionsCountResult || !Array.isArray(questionsCountResult) || questionsCountResult.length === 0) {
        results.tests[2].status = 'error';
        results.tests[2].error = countError ? countError.message : 'Failed to check questions';
        return NextResponse.json(results);
      }
      
      const count = parseInt(questionsCountResult[0].count);
      
      if (count === 0) {
        // Create test questions
        const createQuestionsQuery = `
          INSERT INTO questions (id, text, subject, topic)
          VALUES 
            (1001, 'Test question 1', 'Math', 'Algebra'),
            (1002, 'Test question 2', 'Science', 'Physics')
          ON CONFLICT (id) DO NOTHING
          RETURNING id;
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
          sql: createQuestionsQuery 
        }).catch(() => {
          return { error: new Error('Failed to create test questions') };
        });
        
        if (createError) {
          results.tests[2].status = 'error';
          results.tests[2].error = createError.message;
          return NextResponse.json(results);
        }
      }
      
      // Get question IDs
      const getQuestionsQuery = `SELECT id FROM questions LIMIT 2;`;
      const { data: questionIds, error: idsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getQuestionsQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to get question IDs') };
      });
      
      if (idsError || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        results.tests[2].status = 'error';
        results.tests[2].error = idsError ? idsError.message : 'No questions found';
        return NextResponse.json(results);
      }
      
      // Add items to cart
      const cartItems = [];
      for (const question of questionIds) {
        const addItemQuery = `
          INSERT INTO cart_items (cart_id, question_id)
          VALUES (${results.testCart.id}, ${question.id})
          RETURNING *;
        `;
        
        const { data: itemResult, error: itemError } = await supabaseAdmin.rpc('exec_sql', { 
          sql: addItemQuery 
        }).catch(() => {
          return { data: null, error: new Error(`Failed to add item for question ${question.id}`) };
        });
        
        if (itemError || !itemResult || !Array.isArray(itemResult) || itemResult.length === 0) {
          results.tests[2].status = 'error';
          results.tests[2].error = itemError ? itemError.message : `Failed to add item for question ${question.id}`;
          return NextResponse.json(results);
        }
        
        cartItems.push(itemResult[0]);
      }
      
      results.testCartItems = cartItems;
      results.tests[2].status = 'success';
      results.tests[2].message = `Added ${cartItems.length} items to cart`;
    } catch (error) {
      results.tests[2].status = 'error';
      results.tests[2].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 4: Retrieve cart by test ID
    try {
      results.tests.push({ name: 'Retrieve cart by test ID', status: 'running' });
      
      const testId = results.testCart.test_id;
      
      // Get cart by test ID
      const getCartQuery = `SELECT * FROM carts WHERE test_id = '${testId}';`;
      const { data: cartResult, error: cartError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getCartQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve cart') };
      });
      
      if (cartError || !cartResult || !Array.isArray(cartResult) || cartResult.length === 0) {
        results.tests[3].status = 'error';
        results.tests[3].error = cartError ? cartError.message : `Cart with test_id ${testId} not found`;
        return NextResponse.json(results);
      }
      
      const cart = cartResult[0];
      
      // Get cart items
      const getItemsQuery = `SELECT * FROM cart_items WHERE cart_id = ${cart.id};`;
      const { data: itemsResult, error: itemsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getItemsQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve cart items') };
      });
      
      if (itemsError || !itemsResult || !Array.isArray(itemsResult) || itemsResult.length === 0) {
        results.tests[3].status = 'error';
        results.tests[3].error = itemsError ? itemsError.message : 'No cart items found';
        return NextResponse.json(results);
      }
      
      // Get questions
      const questionIds = itemsResult.map(item => item.question_id).join(',');
      const getQuestionsQuery = `SELECT * FROM questions WHERE id IN (${questionIds});`;
      const { data: questionsResult, error: questionsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getQuestionsQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve questions') };
      });
      
      if (questionsError || !questionsResult || !Array.isArray(questionsResult) || questionsResult.length === 0) {
        results.tests[3].status = 'error';
        results.tests[3].error = questionsError ? questionsError.message : 'No questions found';
        return NextResponse.json(results);
      }
      
      results.retrievedCart = cart;
      results.retrievedItems = itemsResult;
      results.retrievedQuestions = questionsResult;
      
      results.tests[3].status = 'success';
      results.tests[3].message = `Successfully retrieved cart with ${questionsResult.length} questions`;
    } catch (error) {
      results.tests[3].status = 'error';
      results.tests[3].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 5: Update cart
    try {
      results.tests.push({ name: 'Update cart', status: 'running' });
      
      const cartId = results.testCart.id;
      
      // Update cart metadata
      const updateCartQuery = `
        UPDATE carts 
        SET metadata = jsonb_set(metadata, '{updated}', '"true"')
        WHERE id = ${cartId}
        RETURNING *;
      `;
      
      const { data: updateResult, error: updateError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: updateCartQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to update cart') };
      });
      
      if (updateError || !updateResult || !Array.isArray(updateResult) || updateResult.length === 0) {
        results.tests[4].status = 'error';
        results.tests[4].error = updateError ? updateError.message : 'Failed to update cart';
        return NextResponse.json(results);
      }
      
      results.updatedCart = updateResult[0];
      results.tests[4].status = 'success';
      results.tests[4].message = 'Successfully updated cart';
    } catch (error) {
      results.tests[4].status = 'error';
      results.tests[4].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 6: Delete cart items and add new ones
    try {
      results.tests.push({ name: 'Replace cart items', status: 'running' });
      
      const cartId = results.testCart.id;
      
      // Delete existing cart items
      const deleteItemsQuery = `DELETE FROM cart_items WHERE cart_id = ${cartId};`;
      const { error: deleteError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: deleteItemsQuery 
      }).catch(() => {
        return { error: new Error('Failed to delete cart items') };
      });
      
      if (deleteError) {
        results.tests[5].status = 'error';
        results.tests[5].error = deleteError.message;
        return NextResponse.json(results);
      }
      
      // Get first question ID
      const getFirstQuestionQuery = `SELECT id FROM questions ORDER BY id LIMIT 1;`;
      const { data: firstQuestion, error: firstError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getFirstQuestionQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to get first question') };
      });
      
      if (firstError || !firstQuestion || !Array.isArray(firstQuestion) || firstQuestion.length === 0) {
        results.tests[5].status = 'error';
        results.tests[5].error = firstError ? firstError.message : 'No questions found';
        return NextResponse.json(results);
      }
      
      // Add new cart item
      const addItemQuery = `
        INSERT INTO cart_items (cart_id, question_id)
        VALUES (${cartId}, ${firstQuestion[0].id})
        RETURNING *;
      `;
      
      const { data: newItem, error: addError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: addItemQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to add new cart item') };
      });
      
      if (addError || !newItem || !Array.isArray(newItem) || newItem.length === 0) {
        results.tests[5].status = 'error';
        results.tests[5].error = addError ? addError.message : 'Failed to add new cart item';
        return NextResponse.json(results);
      }
      
      results.replacedItems = newItem;
      results.tests[5].status = 'success';
      results.tests[5].message = 'Successfully replaced cart items';
    } catch (error) {
      results.tests[5].status = 'error';
      results.tests[5].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Test 7: Delete cart
    try {
      results.tests.push({ name: 'Delete cart', status: 'running' });
      
      const cartId = results.testCart.id;
      
      // Delete cart (should cascade to cart items)
      const deleteCartQuery = `DELETE FROM carts WHERE id = ${cartId};`;
      const { error: deleteError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: deleteCartQuery 
      }).catch(() => {
        return { error: new Error('Failed to delete cart') };
      });
      
      if (deleteError) {
        results.tests[6].status = 'error';
        results.tests[6].error = deleteError.message;
        return NextResponse.json(results);
      }
      
      // Verify cart is deleted
      const checkCartQuery = `SELECT * FROM carts WHERE id = ${cartId};`;
      const { data: checkResult, error: checkError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: checkCartQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to check if cart was deleted') };
      });
      
      if (checkError) {
        results.tests[6].status = 'error';
        results.tests[6].error = checkError.message;
        return NextResponse.json(results);
      }
      
      if (checkResult && Array.isArray(checkResult) && checkResult.length > 0) {
        results.tests[6].status = 'error';
        results.tests[6].error = 'Cart was not deleted';
        return NextResponse.json(results);
      }
      
      // Verify cart items are deleted
      const checkItemsQuery = `SELECT * FROM cart_items WHERE cart_id = ${cartId};`;
      const { data: checkItemsResult, error: checkItemsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: checkItemsQuery 
      }).catch(() => {
        return { data: null, error: new Error('Failed to check if cart items were deleted') };
      });
      
      if (checkItemsError) {
        results.tests[6].status = 'error';
        results.tests[6].error = checkItemsError.message;
        return NextResponse.json(results);
      }
      
      if (checkItemsResult && Array.isArray(checkItemsResult) && checkItemsResult.length > 0) {
        results.tests[6].status = 'error';
        results.tests[6].error = 'Cart items were not deleted';
        return NextResponse.json(results);
      }
      
      results.tests[6].status = 'success';
      results.tests[6].message = 'Successfully deleted cart and its items';
    } catch (error) {
      results.tests[6].status = 'error';
      results.tests[6].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // All tests completed successfully
    results.success = results.tests.every(test => test.status === 'success');
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in cart test API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to run cart tests',
      success: false
    }, { status: 500 });
  }
}