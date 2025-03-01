'use client';

/**
 * Utility functions for database setup and diagnostics
 */

/**
 * Checks if the database tables exist
 * @returns Promise with the status of required tables
 */
export async function checkDatabaseTables() {
  try {
    const response = await fetch('/api/database/diagnostics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'checkTables' })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sets up the database tables
 * @returns Promise with the result of the setup operation
 */
export async function setupDatabase() {
  try {
    const response = await fetch('/api/database/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error setting up database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if the database connection is working
 * @returns Promise with the connection status
 */
export async function checkDatabaseConnection() {
  try {
    const response = await fetch('/api/database/diagnostics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'checkConnection' })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error checking database connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if a draft cart can be loaded
 * @param testId The ID of the test to check
 * @returns Promise with the result of the check
 */
export async function checkDraftCartLoading(testId: string) {
  try {
    // First check if the tables exist
    const tablesResult = await checkDatabaseTables();
    
    if (!tablesResult.success) {
      return {
        success: false,
        error: 'Failed to check database tables',
        details: tablesResult.error
      };
    }
    
    // Check if the carts table exists
    const cartsTable = tablesResult.tables?.find((t: any) => t.name === 'carts');
    if (!cartsTable?.exists) {
      return {
        success: false,
        error: 'The carts table does not exist',
        needsSetup: true
      };
    }
    
    // Check if the cart_items table exists
    const cartItemsTable = tablesResult.tables?.find((t: any) => t.name === 'cart_items');
    if (!cartItemsTable?.exists) {
      return {
        success: false,
        error: 'The cart_items table does not exist',
        needsSetup: true
      };
    }
    
    // Try to fetch the cart
    const response = await fetch(`/api/cart/items?testId=${encodeURIComponent(testId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    return {
      success: true,
      cartExists: result.questions && result.questions.length > 0,
      questionCount: result.questions?.length || 0
    };
  } catch (error) {
    console.error('Error checking draft cart loading:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 