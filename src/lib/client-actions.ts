import { getTestId } from './actions';
import { 
  addQuestionToCart as serverAddToCart, 
  getCartItems as serverGetCartItems,
  removeFromCart as serverRemoveFromCart 
} from './server-actions';
import { useCartStore } from '@/store/cartStore';

export async function addToCart(question: any) {
  console.log('Adding question to cart:', question);
  
  try {
    // Get test ID
    const testId = getTestId();
    if (!testId) {
      console.error('No test ID available');
      throw new Error('No test ID available');
    }
    
    // Get token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token available');
      // Redirect to login
      alert('You need to log in to add items to your cart.');
      window.location.href = '/login';
      return { success: false, error: 'Authentication required' };
    }
    
    // Call server action
    console.log('Calling serverAddToCart with:', { questionId: question.id, testId });
    try {
      const result = await serverAddToCart(question.id, testId, token);
      
      // Update local store on success
      if (result && result.success) {
        console.log('Adding question to local store:', question);
        useCartStore.getState().addQuestion(question);
      }
      
      return result;
    } catch (serverError) {
      console.error('Server error:', serverError);
      
      // Handle authentication errors
      if (serverError instanceof Error && 
          (serverError.message.includes('User with ID') || 
           serverError.message.includes('session has expired') ||
           serverError.message.includes('Invalid token') ||
           serverError.message.includes('401') ||
           serverError.message.includes('authentication'))) {
        
        // Clear token and redirect to login
        localStorage.removeItem('token');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return { success: false, error: 'Session expired' };
      }
      
      // For database errors, try to add to local store anyway
      if (serverError instanceof Error && 
          (serverError.message.includes('Database error') ||
           serverError.message.includes('FOREIGN KEY constraint'))) {
        
        console.log('Database error, but adding to local store anyway:', question);
        useCartStore.getState().addQuestion(question);
        return { success: true, error: 'Added to local cart only' };
      }
      
      // For other errors, show a generic message
      alert('Failed to add item to cart. Please try again later.');
      return { success: false, error: serverError instanceof Error ? serverError.message : String(serverError) };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    
    // For all other errors, show a generic message
    alert('Failed to add item to cart. Please try again later.');
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function addToCartNew(questionId: number, testId: string) {
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

export async function addToCartWithLogging(questionId: number, testId: string) {
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

export async function addToCartWithTokenLogging(questionId: number, testId: string) {
  const token = localStorage.getItem('token');
  console.log('Token being used for addToCart:', token);
  console.log('Token value:', token);

  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    console.log('Calling serverAddToCart with:', { questionId, testId });
    console.log('Server call details:', { url: 'serverAddToCart', method: 'POST', data: { questionId, testId, token } });
    const result = await serverAddToCart(questionId, testId, token);
    console.log('serverAddToCart result:', result);
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

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
