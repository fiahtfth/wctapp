import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      success: false,
      steps: [],
      fixes: [],
      testCart: null
    };

    // Step 1: Check database connection
    try {
      results.steps.push({ name: 'Check database connection', status: 'running' });
      
      // Use raw query to check connection instead of from() to avoid type errors
      const { error } = await supabaseAdmin.rpc('version');
      
      if (error) {
        results.steps[0].status = 'error';
        results.steps[0].error = error.message;
        return NextResponse.json(results);
      } else {
        results.steps[0].status = 'success';
        results.steps[0].message = 'Database connection successful';
      }
    } catch (error) {
      results.steps[0].status = 'error';
      results.steps[0].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Step 2: Check if tables exist and create them if they don't
    try {
      results.steps.push({ name: 'Check required tables', status: 'running' });
      
      // Check carts table using raw SQL to avoid type errors
      const { data: cartsExists, error: cartsCheckError } = await supabaseAdmin.rpc('check_table_exists', { 
        table_name: 'carts' 
      });
      
      if (cartsCheckError) {
        // If the function doesn't exist, create it first
        const createCheckFunction = `
          CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT) 
          RETURNS BOOLEAN AS $$
          DECLARE
              exists BOOLEAN;
          BEGIN
              SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public'
                  AND table_name = $1
              ) INTO exists;
              RETURN exists;
          END;
          $$ LANGUAGE plpgsql;
        `;
        
        await supabaseAdmin.rpc('exec_sql', { sql: createCheckFunction }).catch(() => {
          // If RPC fails, try direct query (this might fail due to permissions)
          return { error: new Error('Could not create check_table_exists function') };
        });
        
        // Try again after creating the function
        const { data: retryCartsExists } = await supabaseAdmin.rpc('check_table_exists', { 
          table_name: 'carts' 
        }).catch(() => {
          return { data: false };
        });
        
        if (!retryCartsExists) {
          // Table doesn't exist, create it
          results.fixes.push({ name: 'Create carts table', status: 'running' });
          
          const createCartsQuery = `
            CREATE TABLE IF NOT EXISTS carts (
              id SERIAL PRIMARY KEY,
              test_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              metadata JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS carts_test_id_idx ON carts(test_id);
            CREATE INDEX IF NOT EXISTS carts_user_id_idx ON carts(user_id);
          `;
          
          // Try to execute SQL directly
          const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createCartsQuery }).catch(() => {
            return { error: new Error('Could not create carts table') };
          });
          
          if (createError) {
            results.fixes[results.fixes.length - 1].status = 'error';
            results.fixes[results.fixes.length - 1].error = createError.message;
            return NextResponse.json(results);
          }
          
          results.fixes[results.fixes.length - 1].status = 'success';
          results.fixes[results.fixes.length - 1].message = 'Created carts table';
        }
      } else if (!cartsExists) {
        // Table doesn't exist, create it
        results.fixes.push({ name: 'Create carts table', status: 'running' });
        
        const createCartsQuery = `
          CREATE TABLE IF NOT EXISTS carts (
            id SERIAL PRIMARY KEY,
            test_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS carts_test_id_idx ON carts(test_id);
          CREATE INDEX IF NOT EXISTS carts_user_id_idx ON carts(user_id);
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createCartsQuery }).catch(() => {
          return { error: new Error('Could not create carts table') };
        });
        
        if (createError) {
          results.fixes[results.fixes.length - 1].status = 'error';
          results.fixes[results.fixes.length - 1].error = createError.message;
          return NextResponse.json(results);
        }
        
        results.fixes[results.fixes.length - 1].status = 'success';
        results.fixes[results.fixes.length - 1].message = 'Created carts table';
      }
      
      // Check cart_items table
      const { data: cartItemsExists, error: cartItemsCheckError } = await supabaseAdmin.rpc('check_table_exists', { 
        table_name: 'cart_items' 
      }).catch(() => {
        return { data: false, error: null };
      });
      
      if ((cartItemsCheckError && cartItemsCheckError.code === '42P01') || !cartItemsExists) {
        // Table doesn't exist, create it
        results.fixes.push({ name: 'Create cart_items table', status: 'running' });
        
        const createCartItemsQuery = `
          CREATE TABLE IF NOT EXISTS cart_items (
            id SERIAL PRIMARY KEY,
            cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
            question_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
          CREATE INDEX IF NOT EXISTS cart_items_question_id_idx ON cart_items(question_id);
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createCartItemsQuery }).catch(() => {
          return { error: new Error('Could not create cart_items table') };
        });
        
        if (createError) {
          results.fixes[results.fixes.length - 1].status = 'error';
          results.fixes[results.fixes.length - 1].error = createError.message;
          return NextResponse.json(results);
        }
        
        results.fixes[results.fixes.length - 1].status = 'success';
        results.fixes[results.fixes.length - 1].message = 'Created cart_items table';
      }
      
      results.steps[1].status = 'success';
      results.steps[1].message = 'All required tables exist or were created';
    } catch (error) {
      results.steps[1].status = 'error';
      results.steps[1].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Step 3: Create a test cart and add items
    try {
      results.steps.push({ name: 'Create test cart', status: 'running' });
      
      // Generate a unique test ID
      const testId = `test_${Date.now()}`;
      
      // Create a test cart using raw SQL to avoid type errors
      const insertCartSQL = `
        INSERT INTO carts (test_id, user_id, metadata)
        VALUES ('${testId}', 'test_user', '{"test": true, "name": "Test Cart"}'::jsonb)
        RETURNING *;
      `;
      
      const { data: cartResult, error: cartError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: insertCartSQL 
      }).catch(() => {
        return { data: null, error: new Error('Failed to insert test cart') };
      });
      
      if (cartError || !cartResult || !Array.isArray(cartResult) || cartResult.length === 0) {
        results.steps[2].status = 'error';
        results.steps[2].error = cartError ? cartError.message : 'Failed to create test cart';
        return NextResponse.json(results);
      }
      
      const cart = cartResult[0];
      results.testCart = cart;
      
      // Check if questions table exists and has data
      const { data: questionsExists } = await supabaseAdmin.rpc('check_table_exists', { 
        table_name: 'questions' 
      }).catch(() => {
        return { data: false };
      });
      
      if (!questionsExists) {
        // Questions table doesn't exist, create a simple version for testing
        results.fixes.push({ name: 'Create questions table', status: 'running' });
        
        const createQuestionsQuery = `
          CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            text TEXT,
            subject TEXT,
            topic TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert test questions if table is empty
          INSERT INTO questions (id, text, subject, topic)
          SELECT 1001, 'Test question 1', 'Math', 'Algebra'
          WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1);
          
          INSERT INTO questions (id, text, subject, topic)
          SELECT 1002, 'Test question 2', 'Science', 'Physics'
          WHERE NOT EXISTS (SELECT 1 FROM questions WHERE id = 1002);
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createQuestionsQuery }).catch(() => {
          return { error: new Error('Could not create questions table') };
        });
        
        if (createError) {
          results.fixes[results.fixes.length - 1].status = 'error';
          results.fixes[results.fixes.length - 1].error = createError.message;
          return NextResponse.json(results);
        }
        
        results.fixes[results.fixes.length - 1].status = 'success';
        results.fixes[results.fixes.length - 1].message = 'Created questions table with test data';
      }
      
      // Get question IDs to use
      const getQuestionsSQL = `SELECT id FROM questions LIMIT 2;`;
      const { data: questionIdsResult, error: idsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getQuestionsSQL 
      }).catch(() => {
        return { data: null, error: new Error('Failed to get question IDs') };
      });
      
      if (idsError || !questionIdsResult || !Array.isArray(questionIdsResult) || questionIdsResult.length === 0) {
        results.steps[2].status = 'error';
        results.steps[2].error = idsError ? idsError.message : 'No questions found';
        return NextResponse.json(results);
      }
      
      // Add cart items
      const cartItems = questionIdsResult.map(q => ({
        cart_id: cart.id,
        question_id: q.id
      }));
      
      let insertedItems = [];
      for (const item of cartItems) {
        const insertItemSQL = `
          INSERT INTO cart_items (cart_id, question_id)
          VALUES (${item.cart_id}, ${item.question_id})
          RETURNING *;
        `;
        
        const { data: itemResult, error: itemError } = await supabaseAdmin.rpc('exec_sql', { 
          sql: insertItemSQL 
        }).catch(() => {
          return { data: null, error: new Error(`Failed to insert cart item for question ${item.question_id}`) };
        });
        
        if (itemError || !itemResult) {
          results.steps[2].status = 'error';
          results.steps[2].error = itemError ? itemError.message : 'Failed to create cart items';
          return NextResponse.json(results);
        }
        
        if (Array.isArray(itemResult) && itemResult.length > 0) {
          insertedItems.push(itemResult[0]);
        }
      }
      
      results.steps[2].status = 'success';
      results.steps[2].message = `Created test cart with ID ${testId} and added ${insertedItems.length} items`;
      results.testCartItems = insertedItems;
    } catch (error) {
      results.steps[2].status = 'error';
      results.steps[2].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // Step 4: Verify cart can be retrieved
    try {
      results.steps.push({ name: 'Verify cart retrieval', status: 'running' });
      
      const testId = results.testCart.test_id;
      
      // Get cart
      const getCartSQL = `SELECT * FROM carts WHERE test_id = '${testId}';`;
      const { data: cartResult, error: cartError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getCartSQL 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve cart') };
      });
      
      if (cartError || !cartResult || !Array.isArray(cartResult) || cartResult.length === 0) {
        results.steps[3].status = 'error';
        results.steps[3].error = cartError ? cartError.message : `Cart with test_id ${testId} not found`;
        return NextResponse.json(results);
      }
      
      const cart = cartResult[0];
      
      // Get cart items
      const getItemsSQL = `SELECT * FROM cart_items WHERE cart_id = ${cart.id};`;
      const { data: cartItemsResult, error: itemsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getItemsSQL 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve cart items') };
      });
      
      if (itemsError || !cartItemsResult || !Array.isArray(cartItemsResult) || cartItemsResult.length === 0) {
        results.steps[3].status = 'error';
        results.steps[3].error = itemsError ? itemsError.message : 'No cart items found';
        return NextResponse.json(results);
      }
      
      // Get questions
      const questionIds = cartItemsResult.map(item => item.question_id).join(',');
      const getQuestionsSQL = `SELECT * FROM questions WHERE id IN (${questionIds});`;
      const { data: questionsResult, error: questionsError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: getQuestionsSQL 
      }).catch(() => {
        return { data: null, error: new Error('Failed to retrieve questions') };
      });
      
      if (questionsError || !questionsResult || !Array.isArray(questionsResult) || questionsResult.length === 0) {
        results.steps[3].status = 'error';
        results.steps[3].error = questionsError ? questionsError.message : 'No questions found';
        return NextResponse.json(results);
      }
      
      results.steps[3].status = 'success';
      results.steps[3].message = `Successfully retrieved cart with ${questionsResult.length} questions`;
      results.retrievedCart = cart;
      results.retrievedItems = cartItemsResult;
      results.retrievedQuestions = questionsResult;
    } catch (error) {
      results.steps[3].status = 'error';
      results.steps[3].error = error instanceof Error ? error.message : String(error);
      return NextResponse.json(results);
    }

    // All steps completed successfully
    results.success = true;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in test-and-fix API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to test and fix database',
      success: false
    }, { status: 500 });
  }
} 