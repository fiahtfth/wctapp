'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/types/supabase';
import { supabaseAdmin } from './database/supabaseClient';
import { cookies, headers } from 'next/headers';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure supabase is not null
const supabase = supabaseAdmin;
if (!supabase) {
  throw new Error('Failed to initialize Supabase client');
}

type UserInsert = Database['public']['Tables']['users']['Insert'];
type CartInsert = Database['public']['Tables']['carts']['Insert'];
type CartItemInsert = Database['public']['Tables']['cart_items']['Insert'];

// Input validation schemas
const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']).default('user')
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Utility function to convert input to number
function toNumber(input: string | number): number {
  if (typeof input === 'number') return input;
  const parsed = parseInt(input, 10);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert ${input} to number`);
  }
  return parsed;
}

// Authentication helper functions
async function generateAuthToken(userId: number) {
  const token = uuidv4();
  
  // Store token in Supabase
  const { error } = await supabase
    .from('user_tokens')
    .insert({
      user_id: userId,
      token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
  
  if (error) {
    console.error('Error generating auth token:', error);
    throw new Error('Failed to generate authentication token');
  }
  
  // Set secure, HTTP-only cookie
  const cookieStore = await cookies();
  await cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 // 24 hours
  });
  
  return token;
}

async function validateAuthToken(token: string) {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // Check token expiration
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Token expired, delete it
    await supabase
      .from('user_tokens')
      .delete()
      .eq('token', token);
    return null;
  }
  
  return data.user_id;
}

async function getBaseUrl() {
  // In Vercel, we should use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development or when VERCEL_URL is not available
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    console.log('Base URL from headers:', baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('Error getting base URL from headers:', error);
    // Fallback to a hardcoded URL if all else fails
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wctapp-plt7kys8p-fiahtfth-gmailcoms-projects.vercel.app';
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
}

// Server Actions
export async function createUser(formData: FormData) {
  try {
    // Validate input
    const userData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'user' | 'admin' | undefined
    };
    
    const validatedData = UserSchema.parse(userData);
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();
    
    if (existingUserError && existingUserError.code !== 'PGRST116') {
      throw existingUserError;
    }
    
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: validatedData.username,
        email: validatedData.email,
        password_hash: passwordHash,
        role: validatedData.role || 'user',
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('User creation error:', error);
      return { success: false, error: 'Failed to create user' };
    }
    
    // Generate authentication token
    const token = await generateAuthToken(data.id);
    
    return { 
      success: true, 
      user: { 
        id: data.id, 
        username: validatedData.username, 
        email: validatedData.email, 
        role: validatedData.role || 'user' 
      } 
    };
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function loginUser(formData: FormData) {
  try {
    // Validate input
    const loginData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };
    
    const validatedData = LoginSchema.parse(loginData);
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, username, role')
      .eq('email', validatedData.email)
      .single();
    
    if (userError || !user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password, 
      user.password_hash
    );
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);
    
    // Generate authentication token
    const token = await generateAuthToken(user.id);
    
    return { 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    };
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function logoutUser() {
  try {
    // Get current auth token
    const cookieStore = await cookies();
    const token = (await cookieStore.get('auth_token'))?.value;
    
    if (token) {
      // Delete token from database
      await supabase
        .from('user_tokens')
        .delete()
        .eq('token', token);
    }
    
    // Clear authentication cookie
    await cookieStore.delete('auth_token');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getCurrentUser() {
  try {
    // Get current auth token
    const cookieStore = await cookies();
    const token = (await cookieStore.get('auth_token'))?.value;
    
    if (!token) {
      return null;
    }
    
    // Validate token and get user ID
    const userId = await validateAuthToken(token);
    
    if (!userId) {
      return null;
    }
    
    // Fetch user details
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function addQuestionToCart(questionId: number | string, testId: string) {
  console.log('server-actions.addQuestionToCart called with questionId:', questionId, 'testId:', testId);
  
  if (!questionId) {
    throw new Error('Question ID is required');
  }
  
  if (!testId) {
    throw new Error('Test ID is required');
  }
  
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('User not authenticated, cannot add to server cart');
      return { 
        success: false, 
        message: 'You must be logged in to add questions to cart',
        clientOnly: true 
      };
    }
    
    // Check for existing cart
    const { data: existingCart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if cart doesn't exist
      console.error('Error checking existing cart:', cartError);
      throw new Error('Failed to check existing cart');
    }

    let cartId: number;
    
    if (existingCart) {
      // Use existing cart
      cartId = existingCart.id;
      console.log('Using existing cart with ID:', cartId);
    } else {
      // Create new cart
      const cartInsertData: CartInsert = { 
        user_id: user.id,
        test_id: testId,
        is_draft: true
      };

      const { data: newCart, error: newCartError } = await supabase
        .from('carts')
        .insert(cartInsertData)
        .select('id')
        .single();
      
      if (newCartError) {
        console.error('Error creating cart:', newCartError);
        throw new Error('Failed to create cart: ' + newCartError.message);
      }

      if (!newCart) {
        console.error('No new cart created');
        throw new Error('Failed to create cart: No data returned');
      }

      cartId = newCart.id;
      console.log('Created new cart with ID:', cartId);
    }

    // Check if question is already in cart
    const { data: existingCartItem, error: cartItemError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cartId)
      .eq('question_id', toNumber(questionId))
      .limit(1)
      .single();

    if (cartItemError && cartItemError.code !== 'PGRST116') {
      console.error('Error checking existing cart item:', cartItemError);
      throw new Error('Failed to check existing cart items');
    }

    if (existingCartItem) {
      console.log('Question already in cart');
      return { 
        success: true,
        message: 'Question already in cart' 
      };
    }

    // Add question to cart
    const cartItemInsertData: CartItemInsert = { 
      cart_id: cartId, 
      question_id: toNumber(questionId)
    };

    const { data: newCartItem, error: newCartItemError } = await supabase
      .from('cart_items')
      .insert(cartItemInsertData)
      .select('id')
      .single();

    if (newCartItemError) {
      console.error('Error adding question to cart:', newCartItemError);
      throw new Error('Failed to add question to cart: ' + newCartItemError.message);
    }

    if (!newCartItem) {
      console.error('No new cart item created');
      throw new Error('Failed to add question to cart: No data returned');
    }

    console.log('Successfully added question to cart');
    return { 
      success: true,
      message: 'Question added to cart successfully', 
      cartItemId: newCartItem.id 
    };
  } catch (error) {
    console.error('Error in addQuestionToCart:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error adding question to cart');
    }
  }
}

export async function removeFromCart(questionId: number | string, testId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find the cart for the given test
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .single();

    if (cartError || !cartData) {
      return { success: false, error: 'Cart not found' };
    }

    // Remove the question from cart items
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartData.id)
      .eq('question_id', toNumber(questionId));

    if (error) {
      console.error('Error removing question from cart:', error);
      return { success: false, error: 'Failed to remove question from cart' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error removing from cart:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function getCartItems(testId: string) {
  console.log('server-actions.getCartItems called with testId:', testId);
  if (!testId || testId === 'undefined') {
    console.error('Invalid or missing testId:', testId);
    return { questions: [], count: 0 };
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('You must be logged in to view cart items');
    }
    
    // First, find the cart for this test and user
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .single();
    
    if (cartError || !cart) {
      console.log('No cart found for test:', testId);
      return { questions: [], count: 0 };
    }
    
    // Fetch cart items from Supabase using the cart ID
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('question_id')
      .eq('cart_id', cart.id);

    if (cartItemsError) {
      console.error('Error fetching cart items:', cartItemsError);
      return { questions: [], count: 0 };
    }
    
    if (!cartItems || cartItems.length === 0) {
      console.log('No items in cart');
      return { questions: [], count: 0 };
    }

    // Extract question IDs from cart items
    const questionIds = cartItems.map((item: { question_id: number }) => item.question_id);

    // Fetch questions from Supabase
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return { questions: [], count: 0 };
    }

    return { questions, count: questions.length };
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { questions: [], count: 0 };
  }
}

export async function exportTest(testId: string) {
  if (!testId) {
    throw new Error('Test ID is required');
  }

  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ testId }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to export test');
  }

  return response.blob();
}
