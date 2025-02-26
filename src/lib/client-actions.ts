import { getTestId } from './actions';
import { 
  addQuestionToCart as serverAddToCart, 
  getCartItems as serverGetCartItems,
  removeFromCart as serverRemoveFromCart 
} from './server-actions';
import { useCartStore } from '@/store/cartStore';

export async function addToCart(questionId: number, testId: string) {
  const token = localStorage.getItem('token');
  console.log('Token being used for addToCart:', token);

  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    console.log('Calling serverAddToCart with:', { questionId, testId });
    const result = await serverAddToCart(questionId, testId, token);
    console.log('serverAddToCart result:', result);
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export const addQuestionToTest = async ({ questionId, testId }: { questionId: number, testId?: string }) => {
  try {
    console.log('Adding to cart:', { questionId, testId });
    
    const token = localStorage.getItem('token');
    
    // If we have a token, use the server action for authenticated users
    if (token) {
      try {
        console.log('Using server action with token');
        const result = await serverAddToCart(questionId, testId, token);
        console.log('Server action result:', result);
        return result;
      } catch (tokenError) {
        console.error('Error with token-based add:', tokenError);
        // Fall through to direct API call
      }
    }
    
    // Direct API call as fallback
    console.log('Using direct API call');
    
    // Make sure we're using the correct API endpoint
    const apiUrl = '/api/cart/question';
    console.log('API URL for direct call:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ questionId, testId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Error adding question to cart:', errorData);
      throw new Error(errorData.error || `Failed to add question to cart: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error in addQuestionToTest:', error);
    throw error;
  }
};

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

export async function removeFromCart(questionId: string | number, testId: string) {
  try {
    const result = await serverRemoveFromCart(questionId, testId);
    if (result.success) {
      // Remove from local cart store
      useCartStore.getState().removeQuestion(questionId);
    }
    return result;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

export async function fetchCartItems(testId?: string) {
  console.log('client-actions.fetchCartItems called with testId:', testId);
  const currentTestId = testId || getTestId();
  console.log('Using currentTestId:', currentTestId);
  
  if (!currentTestId || currentTestId === 'undefined') {
    console.error('Invalid or missing currentTestId:', currentTestId);
    return { questions: [], count: 0 };
  }

  try {
    console.log('Fetching cart items with testId:', currentTestId);
    
    // Get token
    const token = localStorage.getItem('token');
    
    // Make direct API call instead of using serverGetCartItems
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/cart?testId=${currentTestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching cart: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Server response for cart items:', result);
    
    // Get current cart store questions
    const cartStore = useCartStore.getState();
    const currentQuestions = cartStore.questions;
    console.log('Current client-side cart questions:', currentQuestions);
    
    // If server returned empty but we have local items, keep the local items
    if (result.questions.length === 0 && currentQuestions.length > 0) {
      console.log('Server returned empty cart but we have local items. Keeping local items.');
      return { 
        questions: currentQuestions, 
        count: currentQuestions.length 
      };
    }
    
    // Otherwise update local cart store with server data
    cartStore.clearCart();
    if (result && result.questions && result.questions.length > 0) {
      console.log('Adding server questions to cart store:', result.questions);
      result.questions.forEach((question: any) => cartStore.addQuestion(question));
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    
    // On error, return the current cart store items instead of empty array
    const currentQuestions = useCartStore.getState().questions;
    console.log('Error fetching from server, using local cart items:', currentQuestions);
    
    return { 
      questions: currentQuestions, 
      count: currentQuestions.length,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
