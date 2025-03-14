import supabase from './supabaseClient';
import { Question as ImportedQuestion, isQuestion } from '@/types/question';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import path from 'path';

// Define return type for getQuestions
interface QuestionsResult {
  questions: ImportedQuestion[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: null | Error;
}

export const getQuestions = asyncErrorHandler(async (filters: {
  page?: number | string;
  pageSize?: number | string;
  subject?: string | string[];
  module?: string | string[];
  topic?: string | string[];
  sub_topic?: string | string[];
  question_type?: string | string[];
  search?: string;
  difficulty?: string;
}): Promise<QuestionsResult> => {
  console.log('🔍 Fetching Questions with Params:', JSON.stringify(filters, null, 2));

  // Validate input parameters
  if (!filters) {
    throw new Error('No parameters provided for question retrieval');
  }

  try {
    // Sanitize and validate parameters
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.min(Math.max(1, Number(filters.pageSize || 10)), 50); // Limit to 50 per page
    const offset = (page - 1) * pageSize;

    console.log('📄 Query pagination:', { page, pageSize, offset });

    // Build base query
    let query = supabase.from('questions').select('*', { count: 'exact' });
    
    // Apply filters - updated to match actual column names in the database
    if (filters.subject) {
      const subjects = Array.isArray(filters.subject) ? filters.subject : [filters.subject];
      if (subjects.length > 0) {
        query = query.in('subject', subjects);
      }
    }
    
    if (filters.module) {
      const modules = Array.isArray(filters.module) ? filters.module : [filters.module];
      if (modules.length > 0) {
        query = query.in('module_name', modules);
      }
    }
    
    if (filters.topic) {
      const topics = Array.isArray(filters.topic) ? filters.topic : [filters.topic];
      if (topics.length > 0) {
        query = query.in('topic', topics);
      }
    }
    
    if (filters.sub_topic) {
      const subTopics = Array.isArray(filters.sub_topic) ? filters.sub_topic : [filters.sub_topic];
      if (subTopics.length > 0) {
        query = query.in('sub_topic', subTopics);
      }
    }
    
    if (filters.question_type) {
      const questionTypes = Array.isArray(filters.question_type) ? filters.question_type : [filters.question_type];
      if (questionTypes.length > 0) {
        query = query.in('question_type', questionTypes);
      }
    }
    
    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }
    
    // Apply search filter
    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const searchTerm = `%${filters.search.trim()}%`;
      query = query.or(
        `text.ilike.${searchTerm},answer.ilike.${searchTerm},explanation.ilike.${searchTerm}`
      );
    }
    
    // Apply pagination - use range for compatibility with tests
    const { data: questions, count, error } = await query
      .range(offset, offset + pageSize - 1)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw new AppError('Failed to fetch questions', 500, error);
    }
    
    const total = count || 0;
    
    // Map questions to the expected format - updated to match actual column names
    const mappedQuestions = (questions || []).map((q: any) => ({
      id: q.id,
      text: q.text,
      answer: q.answer,
      explanation: q.explanation || '',
      subject: q.subject,
      moduleName: q.module_name,
      topic: q.topic,
      subTopic: q.sub_topic || '',
      difficultyLevel: q.difficulty_level,
      questionType: q.question_type,
      natureOfQuestion: q.nature_of_question || '',
      // Add these properties to match the ImportedQuestion type
      Question: q.text,
      Answer: q.answer,
      Explanation: q.explanation || '',
      Subject: q.subject,
      'Module Name': q.module_name,
      Topic: q.topic,
      'Sub Topic': q.sub_topic || '',
      'Difficulty Level': q.difficulty_level,
      Question_Type: q.question_type,
      'Nature of Question': q.nature_of_question || '',
      FacultyApproved: false // Default value as it's not in the database
    }));
    
    return {
      questions: mappedQuestions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      error: null
    };
  } catch (error) {
    console.error('Error in getQuestions:', error);
    throw error;
  }
});

export async function sanitizeFilterValue(value?: string | string[]): Promise<string | string[] | null> {
  // If value is undefined or null, return null;
  if (value === undefined || value === null) return null;

  // If value is an array, sanitize each element
  if (Array.isArray(value)) {
    const sanitizedArray = value
      .filter(v => v !== undefined && v !== null && v.trim() !== '')
      .map(v => v.trim());
    
    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  // If value is a string, sanitize it
  const sanitizedValue = value.trim();
  return sanitizedValue !== '' ? sanitizedValue : null;
}

export const addQuestion = asyncErrorHandler(async (questionData: ImportedQuestion) => {
  try {
    // Validate question data
    if (!isQuestion(questionData)) {
      throw new AppError('Invalid question data', 400);
    }

    // Create a properly typed insert object
    const insertData = {
      text: String(questionData.text),
      answer: String(questionData.answer),
      explanation: questionData.explanation ? String(questionData.explanation) : null,
      subject: String(questionData.subject),
      module_name: String(questionData.moduleName || ''),
      topic: String(questionData.topic),
      sub_topic: questionData.subTopic ? String(questionData.subTopic) : null,
      difficulty_level: String(questionData.difficultyLevel || ''),
      question_type: String(questionData.questionType),
      nature_of_question: questionData.natureOfQuestion ? String(questionData.natureOfQuestion) : null
    };

    const { data, error } = await supabase
      .from('questions')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error adding question:', error);
      throw new AppError('Failed to add question', 500, error);
    }

    return data ? data[0] : questionData;
  } catch (error) {
    console.error('Error in addQuestion:', error);
    throw error;
  }
});

export const saveDraftCart = asyncErrorHandler(async (
  userId: number | string, 
  testName: string, 
  batch: string, 
  date: string, 
  questionIds: number[],
  existingTestId?: string // Optional parameter for updating an existing draft
) => {
  console.log('Saving draft cart:', { 
    userId: String(userId), 
    testName, 
    batch, 
    date, 
    questionIds,
    existingTestId: existingTestId || 'new draft'
  });
  
  try {
    // Validate inputs
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    
    if (!testName) {
      throw new AppError('Test name is required', 400);
    }
    
    if (!questionIds || questionIds.length === 0) {
      throw new AppError('Question IDs are required', 400);
    }
    
    // Ensure userId is a valid number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new AppError('Invalid user ID', 400);
    }
    
    // Skip user verification and just use the provided user ID
    // This avoids issues if the users table doesn't exist or the user doesn't exist
    console.log('Using user ID without verification:', numericUserId);
    
    // Create a cart entry with a generated test_id or use the existing one
    const testId = existingTestId || `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // First, try to create the carts table if it doesn't exist
      try {
        const { error: createCartsError } = await supabase.from('carts').select('id').limit(1);
        
        if (createCartsError && createCartsError.message.includes('relation "carts" does not exist')) {
          console.log('Carts table does not exist, creating it...');
          
          // Create the carts table
          const { error: createTableError } = await supabase.from('carts').insert({
            test_id: 'temp_test_id',
            user_id: 1,
            metadata: {}
          });
          
          if (createTableError && !createTableError.message.includes('relation "carts" does not exist')) {
            console.error('Error creating carts table:', createTableError);
          }
        }
      } catch (tableError) {
        console.error('Error checking/creating carts table:', tableError);
      }
      
      // If we're updating an existing draft, first check if it exists
      if (existingTestId) {
        const { data: existingCart, error: existingCartError } = await supabase
          .from('carts')
          .select('id')
          .eq('test_id', existingTestId)
          .eq('user_id', numericUserId)
          .single();
        
        if (existingCartError) {
          console.log('Existing cart not found, creating new one:', existingCartError);
          // Continue with creating a new cart
        } else if (existingCart) {
          console.log('Updating existing cart:', existingCart.id);
          
          // First, try to create the cart_items table if it doesn't exist
          try {
            const { error: createCartItemsError } = await supabase.from('cart_items').select('id').limit(1);
            
            if (createCartItemsError && createCartItemsError.message.includes('relation "cart_items" does not exist')) {
              console.log('Cart_items table does not exist, creating it...');
              
              // Create the cart_items table
              const { error: createTableError } = await supabase.from('cart_items').insert({
                cart_id: existingCart.id,
                question_id: questionIds[0] || 1
              });
              
              if (createTableError && !createTableError.message.includes('relation "cart_items" does not exist')) {
                console.error('Error creating cart_items table:', createTableError);
              }
            }
          } catch (tableError) {
            console.error('Error checking/creating cart_items table:', tableError);
          }
          
          // Delete existing cart items first
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', existingCart.id);
          
          if (deleteError) {
            console.error('Error deleting existing cart items:', deleteError);
            throw new AppError('Failed to update existing cart items', 500, deleteError);
          }
          
          // Add new cart items
          const cartItems = questionIds.map(questionId => ({
            cart_id: existingCart.id,
            question_id: questionId
          }));
          
          const { error: itemsError } = await supabase
            .from('cart_items')
            .insert(cartItems);
          
          if (itemsError) {
            console.error('Error adding cart items:', itemsError);
            throw new AppError('Failed to add cart items', 500, itemsError);
          }
          
          return testId;
        }
      }
      
      // Create a new cart entry
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .insert({
          test_id: testId,
          user_id: numericUserId,
          metadata: {
            testName,
            batch,
            date
          }
        })
        .select();

      if (cartError) {
        console.error('Error creating cart:', cartError);
        throw new AppError('Failed to create cart', 500, cartError);
      }

      if (!cartData || cartData.length === 0) {
        throw new AppError('Failed to create cart - no data returned', 500);
      }

      const cartId = cartData[0].id;

      // First, try to create the cart_items table if it doesn't exist
      try {
        const { error: createCartItemsError } = await supabase.from('cart_items').select('id').limit(1);
        
        if (createCartItemsError && createCartItemsError.message.includes('relation "cart_items" does not exist')) {
          console.log('Cart_items table does not exist, creating it...');
          
          // Create the cart_items table
          const { error: createTableError } = await supabase.from('cart_items').insert({
            cart_id: cartId,
            question_id: questionIds[0] || 1
          });
          
          if (createTableError && !createTableError.message.includes('relation "cart_items" does not exist')) {
            console.error('Error creating cart_items table:', createTableError);
          }
        }
      } catch (tableError) {
        console.error('Error checking/creating cart_items table:', tableError);
      }

      // Skip question verification to simplify the process
      // Just use the provided question IDs
      console.log('Using question IDs without verification:', questionIds);

      // Then add cart items
      const cartItems = questionIds.map(questionId => ({
        cart_id: cartId,
        question_id: questionId
      }));

      const { error: itemsError } = await supabase
        .from('cart_items')
        .insert(cartItems);

      if (itemsError) {
        console.error('Error adding cart items:', itemsError);
        throw new AppError('Failed to add cart items', 500, itemsError);
      }

      return testId;
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      
      // Provide a more specific error message based on the error
      if (dbError instanceof Error) {
        const errorMessage = dbError.message;
        
        if (errorMessage.includes('relation "carts" does not exist')) {
          throw new AppError('The carts table does not exist in the database. Please contact the administrator.', 500, dbError);
        } else if (errorMessage.includes('relation "cart_items" does not exist')) {
          throw new AppError('The cart_items table does not exist in the database. Please contact the administrator.', 500, dbError);
        } else if (errorMessage.includes('foreign key constraint')) {
          throw new AppError('Unable to save cart due to database constraints. Some referenced items may not exist.', 500, dbError);
        } else if (errorMessage.includes('duplicate key value violates unique constraint')) {
          throw new AppError('A draft with this name already exists for this user. Please use a different name.', 400, dbError);
        }
      }
      
      // Re-throw the error with a generic message if it's not a specific case
      throw new AppError('Failed to save draft cart due to a database error', 500, dbError);
    }
  } catch (error) {
    console.error('Error in saveDraftCart:', error);
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(
        'Failed to save draft cart', 
        500, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
});
