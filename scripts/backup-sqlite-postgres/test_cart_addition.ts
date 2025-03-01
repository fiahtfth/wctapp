import * as dbAdapter from '../src/lib/database/adapter';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: number;
  Question: string;
  Subject: string;
}

interface QueryResult<T> {
  rows: T[];
}

async function testCartAddition(): Promise<{
  userId: number;
  questionId: number;
  testId: string;
  cartId: number;
  cartContents: Question[];
}> {
  try {
    console.log('🧪 Testing Cart Addition Process');

    // Get the first user
    const userQuery = 'SELECT id FROM users ORDER BY id LIMIT 1';
    const userResult: QueryResult<{id: number}> = await dbAdapter.executeQuery(userQuery);
    const userId = userResult.rows[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    // Get a sample question
    const questionQuery = 'SELECT id, Question FROM questions ORDER BY RANDOM() LIMIT 1';
    const questionResult: QueryResult<{id: number, Question: string}> = await dbAdapter.executeQuery(questionQuery);
    const questionId = questionResult.rows[0].id;
    const questionText = questionResult.rows[0].Question;
    console.log(`❓ Selected Question ID: ${questionId}`);
    console.log(`   Question: ${questionText.substring(0, 100)}...`);

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

    // Add question to cart
    const cartItemQuery = `
      INSERT OR IGNORE INTO cart_items (cart_id, question_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;
    const insertResult = await dbAdapter.executeQuery(cartItemQuery, [cartId, questionId]);
    console.log('📝 Cart Item Insertion Result:', insertResult);

    // Verify cart contents
    const verifyCartQuery = `
      SELECT q.id, q.Question, q.Subject 
      FROM cart_items ci
      JOIN questions q ON ci.question_id = q.id
      WHERE ci.cart_id = ?
    `;
    const cartContentsResult: QueryResult<Question> = await dbAdapter.executeQuery(verifyCartQuery, [cartId]);
    console.log('🔍 Cart Contents:');
    cartContentsResult.rows.forEach((item: Question, index: number) => {
      console.log(`  Item ${index + 1}:`, {
        id: item.id,
        question: item.Question.substring(0, 100) + '...',
        subject: item.Subject
      });
    });

    console.log('✅ Cart Addition Test Complete');
    return {
      userId,
      questionId,
      testId,
      cartId,
      cartContents: cartContentsResult.rows
    };
  } catch (error) {
    console.error('❌ Cart Addition Test Error:', error);
    throw error;
  }
}

testCartAddition();
