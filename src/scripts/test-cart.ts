// Test script for cart functionality
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get database connection
function getDatabase() {
  // Try different possible locations for the database
  const possiblePaths = [
    path.join(process.cwd(), 'wct.db'),
    path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db')
  ];
  
  let dbPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dbPath = p;
      break;
    }
  }
  
  if (!dbPath) {
    throw new Error('Database file not found');
  }
  
  console.log(`Using database at: ${dbPath}`);
  return new Database(dbPath);
}

async function testCartFunctionality() {
  console.log('🧪 Starting cart functionality test');
  
  // Create test data
  const testId = uuidv4();
  const userId = 278; // Using a valid user ID from the database
  const questionId = 5; // Using a valid question ID from the database
  
  console.log(`Test parameters: testId=${testId}, userId=${userId}, questionId=${questionId}`);
  
  const db = getDatabase();
  
  try {
    // Start transaction
    db.prepare('BEGIN').run();
    
    // Test 1: Add question to cart
    console.log('📝 Test 1: Adding question to cart');
    
    // First, check if the question exists
    const questionExists = db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
    if (!questionExists) {
      throw new Error(`Question with ID ${questionId} does not exist`);
    }
    
    // Create or get cart
    const cart = db.prepare('INSERT OR IGNORE INTO carts (test_id, user_id) VALUES (?, ?)').run(testId, userId);
    const cartRow = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);
    
    if (!cartRow) {
      throw new Error('Failed to create or find cart');
    }
    
    const cartId = (cartRow as { id: number }).id;
    console.log(`Cart ID: ${cartId}`);
    
    // Add question to cart
    const addResult = db.prepare('INSERT OR IGNORE INTO cart_items (cart_id, question_id) VALUES (?, ?)').run(cartId, questionId);
    console.log(`✅ Added question to cart: ${addResult.changes > 0 ? 'Success' : 'Already in cart'}`);
    
    // Test 2: Get cart questions
    console.log('📝 Test 2: Getting cart questions');
    const questions = db.prepare(`
      SELECT 
        q.id,
        q.Question,
        q.Answer,
        q.Subject
      FROM questions q
      JOIN cart_items ci ON ci.question_id = q.id
      WHERE ci.cart_id = ?
    `).all(cartId);
    
    console.log(`✅ Retrieved ${questions.length} questions from cart`);
    if (questions.length > 0) {
      console.log('First question:', questions[0]);
    }
    
    // Test 3: Remove question from cart
    console.log('📝 Test 3: Removing question from cart');
    const removeResult = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND question_id = ?').run(cartId, questionId);
    console.log(`✅ Removed question from cart: ${removeResult.changes > 0 ? 'Success' : 'Not in cart'}`);
    
    // Verify question was removed
    const questionsAfterRemove = db.prepare(`
      SELECT COUNT(*) as count
      FROM cart_items
      WHERE cart_id = ? AND question_id = ?
    `).get(cartId, questionId);
    
    console.log(`✅ Questions remaining after removal: ${(questionsAfterRemove as { count: number }).count}`);
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    db.close();
  }
}

// Run the test
testCartFunctionality()
  .then(() => {
    console.log('🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Fatal error in test script:', error);
    process.exit(1);
  });
