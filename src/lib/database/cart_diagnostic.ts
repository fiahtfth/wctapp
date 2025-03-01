import * as dbAdapter from './adapter';

export async function diagnoseCartIssues(userId?: number, testId?: string) {
  try {
    console.log('🔍 Comprehensive Cart Diagnostic Started');
    
    // If no specific user or test ID is provided, get the first user and a recent test
    if (!userId) {
      const firstUserQuery = 'SELECT id FROM users ORDER BY id LIMIT 1';
      const userResult = await dbAdapter.executeQuery(firstUserQuery);
      userId = userResult.rows[0]?.id;
    }

    if (!testId) {
      const recentCartQuery = 'SELECT test_id FROM carts ORDER BY created_at DESC LIMIT 1';
      const cartResult = await dbAdapter.executeQuery(recentCartQuery);
      testId = cartResult.rows[0]?.test_id;
    }

    console.log(`🕵️ Investigating User ID: ${userId}, Test ID: ${testId}`);
    
    // Check user details
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    const userResult = await dbAdapter.executeQuery(userQuery, [userId]);
    console.log('👤 User Details:', userResult.rows[0] || 'No user found');

    // Check cart existence
    const cartQuery = 'SELECT * FROM carts WHERE user_id = ? AND test_id = ?';
    const cartResult = await dbAdapter.executeQuery(cartQuery, [userId, testId]);
    console.log('🛒 Cart Details:', cartResult.rows[0] || 'No cart found');

    let cartItemsResult = { rows: [] };
    if (cartResult.rows.length > 0) {
      const cartId = cartResult.rows[0].id;

      // Detailed cart items query
      const cartItemsQuery = `
        SELECT 
          ci.id as cart_item_id, 
          ci.cart_id, 
          ci.question_id, 
          ci.created_at as item_added_at,
          q.*
        FROM cart_items ci
        JOIN questions q ON ci.question_id = q.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at DESC
      `;
      cartItemsResult = await dbAdapter.executeQuery(cartItemsQuery, [cartId]);
      
      console.log('📋 Cart Items Count:', cartItemsResult.rows.length);
      cartItemsResult.rows.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`, {
          cartItemId: item.cart_item_id,
          questionId: item.question_id,
          question: item.Question?.substring(0, 100) + '...',
          subject: item.Subject,
          addedAt: item.item_added_at
        });
      });
    }

    console.log('🔍 Cart Diagnostic Completed');
    return {
      userId,
      testId,
      user: userResult.rows[0],
      cart: cartResult.rows[0],
      cartItems: cartItemsResult.rows
    };
  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
    throw error;
  }
}

export async function listSampleQuestions() {
  try {
    const query = `
      SELECT * FROM questions 
      WHERE Question LIKE '%Sample Question%' 
      OR Subject = 'Sample Subject'
      LIMIT 10
    `;
    const result = await dbAdapter.executeQuery(query);
    
    console.log('🏷️ Sample Questions:');
    result.rows.forEach((q, index) => {
      console.log(`  Sample Question ${index + 1}:`, {
        id: q.id,
        question: q.Question,
        subject: q.Subject
      });
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Sample Questions Listing Error:', error);
    throw error;
  }
}

export async function removeSampleQuestions() {
  try {
    const deleteQuery = `
      DELETE FROM questions 
      WHERE Question LIKE '%Sample Question%' 
      OR Subject = 'Sample Subject'
    `;
    const result = await dbAdapter.executeQuery(deleteQuery);
    
    console.log('🗑️ Removed Sample Questions:', result);
    return result;
  } catch (error) {
    console.error('❌ Sample Questions Removal Error:', error);
    throw error;
  }
}
