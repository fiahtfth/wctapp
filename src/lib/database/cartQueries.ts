'use server';

import { openDatabase } from './queries';
import { Question } from '@/types/question';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';

// Create cart tables if they don't exist
const createCartTables = async () => {
  const db = await openDatabase();
  
  try {
    // Create cart table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_test_id UNIQUE(test_id)
      )
    `).run();

    // Create cart items table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id),
        FOREIGN KEY (question_id) REFERENCES questions(id),
        CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
      )
    `).run();
  } catch (error) {
    console.error('Error creating cart tables:', error);
    throw new AppError('Failed to create cart tables', 500, error);
  } finally {
    db.close();
  }
};

// Initialize tables
createCartTables().catch(console.error);

export const addQuestionToCart = asyncErrorHandler(async (questionId: number | string, testId: string): Promise<boolean> => {
  console.log('Adding question to cart:', { questionId, testId });
  const db = await openDatabase();
  
  try {
    // Start a transaction
    db.prepare('BEGIN').run();
    console.log('Started transaction');

    // Get or create cart
    const cart = db.prepare('INSERT OR IGNORE INTO carts (test_id) VALUES (?)').run(testId);
    console.log('Cart creation result:', cart);

    const cartRow = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(testId);
    console.log('Cart lookup result:', cartRow);

    if (!cartRow) {
      throw new Error('Failed to create or find cart');
    }

    const cartId = cartRow.id;
    console.log('Using cartId:', cartId);

    // Add question to cart
    const result = db.prepare('INSERT OR IGNORE INTO cart_items (cart_id, question_id) VALUES (?, ?)').run(cartId, questionId);
    console.log('Add to cart result:', result);

    // Commit transaction
    db.prepare('COMMIT').run();
    console.log('Committed transaction');

    return result.changes > 0;
  } catch (error) {
    // Rollback on error
    console.error('Error in addQuestionToCart:', error);
    db.prepare('ROLLBACK').run();
    throw error;
  } finally {
    db.close();
  }
});

export const removeQuestionFromCart = asyncErrorHandler(async (questionId: number | string, testId: string): Promise<boolean> => {
  const db = await openDatabase();
  
  try {
    // Get cart ID
    const cart = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(testId);
    if (!cart) return false;

    // Remove question from cart
    const result = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND question_id = ?').run(cart.id, questionId);

    return result.changes > 0;
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  } finally {
    db.close();
  }
});

export const getCartQuestions = asyncErrorHandler(async (testId: string): Promise<Question[]> => {
  console.log('getCartQuestions called with testId:', testId);
  const db = await openDatabase();
  
  try {
    // First check if cart exists
    const cart = db.prepare('SELECT id FROM carts WHERE test_id = ?').get(testId);
    console.log('Cart lookup result:', cart);

    if (!cart) {
      console.log('No cart found for testId:', testId);
      return [];
    }

    // Get count of items in cart
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?').get(cart.id);
    console.log('Cart item count:', itemCount);

    // Get questions in cart with all necessary fields
    const questions = db.prepare(`
      SELECT 
        q.id,
        q.Question,
        q.Answer,
        q.Explanation,
        q.Subject,
        q."Module Name" as ModuleName,
        q.Topic,
        q."Sub Topic" as SubTopic,
        q."Difficulty Level" as DifficultyLevel,
        q.Question_Type as QuestionType,
        q."Nature of Question" as NatureOfQuestion
      FROM questions q
      JOIN cart_items ci ON ci.question_id = q.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `).all(cart.id);
    
    console.log('Found cart questions:', questions);

    // Verify questions table
    const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
    console.log('Total questions in database:', questionCount);

    return questions;
  } catch (error) {
    console.error('Error getting cart questions:', error);
    throw error;
  } finally {
    db.close();
  }
});
