'use server';

import getSupabaseClient from './supabaseClient';
import { Question } from '@/types/question';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';

// Create cart tables if they dont exist
const createCartTables = async () => {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return;
    }
    
    // Check if carts table exists
    const { error: cartsCheckError } = await supabase
      .from('carts')
      .select('id')
      .limit(1);
    
    if (cartsCheckError && cartsCheckError.message.includes('relation "carts" does not exist')) {
      // Create carts table using SQL
      const createCartsQuery = `
        CREATE TABLE IF NOT EXISTS carts (
          id SERIAL PRIMARY KEY,
          test_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb
        )
      `;
      
      try {
        await supabase.rpc('exec_sql', { sql: createCartsQuery });
      } catch (err) {
        console.error('Failed to create carts table:', err);
      }
    }
    
    // Check if cart_items table exists
    const { error: itemsCheckError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1);
    
    if (itemsCheckError && itemsCheckError.message.includes('relation "cart_items" does not exist')) {
      // Create cart_items table using SQL
      const createItemsQuery = `
        CREATE TABLE IF NOT EXISTS cart_items (
          id SERIAL PRIMARY KEY,
          cart_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
        )
      `;
      
      try {
        await supabase.rpc('exec_sql', { sql: createItemsQuery });
      } catch (err) {
        console.error('Failed to create cart_items table:', err);
      }
    }
  } catch (error) {
    console.error('Error creating cart tables:', error);
  }
};

// Call createCartTables on module initialization
createCartTables().catch(console.error);

export const addQuestionToCart = asyncErrorHandler(async (questionId: number | string, testId: string, userId: number): Promise<boolean> => {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      throw new AppError('Failed to initialize Supabase client', 500);
    }
    
    // Ensure cart exists
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      // Create new cart if it doesn't exist
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          test_id: testId,
          user_id: userId,
          metadata: {}
        })
        .select();
      
      if (createError) {
        throw new AppError('Failed to create cart', 500, createError);
      }
      
      // Add question to cart
      const { error: addError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: newCart[0].id,
          question_id: Number(questionId)
        });
      
      if (addError) {
        throw new AppError('Failed to add question to cart', 500, addError);
      }
    } else {
      // Add question to existing cart
      const { error: addError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          question_id: Number(questionId)
        });
      
      if (addError) {
        throw new AppError('Failed to add question to cart', 500, addError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding question to cart:', error);
    throw error;
  }
});

export const removeQuestionFromCart = asyncErrorHandler(async (questionId: number | string, testId: string, userId: number): Promise<boolean> => {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      throw new AppError('Failed to initialize Supabase client', 500);
    }
    
    // Get cart ID
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      throw new AppError('Cart not found', 404, cartError);
    }
    
    // Remove question from cart
    const { error: removeError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('question_id', Number(questionId));
    
    if (removeError) {
      throw new AppError('Failed to remove question from cart', 500, removeError);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  }
});

export const getCartQuestions = asyncErrorHandler(async (testId: string, userId: number): Promise<Question[]> => {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      throw new AppError('Failed to initialize Supabase client', 500);
    }
    
    // Get cart ID
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      return [];
    }
    
    // Get questions in cart
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('question_id')
      .eq('cart_id', cart.id);
    
    if (itemsError || !cartItems || cartItems.length === 0) {
      return [];
    }
    
    const questionIds = cartItems.map(item => item.question_id);
    
    // Get question details
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);
    
    if (questionsError) {
      throw new AppError('Failed to fetch questions', 500, questionsError);
    }
    
    // Map to Question type
    return (questions || []).map(q => ({
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
      // Legacy fields for compatibility
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
      FacultyApproved: false
    }));
  } catch (error) {
    console.error('Error getting cart questions:', error);
    throw error;
  }
});
