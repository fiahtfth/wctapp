import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tests');
    debugLog('Environment:', process.env.NODE_ENV, 'Vercel:', isVercelEnvironment());
    
    // If we're in Vercel environment and using mock data
    if (isVercelEnvironment() && process.env.USE_MOCK_DATA === 'true') {
      debugLog('Using mock tests for Vercel environment');
      
      // Return mock tests
      const mockTests = [
        {
          id: 1,
          test_id: 'test-1',
          created_at: new Date().toISOString(),
          question_count: 3,
          questions: [
            {
              id: 101,
              question: 'Sample Question 1',
              subject: 'Sample Subject',
              topic: 'Sample Topic',
              difficultyLevel: 'Medium'
            },
            {
              id: 102,
              question: 'Sample Question 2',
              subject: 'Sample Subject',
              topic: 'Sample Topic',
              difficultyLevel: 'Easy'
            },
            {
              id: 103,
              question: 'Sample Question 3',
              subject: 'Sample Subject',
              topic: 'Sample Topic',
              difficultyLevel: 'Hard'
            }
          ]
        }
      ];
      
      return NextResponse.json({ 
        tests: mockTests,
        vercelMode: true
      }, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Get all carts (tests) from Supabase
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id, test_id, created_at')
      .order('created_at', { ascending: false });
    
    if (cartsError) {
      console.error('Error fetching carts:', cartsError);
      return NextResponse.json({ 
        error: 'Error fetching carts: ' + cartsError.message,
        tests: []
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // For each cart, get the question count and questions
    const testsWithQuestions = await Promise.all(carts.map(async (cart) => {
      // Get cart items
      const { data: cartItems, error: cartItemsError } = await supabase
        .from('cart_items')
        .select('question_id')
        .eq('cart_id', cart.id);
      
      if (cartItemsError) {
        console.error('Error fetching cart items:', cartItemsError);
        return {
          ...cart,
          question_count: 0,
          questions: []
        };
      }
      
      // Get questions for this cart
      const questionIds = cartItems.map(item => item.question_id);
      let questions: Array<{
        id: number;
        question: string;
        subject: string;
        topic: string;
        difficultyLevel: string;
      }> = [];
      
      if (questionIds.length > 0) {
        const { data: questionData, error: questionsError } = await supabase
          .from('questions')
          .select('id, text, subject, topic, difficulty_level')
          .in('id', questionIds);
        
        if (!questionsError && questionData) {
          questions = questionData.map(q => ({
            id: q.id,
            question: q.text,
            subject: q.subject,
            topic: q.topic,
            difficultyLevel: q.difficulty_level
          }));
        }
      }
      
      return {
        ...cart,
        question_count: questionIds.length,
        questions
      };
    }));
    
    return NextResponse.json({ 
      tests: testsWithQuestions
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in tests API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch tests',
      tests: []
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}
