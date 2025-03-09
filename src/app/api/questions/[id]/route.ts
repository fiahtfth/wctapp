import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';
import { Database } from '@/lib/database/schema';

type QuestionRow = Database['public']['Tables']['questions']['Row'];

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const questionId = params.id;
  
  if (!questionId) {
    return NextResponse.json({ error: 'Question ID is required' }, { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  console.log('Getting question with ID:', questionId);
  debugLog('Environment:', process.env.NODE_ENV, 'Vercel:', isVercelEnvironment());
  
  // If we're in Vercel environment and using mock data
  if (isVercelEnvironment() && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    debugLog('Using simplified question handling for Vercel environment');
    
    // In Vercel, we'll create a mock question
    const mockQuestion = {
      id: Number(questionId),
      text: `Sample Question #${questionId}`,
      answer: 'Sample Answer',
      explanation: 'Sample Explanation',
      subject: 'Sample Subject',
      moduleName: 'Sample Module',
      topic: 'Sample Topic',
      subTopic: 'Sample SubTopic',
      difficultyLevel: 'Medium',
      questionType: 'MCQ',
      natureOfQuestion: 'Conceptual'
    };
    
    return NextResponse.json({ 
      question: mockQuestion,
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
  
  try {
    // Get question by ID from Supabase
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', parseInt(questionId, 10))
      .single();
    
    if (error) {
      console.error('Error fetching question:', error);
      return NextResponse.json({ 
        error: 'Error fetching question',
        details: error.message
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Transform the question to match the expected format
    const formattedQuestion = {
      id: question.id,
      text: question.text || '',
      answer: question.answer || '',
      explanation: question.explanation || '',
      subject: question.subject || '',
      moduleName: question.module_name || '',
      topic: question.topic || '',
      subTopic: question.sub_topic || '',
      difficultyLevel: question.difficulty_level || '',
      questionType: question.question_type || '',
      natureOfQuestion: question.nature_of_question || '',
      // Legacy fields for compatibility
      Question: question.text || '',
      Answer: question.answer || '',
      Explanation: question.explanation || '',
      Subject: question.subject || '',
      ModuleName: question.module_name || '',
      Topic: question.topic || '',
      SubTopic: question.sub_topic || '',
      DifficultyLevel: question.difficulty_level || '',
      QuestionType: question.question_type || '',
      NatureOfQuestion: question.nature_of_question || ''
    };
    
    return NextResponse.json({ question: formattedQuestion }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ 
      error: 'Error fetching question',
      details: error instanceof Error ? error.message : String(error)
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
