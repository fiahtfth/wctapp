import { 
  addQuestionToCart as serverAddQuestionToCart, 
  getCartItems as serverGetCartItems,
  removeFromCart as serverRemoveFromCart 
} from './server-actions';
import { useCartStore } from '@/store/cartStore';
import { v4 as uuidv4 } from 'uuid';
import { getTestId } from './actions';
import { z } from 'zod';
import { Question, CartQuestion, toCartQuestion } from '@/types/question';
import { getSupabaseBrowserClient } from '@/lib/database/supabaseClient';
import getSupabaseClient from '@/lib/database/supabaseClient';
import { Database } from '@/types/supabase';

// Helper functions
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// Flexible function to get difficulty level
function getDifficultyLevel(question: Question | CartQuestion): string {
  // Safe access with fallback
  return question.difficulty || 'Medium';
}

// Flexible function to get question type
function getQuestionType(question: Question | CartQuestion): string {
  // Safe access with fallback
  return (question as any).type || 'Multiple Choice';
}

export async function removeQuestionFromCart(
  questionOrCartItemId: number | string, 
  testId?: string
): Promise<{ 
  message: string; 
  success: boolean 
}> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // If Supabase client is not available, try to remove from local storage
      try {
        const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        const updatedItems = cartItems.filter((id: string | number) => 
          String(id) !== String(questionOrCartItemId)
        );
        localStorage.setItem('localCart', JSON.stringify(updatedItems));
        
        // Also remove from Zustand store
        const { removeQuestion } = useCartStore.getState();
        removeQuestion(questionOrCartItemId);
        
        return { success: true, message: 'Question removed from local cart successfully' };
      } catch (localError) {
        console.error('Failed to remove from local cart:', localError);
        return { success: false, message: 'Failed to initialize Supabase client and local storage failed' };
      }
    }

    // Validate inputs
    if (!questionOrCartItemId) {
      return { success: false, message: 'Question ID is required' };
    }

    // Check if user is authenticated
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      // User is not authenticated, remove from local storage only
      console.log('User not authenticated, removing from local storage only');
      
      // Remove the question ID from local storage
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      const updatedItems = cartItems.filter((id: string | number) => 
        String(id) !== String(questionOrCartItemId)
      );
      localStorage.setItem('localCart', JSON.stringify(updatedItems));
      
      // Also remove from Zustand store
      const { removeQuestion } = useCartStore.getState();
      removeQuestion(questionOrCartItemId);
      
      return { 
        success: true, 
        message: 'Question removed from local cart successfully' 
      };
    }

    if (!testId) {
      // Try to get the test ID
      try {
        testId = await getTestId();
      } catch (error) {
        console.error('Error getting test ID:', error);
        
        // Fall back to local storage removal
        const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        const updatedItems = cartItems.filter((id: string | number) => 
          String(id) !== String(questionOrCartItemId)
        );
        localStorage.setItem('localCart', JSON.stringify(updatedItems));
        
        // Also remove from Zustand store
        const { removeQuestion } = useCartStore.getState();
        removeQuestion(questionOrCartItemId);
        
        return { 
          success: true, 
          message: 'Question removed from local cart successfully, but failed to get test ID' 
        };
      }
    }

    // First try to find the cart for this test
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .maybeSingle();

    if (cartError || !cart) {
      console.error('Error finding cart:', cartError);
      
      // Fall back to local storage removal
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      const updatedItems = cartItems.filter((id: string | number) => 
        String(id) !== String(questionOrCartItemId)
      );
      localStorage.setItem('localCart', JSON.stringify(updatedItems));
      
      // Also remove from Zustand store
      const { removeQuestion } = useCartStore.getState();
      removeQuestion(questionOrCartItemId);
      
      return { 
        success: true, 
        message: 'Question removed from local cart successfully, but cart not found in database' 
      };
    }

    // Now delete the cart item
    const numericId = typeof questionOrCartItemId === 'string' 
      ? Number(questionOrCartItemId) 
      : questionOrCartItemId;
    
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('question_id', numericId);
    
    if (deleteError) {
      console.error('Error removing question from cart:', deleteError);
      
      // Fall back to local storage removal
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      const updatedItems = cartItems.filter((id: string | number) => 
        String(id) !== String(questionOrCartItemId)
      );
      localStorage.setItem('localCart', JSON.stringify(updatedItems));
      
      // Also remove from Zustand store
      const { removeQuestion } = useCartStore.getState();
      removeQuestion(questionOrCartItemId);
      
      return { 
        success: true, 
        message: 'Question removed from local cart successfully, but failed to remove from database' 
      };
    }
    
    // Also remove from Zustand store to keep everything in sync
    const { removeQuestion } = useCartStore.getState();
    removeQuestion(questionOrCartItemId);
    
    return { success: true, message: 'Question removed from cart successfully' };
  } catch (error) {
    console.error('Error removing question from cart:', error);
    
    // If there's an error, try to remove from local storage as a fallback
    try {
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      const updatedItems = cartItems.filter((id: string | number) => 
        String(id) !== String(questionOrCartItemId)
      );
      localStorage.setItem('localCart', JSON.stringify(updatedItems));
      
      // Also remove from Zustand store
      const { removeQuestion } = useCartStore.getState();
      removeQuestion(questionOrCartItemId);
      
      return { 
        success: true, 
        message: 'Question removed from local cart successfully' 
      };
    } catch (localStorageError) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error removing question from cart'
      };
    }
  }
}

export async function removeQuestionFromTest({ questionId, testId }: { questionId: number, testId: string }) {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    
    // If user is not authenticated, return error
    if (!session) {
      throw new Error('Authentication required');
    }

    // First, find the test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('test_id', testId)
      .maybeSingle();

    if (testError || !test) {
      console.error('Error finding test:', testError);
      throw new Error('Test not found');
    }

    // Delete the question from the test
    const { error: deleteError } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', test.id)
      .eq('question_id', questionId);
    
    if (deleteError) {
      console.error('Error removing question from test:', deleteError);
      throw new Error('Failed to remove question from test');
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing question from test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function fetchCartItems(testId?: string) {
  try {
    // Validate inputs
    if (!testId) {
      console.warn('No test ID provided to fetchCartItems');
      return [];
    }

    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      // Try to get items from local storage as fallback
      try {
        const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        const cartStore = useCartStore.getState();
        return cartStore.questions;
      } catch (localError) {
        console.error('Error getting items from local storage:', localError);
        return [];
      }
    }

    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    
    // If user is not authenticated, try to get items from local storage
    if (!session) {
      console.log('User not authenticated, fetching from local storage only');
      
      // First, check if we have saved question IDs for this specific draft
      const draftQuestionIds = JSON.parse(localStorage.getItem(`draft-${testId}-questions`) || '[]');
      
      // If we have saved question IDs for this draft, use them
      if (draftQuestionIds && draftQuestionIds.length > 0) {
        console.log(`Found ${draftQuestionIds.length} saved question IDs for draft ${testId}`);
        
        // Get items from Zustand store
        const cartStore = useCartStore.getState();
        
        // Check if we already have these questions in the store
        const existingQuestions = cartStore.questions.filter(q => 
          draftQuestionIds.includes(q.id) || 
          draftQuestionIds.includes(String(q.id))
        );
        
        if (existingQuestions.length > 0) {
          console.log(`Found ${existingQuestions.length} existing questions in store`);
          return existingQuestions;
        }
        
        // If we don't have the questions in the store, create placeholders
        const placeholderQuestions = draftQuestionIds.map((id: number | string) => ({
          id: typeof id === 'string' ? parseInt(id, 10) : id,
          text: `Question ${id}`,
          answer: '',
          subject: '',
          topic: '',
          questionType: 'Objective' as 'Objective' | 'Subjective',
          difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
          module: '',
          sub_topic: '',
          marks: 0,
          tags: [],
          Question: `Question ${id}`,
          Subject: '',
          Topic: '',
          FacultyApproved: false,
          QuestionType: 'Objective' as 'Objective' | 'Subjective'
        }));
        
        // Add the placeholder questions to the store
        placeholderQuestions.forEach((q: CartQuestion) => {
          cartStore.addQuestion(q);
        });
        
        return placeholderQuestions;
      }
      
      // If we don't have saved question IDs for this draft, try to get them from the database
      // without requiring authentication
      try {
        console.log('Attempting to fetch question IDs for draft without authentication');
        
        // Try to get the cart ID for this test
        const { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('test_id', testId)
          .maybeSingle();
        
        if (cart) {
          // Get the question IDs from the cart items
          const { data: cartItems } = await supabase
            .from('cart_items')
            .select('question_id')
            .eq('cart_id', cart.id);
          
          if (cartItems && cartItems.length > 0) {
            // Extract the question IDs
            const questionIds = cartItems.map(item => item.question_id);
            console.log(`Found ${questionIds.length} question IDs in database for draft ${testId}`);
            
            // Save these IDs for future use
            localStorage.setItem(`draft-${testId}-questions`, JSON.stringify(questionIds));
            
            // Also add to general local cart
            const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
            // Use Array.from to convert Set to array to avoid iteration issues
            const updatedLocalCart = Array.from(new Set([...localCartItems, ...questionIds]));
            localStorage.setItem('localCart', JSON.stringify(updatedLocalCart));
            
            // Create placeholder questions
            const placeholderQuestions = questionIds.map((id: number | string) => ({
              id: typeof id === 'string' ? parseInt(id, 10) : id,
              text: `Question ${id}`,
              answer: '',
              subject: '',
              topic: '',
              questionType: 'Objective' as 'Objective' | 'Subjective',
              difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
              module: '',
              sub_topic: '',
              marks: 0,
              tags: [],
              Question: `Question ${id}`,
              Subject: '',
              Topic: '',
              FacultyApproved: false,
              QuestionType: 'Objective' as 'Objective' | 'Subjective'
            }));
            
            // Add the placeholder questions to the store
            const cartStore = useCartStore.getState();
            placeholderQuestions.forEach((q: CartQuestion) => {
              cartStore.addQuestion(q);
            });
            
            return placeholderQuestions;
          }
        }
      } catch (dbError) {
        console.error('Error fetching question IDs from database:', dbError);
      }
      
      // If all else fails, get items from general local cart
      const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      
      // Get items from Zustand store
      const cartStore = useCartStore.getState();
      
      // Return the items from the store
      return cartStore.questions;
    }

    console.log('Fetching cart items for test ID:', testId);

    // First, find the cart for this test
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .maybeSingle();

    if (cartError) {
      console.error('Error finding cart:', cartError);
      return [];
    }

    if (!cart) {
      console.log('No cart found for test ID:', testId);
      return [];
    }

    console.log('Found cart with ID:', cart.id);

    // Get cart items with question data
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        question_id,
        questions:question_id (*)
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      console.log('No cart items found for cart ID:', cart.id);
      return [];
    }

    console.log('Found cart items:', cartItems.length);
    
    // Save the question IDs for future use
    const questionIds = cartItems.map(item => item.question_id);
    localStorage.setItem(`draft-${testId}-questions`, JSON.stringify(questionIds));

    // Transform the data to match CartQuestion format
    const questions = cartItems.map(item => {
      const question = item.questions as Record<string, any>;
      if (!question) return null;

      return {
        id: question.id,
        cartItemId: item.id,
        Question: question.text || question.Question || '',
        Subject: question.subject || question.Subject || '',
        Topic: question.topic || question.Topic || '',
        QuestionType: question.questionType || question.QuestionType || 'Objective',
        FacultyApproved: question.FacultyApproved || false,
        text: question.text || question.Question || '',
        subject: question.subject || question.Subject || '',
        topic: question.topic || question.Topic || '',
        answer: question.answer || question.Answer || '',
        questionType: question.questionType || question.QuestionType || 'Objective',
        difficulty: question.difficulty || question.Difficulty || 'Medium',
        module: question.module || question.Module || '',
        sub_topic: question.sub_topic || question.SubTopic || '',
        marks: question.marks || question.Marks || 0,
        tags: question.tags || []
      };
    }).filter(Boolean) as CartQuestion[];

    console.log('Transformed questions:', questions.length);

    // Add the questions to the Zustand store
    const { clearCart, addQuestion } = useCartStore.getState();
    
    // Clear the cart first
    clearCart();
    
    // Add each question to the store
    questions.forEach(question => {
      if (question) {
        addQuestion(question);
      }
    });

    return questions;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    // Try to get items from local storage as fallback
    try {
      // First, check if we have saved question IDs for this specific draft
      const draftQuestionIds = JSON.parse(localStorage.getItem(`draft-${testId}-questions`) || '[]');
      
      // If we have saved question IDs for this draft, use them
      if (draftQuestionIds && draftQuestionIds.length > 0) {
        console.log(`Found ${draftQuestionIds.length} saved question IDs for draft ${testId}`);
        
        // Get items from Zustand store
        const cartStore = useCartStore.getState();
        
        // Check if we already have these questions in the store
        const existingQuestions = cartStore.questions.filter(q => 
          draftQuestionIds.includes(q.id) || 
          draftQuestionIds.includes(String(q.id))
        );
        
        if (existingQuestions.length > 0) {
          console.log(`Found ${existingQuestions.length} existing questions in store`);
          return existingQuestions;
        }
        
        // If we don't have the questions in the store, create placeholders
        const placeholderQuestions = draftQuestionIds.map((id: number | string) => ({
          id: typeof id === 'string' ? parseInt(id, 10) : id,
          text: `Question ${id}`,
          answer: '',
          subject: '',
          topic: '',
          questionType: 'Objective' as 'Objective' | 'Subjective',
          difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
          module: '',
          sub_topic: '',
          marks: 0,
          tags: [],
          Question: `Question ${id}`,
          Subject: '',
          Topic: '',
          FacultyApproved: false,
          QuestionType: 'Objective' as 'Objective' | 'Subjective'
        }));
        
        // Add the placeholder questions to the store
        placeholderQuestions.forEach((q: CartQuestion) => {
          cartStore.addQuestion(q);
        });
        
        return placeholderQuestions;
      }
      
      // If all else fails, get items from general local cart
      const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      const cartStore = useCartStore.getState();
      return cartStore.questions;
    } catch (localError) {
      console.error('Error getting items from local storage:', localError);
      return [];
    }
  }
}

// Type conversion function to ensure string type
function ensureStringType(value: string | number): string {
  return typeof value === 'string' ? value : value.toString();
}

interface CartQuestionWithId extends CartQuestion {
  cartItemId: number;
}

export async function getCartQuestions(testId: string): Promise<any[]> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return [];
    }

    // Check if user is authenticated
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.log('User not authenticated, returning empty cart');
      return [];
    }

    // First, find the cart for this test
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .maybeSingle();

    if (cartError || !cart) {
      console.error('Error finding cart:', cartError);
      return [];
    }

    // Get cart items with question data
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        question_id,
        questions:question_id (*)
      `)
      .eq('cart_id', cart.id);

    if (itemsError || !cartItems) {
      console.error('Error fetching cart items:', itemsError);
      return [];
    }

    // Transform the data to match CartQuestion format
    const questions = cartItems.map(item => {
      const question = item.questions as Record<string, any>;
      if (!question) return null;

      return {
        id: question.id,
        cartItemId: item.id,
        Question: question.text || question.Question || '',
        Subject: question.subject || question.Subject || '',
        Topic: question.topic || question.Topic || '',
        QuestionType: question.questionType || question.QuestionType || 'Objective',
        FacultyApproved: question.FacultyApproved || false,
        text: question.text || question.Question || '',
        subject: question.subject || question.Subject || '',
        topic: question.topic || question.Topic || '',
        answer: question.answer || question.Answer || '',
        questionType: question.questionType || question.QuestionType || 'Objective',
        difficulty: question.difficulty || question.Difficulty || 'Medium',
        module: question.module || question.Module || '',
        sub_topic: question.sub_topic || question.SubTopic || '',
        marks: question.marks || question.Marks || 0,
        tags: question.tags || []
      };
    }).filter(Boolean);

    return questions;
  } catch (error) {
    console.error('Error fetching cart questions:', error);
    return [];
  }
}

export async function getQuestionsFromCart(
  testId: string, 
  userId: number
): Promise<any[]> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Ensure testId is a string
    const testIdStr = ensureStringType(testId);

    // Get questions from cart
    const { data, error } = await supabase
      .from('cart_questions')
      .select(`
        id,
        question_id,
        quantity,
        questions (*)
      `)
      .eq('test_id', testIdStr);

    if (error) {
      console.error('Error fetching questions from cart:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to CartQuestion format
    return data.map(item => {
      const question = item.questions as unknown as Record<string, any>;
      // Create a CartQuestion with the additional properties
      return {
        id: question.id,
        text: question.text || '',
        answer: question.answer || '',
        subject: question.subject || '',
        topic: question.topic || '',
        questionType: question.questionType || 'Objective',
        difficulty: question.difficulty || 'Medium',
        module: question.module || '',
        sub_topic: question.sub_topic || '',
        marks: question.marks || 0,
        tags: question.tags || [],
        // CartQuestion specific fields
        Question: question.text || '',
        Subject: question.subject || '',
        Topic: question.topic || '',
        FacultyApproved: false,
        QuestionType: question.questionType || 'Objective',
        // Additional fields from cart
        cartItemId: item.id,
        quantity: item.quantity || 1
      };
    });
  } catch (error) {
    console.error('Error fetching questions from cart:', error);
    return [];
  }
}

export async function addQuestionToCart(
  questionId: number | string, 
  testId?: string
): Promise<{ 
  message: string; 
  cartItemId?: number; 
  success: boolean;
}> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // If Supabase client is not available, try to add to local storage
      try {
        const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        if (!cartItems.includes(questionId)) {
          cartItems.push(questionId);
          localStorage.setItem('localCart', JSON.stringify(cartItems));
        }
        
        // Also add to Zustand store if we have the question data
        // We can't fetch question data without supabase, so skip this part
        
        return { success: true, message: 'Question added to local cart successfully' };
      } catch (localError) {
        console.error('Failed to add to local cart:', localError);
        return { success: false, message: 'Failed to initialize Supabase client and local storage failed' };
      }
    }

    // Validate inputs
    if (!questionId) {
      return { success: false, message: 'Question ID is required' };
    }

    // If no testId provided, try to get one
    if (!testId) {
      try {
        testId = await getTestId();
      } catch (error) {
        console.error('Error getting test ID:', error);
        
        // Fall back to local storage
        const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        if (!cartItems.includes(questionId)) {
          cartItems.push(questionId);
          localStorage.setItem('localCart', JSON.stringify(cartItems));
        }
        
        // Try to add to Zustand store if we have the question data
        try {
          const { data: questionData } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();
            
          if (questionData) {
            const { addQuestion } = useCartStore.getState();
            addQuestion(questionData);
          }
        } catch (questionError) {
          console.warn('Could not fetch question data for Zustand store:', questionError);
        }
        
        return { 
          success: true, 
          message: 'Question added to local cart successfully, but failed to get test ID' 
        };
      }
    }

    // Check if user is authenticated
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      // User is not authenticated, store in local storage only
      console.log('User not authenticated, storing in local storage only');
      
      // Store the question ID in local storage
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      if (!cartItems.includes(questionId)) {
        cartItems.push(questionId);
        localStorage.setItem('localCart', JSON.stringify(cartItems));
      }
      
      // Try to add to Zustand store if we have the question data
      try {
        const { data: questionData } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();
          
        if (questionData) {
          const { addQuestion } = useCartStore.getState();
          addQuestion(questionData);
        }
      } catch (questionError) {
        console.warn('Could not fetch question data for Zustand store:', questionError);
      }
      
      return { 
        success: true, 
        message: 'Question added to local cart successfully'
      };
    }

    // First, find the cart for this test
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .maybeSingle();

    let cartId: number;
    
    if (cartError || !cart) {
      // Create a new cart
      const { data: newCart, error: createCartError } = await supabase
        .from('carts')
        .insert({
          test_id: testId,
          is_draft: true
        })
        .select('id')
        .single();
      
      if (createCartError || !newCart) {
        console.error('Error creating cart:', createCartError);
        
        // Fall back to local storage
        const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        if (!cartItems.includes(questionId)) {
          cartItems.push(questionId);
          localStorage.setItem('localCart', JSON.stringify(cartItems));
        }
        
        // Try to add to Zustand store if we have the question data
        try {
          const { data: questionData } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();
            
          if (questionData) {
            const { addQuestion } = useCartStore.getState();
            addQuestion(questionData);
          }
        } catch (questionError) {
          console.warn('Could not fetch question data for Zustand store:', questionError);
        }
        
        return { 
          success: true, 
          message: 'Question added to local cart successfully, but failed to create cart in database' 
        };
      }
      
      cartId = newCart.id;
    } else {
      cartId = cart.id;
    }

    // Check if question is already in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cartId)
      .eq('question_id', typeof questionId === 'string' ? parseInt(questionId, 10) : questionId)
      .single();

    if (!checkError && existingItem) {
      // Question is already in the database cart, make sure it's also in Zustand store
      try {
        const { data: questionData } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();
          
        if (questionData) {
          const { addQuestion } = useCartStore.getState();
          addQuestion(questionData);
        }
      } catch (questionError) {
        console.warn('Could not fetch question data for Zustand store:', questionError);
      }
      
      return { 
        success: true, 
        message: 'Question already in cart',
        cartItemId: existingItem.id
      };
    }

    // Add question to cart
    const { data: newItem, error: addError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        question_id: typeof questionId === 'string' ? parseInt(questionId, 10) : questionId
      })
      .select('id')
      .single();

    if (addError || !newItem) {
      console.error('Error adding question to cart:', addError);
      
      // Fall back to local storage
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      if (!cartItems.includes(questionId)) {
        cartItems.push(questionId);
        localStorage.setItem('localCart', JSON.stringify(cartItems));
      }
      
      // Try to add to Zustand store if we have the question data
      try {
        const { data: questionData } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();
          
        if (questionData) {
          const { addQuestion } = useCartStore.getState();
          addQuestion(questionData);
        }
      } catch (questionError) {
        console.warn('Could not fetch question data for Zustand store:', questionError);
      }
      
      return { 
        success: true, 
        message: 'Question added to local cart successfully, but failed to add to database' 
      };
    }

    // Successfully added to database, now make sure it's in Zustand store too
    try {
      const { data: questionData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
        
      if (questionData) {
        const { addQuestion } = useCartStore.getState();
        addQuestion(questionData);
      }
    } catch (questionError) {
      console.warn('Could not fetch question data for Zustand store:', questionError);
    }

    return { 
      success: true, 
      message: 'Question added to cart successfully',
      cartItemId: newItem.id
    };
  } catch (error) {
    console.error('Error adding question to cart:', error);
    
    // If there's an error, try to store in local storage as a fallback
    try {
      const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      if (!cartItems.includes(questionId)) {
        cartItems.push(questionId);
        localStorage.setItem('localCart', JSON.stringify(cartItems));
      }
      
      return { 
        success: true, 
        message: 'Question added to local cart successfully'
      };
    } catch (localStorageError) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error adding question to cart'
      };
    }
  }
}

export async function updateQuestionQuantity(
  cartItemId: number, 
  quantity: number
): Promise<{ 
  message: string; 
  success: boolean 
}> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Validate inputs
    if (!cartItemId) {
      return { success: false, message: 'Cart item ID is required' };
    }

    if (quantity < 1) {
      return { success: false, message: 'Quantity must be at least 1' };
    }

    // Update quantity
    const { error } = await supabase
      .from('cart_questions')
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) {
      console.error('Error updating question quantity:', error);
      return { success: false, message: 'Failed to update quantity' };
    }

    return { success: true, message: 'Quantity updated successfully' };
  } catch (error) {
    console.error('Unexpected error updating question quantity:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

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
    
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!testName) {
      throw new Error('Test name is required');
    }
    
    if (!questionIds || questionIds.length === 0) {
      throw new Error('No questions selected');
    }
    
    // Ensure all questionIds are valid numbers
    const validQuestionIds = questionIds
      .map(id => {
        // Convert to number if it's a string
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        // Check if it's a valid number
        return !isNaN(numId) ? numId : null;
      })
      .filter(id => id !== null) as number[];
    
    if (validQuestionIds.length === 0) {
      throw new Error('No valid question IDs provided');
    }

    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Generate a test ID if one doesn't exist
    const testId = existingTestId || `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save the question IDs to local storage for future use
    localStorage.setItem(`draft-${testId}-questions`, JSON.stringify(validQuestionIds));
    
    // Check if we're updating an existing cart
    if (existingTestId) {
      // Find the existing cart
      const { data: existingCart, error: findCartError } = await supabase
        .from('carts')
        .select('id')
        .eq('test_id', existingTestId)
        .maybeSingle();
      
      if (findCartError) {
        console.error('Error finding existing cart:', findCartError);
        // Continue with creating a new cart
      } else if (existingCart) {
        console.log('Updating existing cart:', existingCart.id);
        
        // Update the cart metadata
        const { error: updateCartError } = await supabase
          .from('carts')
          .update({
            metadata: {
              testName,
              batch,
              date
            }
          })
          .eq('id', existingCart.id);
        
        if (updateCartError) {
          console.error('Error updating cart metadata:', updateCartError);
        }
        
        // Delete existing cart items
        const { error: deleteItemsError } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', existingCart.id);
        
        if (deleteItemsError) {
          console.error('Error deleting existing cart items:', deleteItemsError);
        }
        
        // Add new cart items
        const cartItems = validQuestionIds.map(questionId => ({
          cart_id: existingCart.id,
          question_id: questionId
        }));
        
        const { error: insertItemsError } = await supabase
          .from('cart_items')
          .insert(cartItems);
        
        if (insertItemsError) {
          console.error('Error inserting new cart items:', insertItemsError);
        }
        
        return testId;
      }
    }
    
    // Create a new cart
    const { data: newCart, error: createCartError } = await supabase
      .from('carts')
      .insert({
        test_id: testId,
        user_id: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        is_draft: true,
        metadata: {
          testName,
          batch,
          date
        }
      })
      .select('id')
      .single();
    
    if (createCartError || !newCart) {
      console.error('Error creating cart:', createCartError);
      throw new Error('Failed to create cart');
    }
    
    // Add cart items
    const cartItems = validQuestionIds.map(questionId => ({
      cart_id: newCart.id,
      question_id: questionId
    }));
    
    const { error: insertItemsError } = await supabase
      .from('cart_items')
      .insert(cartItems);
    
    if (insertItemsError) {
      console.error('Error inserting cart items:', insertItemsError);
      
      // Clean up the cart if we failed to insert items
      await supabase
        .from('carts')
        .delete()
        .eq('id', newCart.id);
      
      throw new Error('Failed to add items to cart');
    }
    
    return testId;
  } catch (error) {
    console.error('Error saving draft cart:', error);
    throw error;
  }
}

export async function getQuestionById(questionId: number) {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    
    // If user is not authenticated, return error
    if (!session) {
      throw new Error('Authentication required');
    }

    // Fetch the question from the database
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('Error fetching question details:', error);
      throw new Error('Failed to fetch question details');
    }

    return question;
  } catch (error) {
    console.error('Error fetching question details:', error);
    return null;
  }
}

export async function clearCart() {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Get the cart ID from local storage or other source
    const testId = localStorage.getItem('currentTestId');
    if (!testId) {
      return { success: false, message: 'No active cart found' };
    }
    
    // Delete all items from the cart
    const { error } = await supabase
      .from('cart_questions')
      .delete()
      .eq('test_id', testId);
    
    if (error) {
      console.error('Error clearing cart:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
    
    return { success: true, message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('Unexpected error clearing cart:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Get cart items from local storage
 * This is used as a fallback when the user is not authenticated
 */
export async function getLocalCartItems(): Promise<any[]> {
  try {
    if (typeof window === 'undefined') return [];
    
    // Get question IDs from local storage
    const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
    
    if (!localCartItems || localCartItems.length === 0) {
      return [];
    }
    
    // For local storage, we just have IDs, so we need to fetch the questions
    // from the local cart store
    const cartStore = useCartStore.getState();
    const storeQuestions = cartStore.questions;
    
    // Filter store questions to only include those in the local cart
    const localQuestions = storeQuestions.filter(q => 
      localCartItems.includes(q.id) || 
      localCartItems.includes(String(q.id))
    );
    
    // If we have questions in the store, return them
    if (localQuestions.length > 0) {
      return localQuestions;
    }
    
    // Otherwise, create placeholder questions with just the ID
    return localCartItems.map((id: string | number) => ({
      id: typeof id === 'string' ? parseInt(id, 10) : id,
      text: `Question ${id}`,
      answer: '',
      subject: '',
      topic: '',
      questionType: 'Objective',
      difficulty: 'Medium',
      module: '',
      sub_topic: '',
      marks: 0,
      tags: [],
      Question: `Question ${id}`,
      Subject: '',
      Topic: '',
      FacultyApproved: false,
      QuestionType: 'Objective'
    }));
  } catch (error) {
    console.error('Error getting local cart items:', error);
    return [];
  }
}
