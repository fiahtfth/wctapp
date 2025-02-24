import { getTestId } from './actions';
import { 
  addQuestionToCart as serverAddToCart, 
  getCartItems as serverGetCartItems,
  removeFromCart as serverRemoveFromCart 
} from './server-actions';
import { useCartStore } from '@/store/cartStore';

export async function addToCart(question: any) {
  console.log('addToCart called with question:', question);
  const testId = getTestId();
  console.log('Using testId:', testId);

  if (!testId) {
    console.error('No test ID available');
    throw new Error('No test ID available');
  }

  try {
    console.log('Calling serverAddToCart with:', { questionId: question.id, testId });
    const result = await serverAddToCart(question.id, testId);
    console.log('serverAddToCart result:', result);

    if (result.success) {
      console.log('Adding question to local store:', question);
      useCartStore.getState().addQuestion(question);
    }
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
    console.log('Fetching cart items with testId:', currentTestId); // Debug log
    const result = await serverGetCartItems(currentTestId);
    console.log('Server response:', result); // Debug log
    
    // Update local cart store
    const cartStore = useCartStore.getState();
    cartStore.clearCart();
    if (result && result.questions) {
      result.questions.forEach((question: any) => cartStore.addQuestion(question));
    }
    return result;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { questions: [], count: 0 };
  }
}
