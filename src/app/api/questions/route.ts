import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, addQuestion } from '@/lib/database/queries';
import { Question } from '@/types/question';
import fs from 'fs';
import path from 'path';

// Global error handler for API routes
function handleApiError(error: unknown): NextResponse {
  console.error('🚨 API Error:', error);

  // Detailed error logging
  if (error instanceof Error) {
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
  }

  return NextResponse.json({
    error: 'Internal Server Error',
    details: error instanceof Error 
      ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      : { message: String(error) }
  }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    console.group('🔍 Question Retrieval Request');
    try {
      console.log('📋 Raw Query Parameters:', Object.fromEntries(request.nextUrl.searchParams));
      
      // Sanitize and parse query parameters
      const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '10', 10);
      
      // Extract and log filters with more robust parsing
      const filters: Record<string, string | string[]> = {};
      const filterKeys = ['subject', 'module', 'topic', 'sub_topic', 'question_type', 'search'];
      
      filterKeys.forEach(key => {
          const value = request.nextUrl.searchParams.get(key);
          if (value) {
              // More robust splitting and trimming
              const processedValue = value.split(',')
                  .map(v => v.trim())
                  .filter(v => v !== '');
              
              filters[key] = processedValue.length > 1 ? processedValue : processedValue[0];
          }
      });
      
      console.log('🧩 Parsed Filters:', filters);
      console.log('📄 Pagination:', { page, pageSize });

      try {
          // Retrieve questions with comprehensive error handling
          const result = await getQuestions({
              page,
              pageSize,
              ...filters
          });

          console.log('📊 Query Result:', {
              totalQuestions: result.total,
              returnedQuestions: result.questions.length,
              page: result.page,
              pageSize: result.pageSize
          });

          // Enhanced logging for questions
          if (result.questions.length > 0) {
              console.log('📝 Sample Questions:', result.questions.slice(0, 3).map(q => ({
                  id: q.id,
                  subject: q.Subject,
                  module: q['Module Name'],
                  topic: q.Topic,
                  questionType: q.Question_Type
              })));
          } else {
              console.warn('⚠️ No questions found matching the filters');
          }

          // If no questions found, return a detailed response
          if (result.questions.length === 0) {
              return NextResponse.json({
                  questions: [],
                  total: 0,
                  page,
                  pageSize,
                  filters,
                  message: 'No questions found matching the specified filters.',
                  debugInfo: {
                      totalQuestions: result.total,
                      appliedFilters: filters
                  }
              }, { status: 404 });
          }

          return NextResponse.json({
              questions: result.questions,
              total: result.total,
              page,
              pageSize,
              filters
          });
      } catch (queryError) {
          console.error('❌ Query Execution Error:', queryError);
          return handleApiError(queryError);
      }
    } catch (error) {
      console.error('❌ Full Request Processing Error:', error);
      return handleApiError(error);
    } finally {
      console.groupEnd();
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.group('🔍 Question Retrieval POST Request');
    console.log('📨 Request Headers:', Object.fromEntries(request.headers));
    console.log('📍 Request URL:', request.url);
    try {
      // Log the raw request body for debugging
      const rawBody = await request.text();
      console.log('📋 Raw Request Body:', rawBody);

      // Parse request body
      let requestBody;
      try {
        requestBody = JSON.parse(rawBody);
      } catch (parseError) {
        console.error('❌ JSON Parsing Error:', parseError);
        return NextResponse.json({
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }, { status: 400 });
      }

      console.log('📋 Parsed Request Body:', requestBody);
      
      // Sanitize and parse request parameters
      const page = parseInt(requestBody.page || '1', 10);
      const pageSize = Math.min(parseInt(requestBody.pageSize || '10', 10), 50); // Limit to 50 questions per page
      console.log('📄 Using page size:', pageSize);
      
      // Prepare filters from request body
      const filters: Record<string, string | string[]> = {};
      const filterKeys = ['subject', 'module', 'topic', 'sub_topic', 'question_type', 'search'];
      
      filterKeys.forEach(key => {
        const value = requestBody[key];
        if (value) {
          // Normalize filter values
          const processedValue = Array.isArray(value) 
            ? value.map(v => String(v).trim()).filter(v => v !== '')
            : String(value).trim();
          
          if (processedValue && processedValue.length > 0) {
            filters[key] = processedValue;
          }
        }
      });
      
      console.log('🧩 Parsed Filters:', filters);
      console.log('📄 Pagination:', { page, pageSize });

      try {
        // Retrieve questions with comprehensive error handling
        const result = await getQuestions({
          page,
          pageSize,
          ...filters
        });

        console.log('📊 Query Result:', {
          totalQuestions: result.total,
          returnedQuestions: result.questions.length,
          page: result.page,
          pageSize: result.pageSize
        });

        // Return comprehensive response
        return NextResponse.json({
          questions: result.questions,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / pageSize)
        }, { status: 200 });

      } catch (queryError) {
        console.error('❌ Query Error:', queryError);
        return handleApiError(queryError);
      }
    } catch (error) {
      console.error('❌ Request Processing Error:', error);
      return handleApiError(error);
    } finally {
      console.groupEnd();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
