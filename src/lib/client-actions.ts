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
      throw new Error('Failed to initialize Supabase client');
    }

    // Validate inputs
    if (!questionOrCartItemId) {
      return { success: false, message: 'Question ID is required' };
    }

    let query = supabase.from('cart_questions').delete();

    // If we have a test ID, use it in the query
    if (testId) {
      query = query.eq('test_id', testId);
    }

    // Delete by cart_item_id or question_id
    if (typeof questionOrCartItemId === 'number' || !isNaN(Number(questionOrCartItemId))) {
      // It's a numeric ID, could be either cart_item_id or question_id
      const numericId = Number(questionOrCartItemId);
      
      // Try to delete by cart_item_id first (more specific)
      const { error, count } = await query.eq('id', numericId);
      
      if (error) {
        console.error('Error removing question from cart:', error);
        return { success: false, message: 'Failed to remove question from cart' };
      }
      
      if (count === 0) {
        // If no rows affected, try by question_id
        const { error: error2, count: count2 } = await supabase
          .from('cart_questions')
          .delete()
          .eq('question_id', numericId);
        
        if (error2) {
          console.error('Error removing question from cart:', error2);
          return { success: false, message: 'Failed to remove question from cart' };
        }
        
        if (count2 === 0) {
          return { success: false, message: 'Question not found in cart' };
        }
      }
    } else {
      // It's a string ID, use it directly
      const { error } = await query.eq('id', questionOrCartItemId);
      
      if (error) {
        console.error('Error removing question from cart:', error);
        return { success: false, message: 'Failed to remove question from cart' };
      }
    }
    
    return { success: true, message: 'Question removed from cart' };
  } catch (error) {
    console.error('Unexpected error removing question from cart:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function removeQuestionFromTest({ questionId, testId }: { questionId: number, testId: string }) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${getBaseUrl()}/api/tests/${testId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove question');
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
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    let url = `${getBaseUrl()}/api/cart`;
    if (testId) {
      url += `?testId=${encodeURIComponent(testId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch cart items');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
}

// Type conversion function to ensure string type
function ensureStringType(value: string | number): string {
  return typeof value === 'string' ? value : value.toString();
}

interface CartQuestionWithId extends CartQuestion {
  cartItemId: number;
}

export async function getCartQuestions(testId: string): Promise<CartQuestion[]> {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data, error } = await supabase
      .from('cart_questions')
      .select(`
        id,
        question_id,
        test_id,
        quantity,
        questions (
          id,
          title,
          content,
          difficulty,
          type,
          options,
          correct_answer,
          explanation,
          tags,
          created_at,
          updated_at,
          subject,
          topic,
          faculty_approved
        )
      `)
      .eq('test_id', testId);

    if (error) {
      console.error('Error fetching cart questions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data to match the CartQuestion interface
    return data.map(item => {
      const question = item.questions as any;
      return {
        cartItemId: item.id,
        id: question.id,
        Question: question.content || '',
        Subject: question.subject || '',
        Topic: question.topic || '',
        QuestionType: question.type === 'Multiple Choice' ? 'Objective' : 'Subjective',
        FacultyApproved: question.faculty_approved || false,
        quantity: item.quantity || 1,
        difficulty: question.difficulty as 'Easy' | 'Medium' | 'Hard',
        tags: question.tags,
        module: question.module,
        sub_topic: question.sub_topic,
        marks: question.marks
      };
    });
  } catch (error) {
    console.error('Error fetching cart questions:', error);
    return [];
  }
}

export async function getQuestionsFromCart(
  testId: string, 
  userId: number
): Promise<CartQuestion[]> {
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
      return toCartQuestion({
        ...item.questions,
        cartItemId: item.id,
        quantity: item.quantity || 1
      });
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
}> {
  try {
    // Get the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Validate inputs
    if (!questionId) {
      return { message: 'Question ID is required' };
    }

    // If no testId provided, try to get from localStorage
    const effectiveTestId = testId || localStorage.getItem('currentTestId');
    if (!effectiveTestId) {
      return { message: 'Test ID is required' };
    }

    // Check if question already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_questions')
      .select('id, quantity')
      .eq('question_id', questionId)
      .eq('test_id', effectiveTestId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking cart:', checkError);
      return { message: 'Failed to check if question is already in cart' };
    }

    if (existingItem) {
      // Question already in cart, increment quantity
      const newQuantity = (existingItem.quantity || 1) + 1;
      const { error: updateError } = await supabase
        .from('cart_questions')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item quantity:', updateError);
        return { message: 'Failed to update quantity' };
      }

      return { 
        message: 'Question quantity updated in cart', 
        cartItemId: existingItem.id 
      };
    }

    // Add new question to cart
    const { data: newItem, error: insertError } = await supabase
      .from('cart_questions')
      .insert({
        question_id: questionId,
        test_id: effectiveTestId,
        quantity: 1
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error adding question to cart:', insertError);
      return { message: 'Failed to add question to cart' };
    }

    return { 
      message: 'Question added to cart', 
      cartItemId: newItem.id 
    };
  } catch (error) {
    console.error('Unexpected error adding question to cart:', error);
    return { message: 'An unexpected error occurred' };
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

export async function getQuestionById(questionId: number) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${getBaseUrl()}/api/questions/${questionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch question details');
    }

    const data = await response.json();
    return data.question;
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
