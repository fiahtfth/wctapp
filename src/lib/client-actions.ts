import { 
  addQuestionToCart as serverAddToCart, 
  getCartItems as serverGetCartItems,
  removeFromCart as serverRemoveFromCart 
} from './server-actions';
import { useCartStore } from '@/store/cartStore';
import { v4 as uuidv4 } from 'uuid';
import { getTestId } from './actions';
import { z } from 'zod';

// Helper functions
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export async function addToCart(questionId: number, testId: string) {
  const token = localStorage.getItem('token');
  console.log('Token being used for addToCart:', token);

  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    console.log('Calling serverAddToCart with:', { questionId, testId });
    const result = await serverAddToCart(questionId, testId);
    console.log('serverAddToCart result:', result);
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function addQuestionToTest(questionId: number, testId?: string) {
  try {
    // Get the stored testId or use the provided one
    const storedTestId = localStorage.getItem('testId');
    const currentTestId = testId || storedTestId || getTestId();
    
    // Store the testId in localStorage for future use
    localStorage.setItem('testId', currentTestId);
    
    console.log('Adding to cart:', { questionId, testId: currentTestId });
    
    // Get token from localStorage
    const token = getToken();
    
    // Even if no token, we'll try to add to cart (server will create a test user)
    if (!token) {
      console.log('No authentication token found, will use test user');
    }
    
    // Always use direct API call instead of server action
    console.log('Using direct API call for cart operation');
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/cart/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ questionId, testId: currentTestId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error adding question to cart:', response.status, errorData);
      
      // Handle specific error codes
      if (response.status === 401) {
        // Clear the token if it's expired or invalid
        localStorage.removeItem('token');
        
        if (errorData.code === 'AUTH_REQUIRED' || errorData.details?.includes('exp')) {
          // Redirect to login page if token is expired
          if (typeof window !== 'undefined') {
            // Store the current page URL to redirect back after login
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            // Redirect to login page
            window.location.href = '/login?expired=true';
          }
          throw new Error('Your session has expired. Please sign in again to continue.');
        } else if (errorData.code === 'AUTH_ERROR') {
          throw new Error('Authentication error: Please sign out and sign in again');
        } else {
          throw new Error('Authentication error: ' + (errorData.details || errorData.error || 'Please sign in again'));
        }
      } else if (response.status === 500) {
        // Handle database-related errors
        if (errorData.error && errorData.error.includes('Database')) {
          console.error('Database error details:', errorData);
          
          // Retry the operation once after a short delay
          console.log('Retrying operation after database error...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await fetch(`${baseUrl}/api/cart/question`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionId, testId: currentTestId }),
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log('Retry successful:', retryResult);
            return retryResult;
          } else {
            throw new Error('Database error: Please try again later');
          }
        }
      }
      
      throw new Error(`Failed to add question to cart: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API call result:', result);
    
    // Check if we're in Vercel simplified mode
    if (result.vercelMode) {
      console.log('Received response from Vercel simplified mode');
      
      // Update cart store with the question details
      const cartStore = useCartStore.getState();
      
      // Fetch the question details
      const questionDetails = await getQuestionById(questionId);
      
      if (questionDetails) {
        cartStore.addQuestion(questionDetails);
        console.log('Added question to cart store:', questionDetails);
      } else {
        // If we can't get the question details, create a minimal question object
        console.log('Could not fetch question details, creating minimal question object');
        cartStore.addQuestion({
          id: questionId,
          Question: `Question #${questionId}`,
          Answer: 'Not available',
          Subject: 'Unknown',
          Topic: 'Unknown',
          FacultyApproved: false,
          QuestionType: 'Objective',
          'Difficulty Level': 'Medium',
          Question_Type: 'MCQ'
        });
      }
      
      return result;
    }
    
    // Standard flow for non-Vercel environments
    // Update cart store
    const cartStore = useCartStore.getState();
    
    // Fetch the question details
    const questionDetails = await getQuestionById(questionId);
    
    if (questionDetails) {
      cartStore.addQuestion(questionDetails);
    } else {
      console.warn('Question details not found for ID:', questionId);
    }
    
    return result;
  } catch (error) {
    console.error('Error adding question to test:', error);
    throw error;
  }
}

export const removeQuestionFromTest = async ({ questionId, testId }: { questionId: number, testId: string }) => {
  try {
    console.log('Removing from cart:', { questionId, testId });
    
    const response = await fetch('/api/cart/question', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        questionId, 
        testId 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove question from test');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in removeQuestionFromTest:', error);
    throw error;
  }
};

// Type conversion function to ensure string type
function ensureStringType(value: string | number): string {
  return typeof value === 'number' ? value.toString() : value;
}

export async function removeFromCart(strQuestionId: string, strTestId: string) {
  try {
    // Validate inputs
    const questionIdSchema = z.string().refine(val => !isNaN(Number(val)), 'Question ID must be a valid number');
    // Remove the refinement for testId since it can be a UUID or other string format
    const testIdSchema = z.string();

    questionIdSchema.parse(strQuestionId);
    testIdSchema.parse(strTestId);

    // Convert IDs to correct types
    const questionId = parseInt(strQuestionId, 10);
    const testId = strTestId;

    // Call server action with validated inputs
    const result = await serverRemoveFromCart(questionId, testId);
    if (result.success) {
      // Remove from local cart store
      useCartStore.getState().removeQuestion(strQuestionId);
    }
    return result;
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  }
}

export async function getCartQuestions(testId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const token = getToken();
  
  try {
    console.log('Fetching cart questions for test:', testId);
    
    const response = await fetch(`${baseUrl}/api/cart?testId=${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error fetching cart questions:', response.status, errorData);
      throw new Error(`Failed to fetch cart questions: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cart questions result:', result);
    
    // Check if we're in Vercel simplified mode
    if (result.vercelMode) {
      console.log('Received response from Vercel simplified mode');
      
      // Use the cart store to get the questions instead
      const cartStore = useCartStore.getState();
      const questions = cartStore.questions;
      
      console.log('Using questions from cart store:', questions);
      return questions;
    }
    
    return result.questions || [];
  } catch (error) {
    console.error('Error fetching cart questions:', error);
    throw error;
  }
}

export async function fetchCartItems(testId?: string) {
  console.log('client-actions.fetchCartItems called with testId:', testId);
  
  // Get the stored testId or use the provided one
  const storedTestId = localStorage.getItem('testId');
  const currentTestId = testId || storedTestId || getTestId();
  
  console.log('Using currentTestId for fetchCartItems:', currentTestId);
  
  if (!currentTestId || currentTestId === 'undefined') {
    console.error('Invalid or missing currentTestId:', currentTestId);
    return { questions: [], count: 0 };
  }
  
  try {
    console.log('Fetching cart items with testId:', currentTestId);
    
    // Store the test ID in localStorage to ensure consistency
    if (typeof window !== 'undefined' && currentTestId) {
      localStorage.setItem('testId', currentTestId);
    }
    
    const baseUrl = getBaseUrl();
    const token = getToken();
    
    const response = await fetch(`${baseUrl}/api/cart?testId=${currentTestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Error fetching cart items:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return { questions: [], count: 0 };
    }
    
    const data = await response.json();
    console.log('Server response for cart items:', data);
    
    // Get the current cart from the store
    const cartStore = useCartStore.getState();
    console.log('Current client-side cart questions:', cartStore.questions);
    
    // If the server returns questions, update the cart store
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      // Clear the cart first
      cartStore.clearCart();
      
      // Add each question to the cart store
      data.questions.forEach((question: any) => {
        cartStore.addQuestion(question);
      });
      console.log('Updated cart store with server questions');
    } else if (data.questions && Array.isArray(data.questions) && data.questions.length === 0) {
      // If the server returns an empty array, check if we have local cart items
      if (cartStore.questions.length > 0) {
        console.log('Server returned empty cart but we have local items. Keeping local items.');
        // We'll keep the local cart items
      } else {
        // If we don't have local items either, clear the cart
        cartStore.clearCart();
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { questions: [], count: 0 };
  }
}

// Helper function to get a question by ID
export async function getQuestionById(questionId: number) {
  const baseUrl = getBaseUrl(); // Use the current window location instead of env variable
  const token = getToken();
  
  try {
    console.log('Fetching question details for ID:', questionId);
    
    const response = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If we can't get the question details, don't throw an error
      // Just return null and let the caller handle it
      console.error('Error fetching question details:', response.status);
      return null;
    }
    
    const result = await response.json();
    return result.question;
  } catch (error) {
    console.error('Error fetching question details:', error);
    return null;
  }
}

// Add saveDraftCart function
export async function saveDraftCart(
  userId: number | string, 
  testName: string, 
  batch: string, 
  date: string, 
  questionIds: number[],
  existingTestId?: string
) {
  try {
    console.log('Saving draft cart:', { userId, testName, batch, date, questionIds, existingTestId });
    
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/cart/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId, 
        testName, 
        batch, 
        date, 
        questionIds,
        existingTestId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save draft cart');
    }
    
    const result = await response.json();
    return result.testId;
  } catch (error) {
    console.error('Error saving draft cart:', error);
    throw error;
  }
}
