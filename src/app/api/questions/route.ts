import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Utility function to safely get search params
function getSafeSearchParams(request: NextRequest): URLSearchParams {
  try {
    // For test environments, return an empty URLSearchParams
    if (!request.nextUrl || !request.nextUrl.searchParams) {
      return new URLSearchParams();
    }
    return request.nextUrl.searchParams;
  } catch (error) {
    console.error('Error getting search params:', error);
    return new URLSearchParams();
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/questions ROUTE ENTERED');
  
  try {
    // Safely get search parameters
    const searchParams = getSafeSearchParams(request);
    
    // Log full request body for debugging
    console.log('🔍 Full Request Params:', 
      JSON.stringify(Object.fromEntries(searchParams), null, 2)
    );

    // Convert search params to a request body
    const requestBody = Object.fromEntries(
      Array.from(searchParams.entries()).map(([key, value]) => [key, value])
    );

    // Validate and process request
    if (!requestBody) {
      return NextResponse.json({ 
        error: 'Invalid request parameters' 
      }, { status: 400 });
    }

    // Call main question retrieval function
    return await getQuestions(request, requestBody);

  } catch (error) {
    console.error('🚨 Error in questions API GET route:', error);
    return NextResponse.json({
      error: 'Unexpected error processing request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body || !body.text) {
      return NextResponse.json({ 
        error: 'Invalid request body' 
      }, { status: 400 });
    }

    // TODO: Implement actual question creation logic
    return NextResponse.json({ 
      message: 'Question added successfully',
      question: body 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in questions API POST route:', error);
    return NextResponse.json({
      error: 'Failed to add question',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function getQuestions(request: NextRequest, requestBody: Record<string, string>) {
  try {
    // Supabase client initialization
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-url.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

    // Extract query parameters with defaults
    const page = parseInt(requestBody.page || '1', 10);
    const pageSize = parseInt(requestBody.pageSize || '10', 10);
    const subject = requestBody.subject || '';
    const topic = requestBody.topic || '';
    const difficultyLevel = requestBody.difficultyLevel || '';
    const questionType = requestBody.questionType || '';

    // Calculate pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Build query
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (subject) query = query.eq('subject', subject);
    if (topic) query = query.eq('topic', topic);
    if (difficultyLevel) query = query.eq('difficulty_level', difficultyLevel);
    if (questionType) query = query.eq('question_type', questionType);

    // Execute query
    const { data, count, error } = await query
      .range(start, end)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error retrieving questions:', error);
      return NextResponse.json({
        error: 'Failed to retrieve questions',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      questions: data || [],
      totalQuestions: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error retrieving questions:', error);
    return NextResponse.json({
      error: 'Failed to retrieve questions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
