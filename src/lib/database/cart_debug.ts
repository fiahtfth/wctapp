import * as dbAdapter from './adapter';
import { v4 as uuidv4 } from 'uuid';

export async function debugCartOperation(userId: number, questionId: number) {
  try {
    console.log('🕵️ Cart Operation Debug');
    
    // Generate a unique test ID
    const testId = uuidv4();
    console.log(`🆔 Generated Test ID: ${testId}`);

    // Ensure cart exists
    const cartQuery = `
      INSERT OR IGNORE INTO carts (test_id, user_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;
    await dbAdapter.executeQuery(cartQuery, [testId, userId]);
    console.log('🛒 Cart Insertion Attempt Completed');

    // Get the cart ID
    const cartResult = await dbAdapter.executeQuery(
      'SELECT id FROM carts WHERE test_id = ? AND user_id = ?', 
      [testId, userId]
    );
    const cartId = cartResult.rows[0]?.id;
    console.log(`🆔 Cart ID: ${cartId}`);

    if (!cartId) {
      throw new Error('Failed to create or retrieve cart');
    }

    // Check if question exists
    const questionCheckQuery = 'SELECT * FROM questions WHERE id = ?';
    const questionResult = await dbAdapter.executeQuery(questionCheckQuery, [questionId]);
    console.log('❓ Question Check:', questionResult.rows.length > 0 ? 'Question Found' : 'Question Not Found');

    // Add question to cart
    const cartItemQuery = `
      INSERT OR IGNORE INTO cart_items (cart_id, question_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;
    const insertResult = await dbAdapter.executeQuery(cartItemQuery, [cartId, questionId]);
    console.log('📝 Cart Item Insertion Result:', insertResult);

    // Verify cart items
    const verifyCartItemsQuery = `
      SELECT q.* 
      FROM cart_items ci
      JOIN questions q ON ci.question_id = q.id
      WHERE ci.cart_id = ?
    `;
    const cartItemsResult = await dbAdapter.executeQuery(verifyCartItemsQuery, [cartId]);
    console.log('📋 Cart Items:', cartItemsResult.rows);

    return {
      testId,
      cartId,
      cartItems: cartItemsResult.rows
    };

  } catch (error) {
    console.error('❌ Cart Operation Debug Error:', error);
    throw error;
  }
}

export async function listAllQuestions(limit = 10) {
  try {
    const query = 'SELECT * FROM questions LIMIT ?';
    const result = await dbAdapter.executeQuery(query, [limit]);
    
    console.log('📜 Questions:');
    result.rows.forEach((q, index) => {
      console.log(`  Question ${index + 1}:`, {
        id: q.id,
        question: q.Question.substring(0, 100) + '...',
        subject: q.Subject
      });
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Questions Listing Error:', error);
    throw error;
  }
}
