'use server';

import { headers, cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getBaseUrl() {
  // In Vercel, we should use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development or when VERCEL_URL is not available
  try {
    const headersList = await headers();
    const host = (await headersList).get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    console.log('Base URL from headers:', baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('Error getting base URL from headers:', error);
    // Fallback to a hardcoded URL if all else fails
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wctapp-plt7kys8p-fiahtfth-gmailcoms-projects.vercel.app';
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
}

export async function removeFromCart(questionId: number | string, testId: string, token?: string) {
  if (!testId || !questionId) {
    throw new Error('Both testId and questionId are required');
  }

  try {
    const baseUrl = await getBaseUrl();
    const headersList = await headers();
    const authToken = (await headersList).get('authorization') || '';
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      fetchHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(`${baseUrl}/api/cart/remove`, {
      method: 'POST',
      headers: fetchHeaders as any,
      body: JSON.stringify({ questionId, testId }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove question from cart');
    }

    return response.json();
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  }
}

export async function addQuestionToCart(questionId: number, testId: string) {
  console.log('server-actions.addQuestionToCart called with questionId:', questionId, 'testId:', testId);
  
  if (!questionId) {
    throw new Error('Question ID is required');
  }
  
  if (!testId) {
    throw new Error('Test ID is required');
  }
  
  try {
    // Get token from cookies
    const cookiesObj = await cookies();
    const token = cookiesObj.get('token')?.value;
    console.log('Token from cookies:', token ? 'Present' : 'Not present');
    
    // For Vercel deployments, we need to be careful with internal API calls
    // Instead of using fetch with baseUrl, we'll use a direct import approach
    
    // Import the database helper functions
    const { getDatabasePath } = await import('@/app/api/cart/question/route');
    const Database = (await import('better-sqlite3')).default;
    
    try {
      // Get database path
      const dbPath = getDatabasePath();
      console.log('Using database at path:', dbPath);
      
      // Check if we're using PostgreSQL
      const isPostgres = process.env.DB_TYPE === 'postgres';
      console.log('Database type:', isPostgres ? 'PostgreSQL' : 'SQLite');
      
      if (isPostgres) {
        // Use the database adapter for PostgreSQL
        const { executeQuery } = await import('@/lib/database/adapter');
        
        let userId = null;
        
        // If token is present, extract user ID from it
        if (token) {
          const { jwtVerify } = await import('jose');
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_for_development');
          
          try {
            const { payload } = await jwtVerify(token, secret);
            userId = payload.id as number;
            console.log('User ID extracted from token:', userId);
          } catch (tokenError) {
            console.error('Error verifying token:', tokenError);
            // Don't throw, we'll create a test user instead
          }
        }
        
        // If no valid user ID from token, create or get a test user
        if (!userId) {
          console.log('No valid user ID, creating or getting test user');
          
          // Check if any users exist
          const userCountResult = await executeQuery('SELECT COUNT(*) as count FROM users');
          const userCount = userCountResult.rows[0].count;
          
          if (userCount === 0) {
            console.log('No users found, creating a test user');
            
            // Create a test user
            const result = await executeQuery(
              'INSERT INTO users (username, email, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
              ['test_user', 'test@example.com', 'user', true]
            );
            
            userId = result.rows[0].id;
            console.log('Created test user with ID:', userId);
          } else {
            // Get the first user
            const userResult = await executeQuery('SELECT id FROM users LIMIT 1');
            userId = userResult.rows[0].id;
            console.log('Using existing user with ID:', userId);
          }
        }
        
        // Check if cart exists for this test ID
        const existingCartResult = await executeQuery(
          'SELECT id FROM carts WHERE test_id = $1 AND user_id = $2',
          [testId, userId]
        );
        
        let cartId;
        
        if (existingCartResult.rows.length > 0) {
          // Use existing cart
          cartId = existingCartResult.rows[0].id;
          console.log('Using existing cart with ID:', cartId);
        } else {
          // Create a new cart
          const cartResult = await executeQuery(
            'INSERT INTO carts (test_id, user_id) VALUES ($1, $2) RETURNING id',
            [testId, userId]
          );
          
          cartId = cartResult.rows[0].id;
          console.log('Created new cart with ID:', cartId);
        }
        
        // Check if question is already in cart
        const existingItemResult = await executeQuery(
          'SELECT id FROM cart_items WHERE cart_id = $1 AND question_id = $2',
          [cartId, questionId]
        );
        
        if (existingItemResult.rows.length > 0) {
          console.log('Question is already in cart');
          return {
            success: true,
            message: 'Question is already in cart',
            cartId,
            questionId
          };
        }
        
        // Add question to cart
        await executeQuery(
          'INSERT INTO cart_items (cart_id, question_id) VALUES ($1, $2)',
          [cartId, questionId]
        );
        
        console.log('Question added to cart successfully');
        return {
          success: true,
          message: 'Question added to cart',
          cartId,
          questionId
        };
      } else {
        // SQLite implementation
        const db = new Database(dbPath, { readonly: false });
        
        try {
          let userId = null;
          
          // If token is present, extract user ID from it
          if (token) {
            const { jwtVerify } = await import('jose');
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_for_development');
            
            try {
              const { payload } = await jwtVerify(token, secret);
              userId = payload.id as number;
              console.log('User ID extracted from token:', userId);
            } catch (tokenError) {
              console.error('Error verifying token:', tokenError);
              // Don't throw, we'll create a test user instead
            }
          }
          
          // If no valid user ID from token, create or get a test user
          if (!userId) {
            console.log('No valid user ID, creating or getting test user');
            
            // Check if any users exist
            const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
            
            if (userCount.count === 0) {
              console.log('No users found, creating a test user');
              
              // Create a test user
              const result = db.prepare(`
                INSERT INTO users (username, email, role, is_active)
                VALUES (?, ?, ?, ?)
              `).run('test_user', 'test@example.com', 'user', 1);
              
              userId = result.lastInsertRowid as number;
              console.log('Created test user with ID:', userId);
            } else {
              // Get the first user
              const user = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: number };
              userId = user.id;
              console.log('Using existing user with ID:', userId);
            }
          }
          
          // Begin transaction
          db.prepare('BEGIN TRANSACTION').run();
          
          // Check if cart exists for this test ID
          const existingCart = db.prepare(`
            SELECT id FROM carts 
            WHERE test_id = ? AND user_id = ?
          `).get(testId, userId);
          
          let cartId;
          
          if (existingCart) {
            // Use existing cart
            cartId = (existingCart as { id: number }).id;
          } else {
            // Create new cart
            const insertCartResult = db.prepare(`
              INSERT INTO carts (test_id, user_id, created_at)
              VALUES (?, ?, datetime('now'))
            `).run(testId, userId);
            
            cartId = insertCartResult.lastInsertRowid;
          }
          
          // Check if question is already in cart
          const existingItem = db.prepare(`
            SELECT id FROM cart_items 
            WHERE cart_id = ? AND question_id = ?
          `).get(cartId, questionId);
          
          if (!existingItem) {
            // Add question to cart
            db.prepare(`
              INSERT INTO cart_items (cart_id, question_id, created_at)
              VALUES (?, ?, datetime('now'))
            `).run(cartId, questionId);
          }
          
          // Commit transaction
          db.prepare('COMMIT').run();
          
          return {
            success: true,
            message: existingItem ? 'Question is already in cart' : 'Question added to cart',
            cartId,
            questionId
          };
        } catch (dbError) {
          // Rollback transaction on error
          try {
            db.prepare('ROLLBACK').run();
          } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
          }
          
          throw dbError;
        } finally {
          // Close database connection
          if (db) {
            db.close();
          }
        }
      }
    } catch (error) {
      console.error('Database operation error:', error);
      throw new Error(`Failed to add question to cart: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('Error in addQuestionToCart:', error);
    throw error;
  }
}

export async function exportTest(testId: string) {
  if (!testId) {
    throw new Error('Test ID is required');
  }

  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ testId }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to export test');
  }

  return response.blob();
}

export async function getCartItems(testId: string, token?: string) {
  console.log('server-actions.getCartItems called with testId:', testId);
  if (!testId || testId === 'undefined') {
    console.error('Invalid or missing testId:', testId);
    return { questions: [], count: 0 };
  }

  try {
    const baseUrl = await getBaseUrl();
    const headersList = headers();
    const authToken = (await headersList).get('authorization') || '';
    const response = await fetch(`${baseUrl}/api/cart?testId=${testId}`, {
      cache: 'no-store',
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch cart items');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { questions: [], count: 0 };
  }
}
