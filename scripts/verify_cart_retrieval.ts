import * as dbAdapter from '../src/lib/database/adapter';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: number;
  Question: string;
  Subject: string;
  'Module Name': string;
  Topic: string;
  [key: string]: any;  // Allow dynamic properties
}

interface QueryResult<T> {
  rows: T[];
}

async function verifyCartRetrieval() {
  try {
    console.log('🕵️ Verifying Cart Retrieval Process');

    // Get a user with an existing cart or create a new cart
    const userQuery = 'SELECT id FROM users ORDER BY id LIMIT 1';
    const userResult: QueryResult<{id: number}> = await dbAdapter.executeQuery(userQuery);
    const userId = userResult.rows[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    // Generate a unique test ID
    const testId = uuidv4();
    console.log(`🆔 Generated Test ID: ${testId}`);

    // Create cart
    const cartQuery = `
      INSERT OR IGNORE INTO carts (test_id, user_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;
    await dbAdapter.executeQuery(cartQuery, [testId, userId]);
    console.log('🛒 Cart Created');

    // Get cart ID
    const cartIdQuery = 'SELECT id FROM carts WHERE test_id = ? AND user_id = ?';
    const cartIdResult: QueryResult<{id: number}> = await dbAdapter.executeQuery(cartIdQuery, [testId, userId]);
    const cartId = cartIdResult.rows[0].id;
    console.log(`🆔 Cart ID: ${cartId}`);

    // Add multiple questions to the cart
    const addQuestionsQuery = `
      INSERT OR IGNORE INTO cart_items (cart_id, question_id, created_at)
      SELECT ?, id, datetime('now')
      FROM questions
      ORDER BY RANDOM()
      LIMIT 5
    `;
    await dbAdapter.executeQuery(addQuestionsQuery, [cartId]);
    console.log('📝 Added Random Questions to Cart');

    // Verify cart contents with full question details
    const verifyCartQuery = `
      SELECT 
        q.id, 
        q.Question, 
        q.Subject, 
        q."Module Name", 
        q.Topic,
        q."Difficulty Level",
        q.Question_Type,
        ci.created_at as added_at
      FROM cart_items ci
      JOIN questions q ON ci.question_id = q.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `;
    const cartContentsResult: QueryResult<Question & {added_at: string}> = 
      await dbAdapter.executeQuery(verifyCartQuery, [cartId]);
    
    console.log('🔍 Cart Contents:');
    cartContentsResult.rows.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        id: item.id,
        question: item.Question.substring(0, 100) + '...',
        subject: item.Subject,
        moduleName: item['Module Name'],
        topic: item.Topic,
        difficultyLevel: item['Difficulty Level'],
        questionType: item['Question_Type'],
        addedAt: item.added_at
      });
    });

    // Simulate API retrieval query
    const apiRetrievalQuery = `
      SELECT 
        q.id, 
        q.Question, 
        q.Answer, 
        q.Explanation, 
        q.Subject, 
        q."Module Name", 
        q.Topic,
        q."Difficulty Level",
        q.Question_Type,
        ci.created_at as added_at
      FROM cart_items ci
      JOIN questions q ON ci.question_id = q.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.test_id = ? AND c.user_id = ?
      ORDER BY ci.created_at DESC
    `;
    const apiResult: QueryResult<Question & {Answer: string, Explanation: string, added_at: string}> = 
      await dbAdapter.executeQuery(apiRetrievalQuery, [testId, userId]);
    
    console.log('🌐 API-Style Retrieval:');
    apiResult.rows.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        id: item.id,
        question: item.Question.substring(0, 100) + '...',
        answer: item.Answer?.substring(0, 50) + '...',
        explanation: item.Explanation?.substring(0, 50) + '...',
        subject: item.Subject,
        moduleName: item['Module Name'],
        topic: item.Topic,
        addedAt: item.added_at
      });
    });

    console.log('✅ Cart Retrieval Verification Complete');
    return {
      userId,
      testId,
      cartId,
      cartContents: cartContentsResult.rows,
      apiStyleContents: apiResult.rows
    };
  } catch (error) {
    console.error('❌ Cart Retrieval Verification Error:', error);
    throw error;
  }
}

verifyCartRetrieval();
