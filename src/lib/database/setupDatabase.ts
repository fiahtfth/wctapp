import { AppError } from '@/lib/errorHandler';

/**
 * Ensures that all required database tables exist
 * This function should be called during application initialization
 */
export async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // We'll use a server-side API route to execute the SQL
    // This avoids the client-side limitations with Supabase
    const response = await fetch('/api/database/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setup: true
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error setting up database:', errorData);
      return false;
    }
    
    const result = await response.json();
    console.log('Database setup completed successfully:', result);
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    // Don't throw the error, just log it - we don't want to crash the app
    return false;
  }
} 