import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/database/supabaseClient'
import { Database } from '@/lib/database/schema'

type QuestionRow = Database['public']['Tables']['questions']['Row']

// Type guard to check if the result is a valid question
function isValidQuestion(question: any): question is QuestionRow {
  return question && typeof question === 'object' && 
         question.id !== undefined && 
         question.text !== undefined;
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/questions ROUTE ENTERED');
  try {
    // Log the entire request body for debugging
    const requestBody = await request.json();
    console.log('🔍 Full Request Body:', JSON.stringify(requestBody, null, 2));

    return await getQuestions(request, requestBody);
  } catch (error) {
    console.error('🚨 Error in questions API POST route:', error);
    return NextResponse.json({
      error: 'Unexpected error processing request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function getQuestions(request: NextRequest, requestBody: any) {
  try {
    // Ensure requestBody is an object and has default values
    const body = requestBody || {};
    
    // Extract parameters with robust parsing
    const page = Math.max(1, parseInt(body.page || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(body.pageSize || '10', 10)), 50);
    
    console.log('📋 DETAILED Query Parameters:', {
      page,
      limit,
      fullRequestBody: JSON.stringify(body, null, 2)
    });
    
    // Flexible column mapping with support for different naming conventions - updated to match actual column names
    const columnMap: { [key: string]: string } = {
      'subject': 'subject',
      'module': 'module_name',
      'topic': 'topic',
      'sub_topic': 'sub_topic',
      'difficulty_level': 'difficulty_level',
      'question_type': 'question_type',
      'nature_of_question': 'nature_of_question'
    };

    // Build base query
    let query = supabase.from('questions').select('*', { count: 'exact' });
    
    // Dynamic filter application
    const columnFilters: { [column: string]: string[] } = {};
    console.log('🔍 Column Mapping:', columnMap);
    
    // Ensure filters is an object
    const filters = body.filters || {};
    
    // Check if filters exist and are not empty
    const hasFilters = Object.keys(filters).length > 0 && 
      Object.values(filters).some(val => 
        val && (Array.isArray(val) ? val.length > 0 : typeof val === 'string' && val.trim() !== '')
      );

    if (hasFilters) {
      Object.entries(filters).forEach(([key, value]) => {
        const mappedColumn = columnMap[key];
        console.log(`🔬 Processing key: ${key}, Mapped Column: ${mappedColumn}, Value:`, value);
        
        if (mappedColumn && value) {
          if (!columnFilters[mappedColumn]) {
            columnFilters[mappedColumn] = [];
          }
          // Ensure value is converted to a string array
          const stringValues = Array.isArray(value) 
            ? value.map(v => String(v)) 
            : [String(value)];
          columnFilters[mappedColumn].push(...stringValues);
        }
      });

      console.log('🧩 Processed Column Filters:', JSON.stringify(columnFilters, null, 2));

      // Apply filters to the query
      Object.entries(columnFilters).forEach(([column, values]) => {
        if (values.length > 1) {
          // Combine multiple filters for the same column using 'or'
          query = query.or(
            values.map(value => `"${column}".ilike.%${value}%`).join(',')
          );
        } else if (values.length === 1) {
          // Apply single filter for the column
          query = query.ilike(`"${column}"`, `%${values[0]}%`);
        }
      });
    }
    
    // Search filter with multiple column search - updated to match actual column names
    const searchTerm = body.search ? String(body.search).trim() : '';
    if (searchTerm.length > 1) {
      // Search across multiple text columns
      query = query.or(
        `"text".ilike.%${searchTerm}%,"answer".ilike.%${searchTerm}%,"explanation".ilike.%${searchTerm}%`
      );
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    console.log('🔍 Executing Supabase Query', { 
      start, 
      end, 
      query: query.toString() 
    });
    
    const { data: questions, count, error } = await query
      .range(start, end)
      .order('id', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase Query Error:', error);
      return NextResponse.json({ 
        error: 'Database query error',
        details: error.message,
        questions: []
      }, { status: 500 });
    }
    
    const total = count || 0;
    
    console.log('🔍 Raw Supabase Result:', { 
      questionsCount: questions?.length, 
      count, 
      total 
    });

    // Normalize question data keys with type safety - updated to match actual column names
    const normalizedQuestions = (questions || [])
      .filter(isValidQuestion)
      .map(question => ({
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
        natureOfQuestion: question.nature_of_question || ''
      }));

    console.log('✅ Query Successful:', { 
      questionsCount: normalizedQuestions.length, 
      total, 
      page, 
      limit 
    });

    if (normalizedQuestions.length === 0) {
      console.log('🚨 Empty questions list:', { 
        page, 
        limit, 
        requestBody: body, 
        query: query.toString() 
      });
    }

    return NextResponse.json({
      questions: normalizedQuestions,
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error) {
    console.error('🚨 Unexpected Error in getQuestions:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unexpected error fetching questions',
      questions: []
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/questions ROUTE ENTERED');
  try {
    const searchParams = request.nextUrl.searchParams;
    console.log('🔍 Full Request Body:', JSON.stringify(Object.fromEntries(searchParams), null, 2));

    const requestBody = Object.fromEntries(
      Array.from(searchParams.entries()).map(([key, value]) => [key, value])
    );

    return await getQuestions(request, requestBody);
  } catch (error) {
    console.error('🚨 Error in questions API GET route:', error);
    return NextResponse.json({
      error: 'Unexpected error processing request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
