import supabase from './supabaseClient';
import { Question } from '@/types/question';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';

export const fetchCartItems = asyncErrorHandler(async (testId: string): Promise<{questions: Question[], count: number}> => {
  console.log('fetchCartItems: Starting to fetch cart items for testId:', testId);
  
  try {
    if (!testId) {
      console.error('fetchCartItems: No testId provided');
      throw new AppError('Test ID is required', 400);
    }
    
    // First, check if the carts table exists
    try {
      console.log('fetchCartItems: Checking if carts table exists');
      const { error: tableCheckError } = await supabase.from('carts').select('id').limit(1);
      
      if (tableCheckError) {
        console.error('fetchCartItems: Error checking carts table:', tableCheckError);
        if (tableCheckError.message.includes('relation "carts" does not exist')) {
          console.error('fetchCartItems: The carts table does not exist');
          throw new AppError('The carts table does not exist. Please set up the database first.', 500, tableCheckError);
        }
        throw new AppError('Failed to check if carts table exists', 500, tableCheckError);
      }
    } catch (tableError) {
      console.error('fetchCartItems: Error in table check:', tableError);
      // Continue execution, as we'll handle the error in the next steps
    }
    
    // Get the cart ID from the test ID
    console.log('fetchCartItems: Getting cart ID for testId:', testId);
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .single();
    
    if (cartError) {
      console.error('fetchCartItems: Error fetching cart:', cartError);
      if (cartError.message.includes('relation "carts" does not exist')) {
        throw new AppError('The carts table does not exist. Please set up the database first.', 500, cartError);
      }
      throw new AppError('Failed to fetch cart', 500, cartError);
    }
    
    if (!cartData) {
      console.error('fetchCartItems: No cart found for testId:', testId);
      return { questions: [], count: 0 };
    }
    
    console.log('fetchCartItems: Found cart:', cartData);
    const cartId = cartData.id;
    
    // Check if cart_items table exists
    try {
      console.log('fetchCartItems: Checking if cart_items table exists');
      const { error: tableCheckError } = await supabase.from('cart_items').select('id').limit(1);
      
      if (tableCheckError) {
        console.error('fetchCartItems: Error checking cart_items table:', tableCheckError);
        if (tableCheckError.message.includes('relation "cart_items" does not exist')) {
          console.error('fetchCartItems: The cart_items table does not exist');
          throw new AppError('The cart_items table does not exist. Please set up the database first.', 500, tableCheckError);
        }
        throw new AppError('Failed to check if cart_items table exists', 500, tableCheckError);
      }
    } catch (tableError) {
      console.error('fetchCartItems: Error in table check:', tableError);
      // Continue execution, as we'll handle the error in the next steps
    }
    
    // Get the question IDs from the cart items
    console.log('fetchCartItems: Getting question IDs for cartId:', cartId);
    const { data: cartItemsData, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('question_id')
      .eq('cart_id', cartId);
    
    if (cartItemsError) {
      console.error('fetchCartItems: Error fetching cart items:', cartItemsError);
      if (cartItemsError.message.includes('relation "cart_items" does not exist')) {
        throw new AppError('The cart_items table does not exist. Please set up the database first.', 500, cartItemsError);
      }
      throw new AppError('Failed to fetch cart items', 500, cartItemsError);
    }
    
    if (!cartItemsData || cartItemsData.length === 0) {
      console.log('fetchCartItems: No cart items found for cartId:', cartId);
      return { questions: [], count: 0 };
    }
    
    const questionIds = cartItemsData.map(item => item.question_id);
    console.log('fetchCartItems: Found question IDs:', questionIds);
    
    // Get the questions from the question IDs
    console.log('fetchCartItems: Fetching questions for question IDs');
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);
    
    if (questionsError) {
      console.error('fetchCartItems: Error fetching questions:', questionsError);
      throw new AppError('Failed to fetch questions', 500, questionsError);
    }
    
    if (!questionsData || questionsData.length === 0) {
      console.log('fetchCartItems: No questions found for the given IDs');
      return { questions: [], count: 0 };
    }
    
    console.log('fetchCartItems: Found questions:', questionsData.length);
    
    // Map the questions to the expected format
    const questions = questionsData.map(q => ({
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
      // Add these properties to match the Question type
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
    
    console.log('fetchCartItems: Successfully mapped questions, returning', questions.length, 'questions');
    return { questions, count: questions.length };
  } catch (error) {
    console.error('fetchCartItems: Error in fetchCartItems:', error);
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(
        'Failed to fetch cart items', 
        500, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}); 