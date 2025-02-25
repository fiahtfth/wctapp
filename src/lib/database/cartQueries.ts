'use server';

import { openDatabase } from './queries';
import { Question } from '@/types/question';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';
import { initializeDatabase } from './init';

// Initialize database
initializeDatabase().catch(console.error);

// Create cart tables if they dont exist
const createCartTables = async () => {
  const db = await openDatabase();
  
  try {
    // Create cart table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
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

export const addQuestionToCart = asyncErrorHandler(async (questionId: number | string, testId: string, userId: number): Promise<boolean> => {
  const db = await openDatabase();
  
  try {
    // Start a transaction
    db.prepare('BEGIN').run();

    // Validate that the question exists
    const questionExists = db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
    if (!questionExists) {
      throw new AppError(`Question with ID ${questionId} does not exist`, 404);
    }

    // Validate that the user exists
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
      console.error(`User with ID ${userId} does not exist in the database`);
      
      // Try to find user by email as fallback (if we have an email table)
      try {
        const userByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get('navneet@nextias.com');
        if (userByEmail) {
          userId = (userByEmail as any).id;
          console.log(`Using fallback user ID: ${userId}`);
        } else {
          throw new AppError(`User with ID ${userId} does not exist and no fallback found`, 404);
        }
      } catch (emailLookupError) {
        // If the email lookup fails, throw the original error
        throw new AppError(`User with ID ${userId} does not exist`, 404);
      }
    }

    // Get or create cart
    const cart = db.prepare('INSERT OR IGNORE INTO carts (test_id, user_id) VALUES (?, ?)').run(testId, userId);

    const cartRow = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);

    if (!cartRow) {
      throw new Error('Failed to create or find cart');
    }

    const cartId = (cartRow as { id: number }).id;

    // Add question to cart
    const result = db.prepare('INSERT OR IGNORE INTO cart_items (cart_id, question_id) VALUES (?, ?)').run(cartId, questionId);

    // Commit transaction
    db.prepare('COMMIT').run();

    return result.changes > 0;
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Error in addQuestionToCart:', error);
    throw error;
  } finally {
    db.close();
  }
});

export const removeQuestionFromCart = asyncErrorHandler(async (questionId: number | string, testId: string, userId: number): Promise<boolean> => {
  const db = await openDatabase();
  
  try {
    // Get cart ID
    const cart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);
    if (!cart) return false;

    // Remove question from cart
    const result = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND question_id = ?').run((cart as { id: number }).id, questionId);

    return result.changes > 0;
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  } finally {
    db.close();
  }
});

export const getCartQuestions = asyncErrorHandler(async (testId: string, userId: number): Promise<Question[]> => {
  const db = await openDatabase();
  
  try {
    // First check if cart exists
    const cart = db.prepare('SELECT id FROM carts WHERE test_id = ? AND user_id = ?').get(testId, userId);

    if (!cart) {
      return [];
    }

    // Get count of items in cart
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?').get((cart as { id: number }).id);

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
    `).all((cart as { id: number }).id);
    
    return questions as Question[];
  } catch (error) {
    console.error('Error getting cart questions:', error);
    throw error;
  } finally {
    db.close();
  }
});
