import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, addQuestion } from '@/lib/database/queries';
import { Question } from '@/types/question';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

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
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const search = searchParams.get('search');
    
    console.log('GET /api/questions:', { page, limit, subject, topic, search });
    
    try {
      // Try both possible database paths
      let dbPath = path.join(process.cwd(), 'wct.db');
      if (!fs.existsSync(dbPath)) {
        dbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
      }
      
      console.log('Opening database at:', dbPath);
      console.log('Database exists:', fs.existsSync(dbPath));
      
      if (!fs.existsSync(dbPath)) {
        console.error('Database file does not exist:', dbPath);
        return NextResponse.json({ 
          error: 'Database file does not exist',
          questions: []
        }, { status: 500 });
      }
      
      const db = new Database(dbPath);
      
      try {
        // Build query
        let query = `
          SELECT 
            id, 
            Question, 
            Answer, 
            Explanation, 
            Subject, 
            "Module Name" as ModuleName, 
            Topic, 
            "Sub Topic" as SubTopic, 
            "Difficulty Level" as DifficultyLevel,
            Question_Type as QuestionType
          FROM questions
          WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        
        // Add filters
        if (subject) {
          query += ' AND Subject = ?';
          queryParams.push(subject);
        }
        
        if (topic) {
          query += ' AND Topic = ?';
          queryParams.push(topic);
        }
        
        if (search) {
          query += ' AND (Question LIKE ? OR Answer LIKE ? OR Explanation LIKE ?)';
          const searchPattern = `%${search}%`;
          queryParams.push(searchPattern, searchPattern, searchPattern);
        }
        
        console.log('Query:', query);
        console.log('Query params:', queryParams);
        
        // Count total matching questions
        const countQuery = `SELECT COUNT(*) as total FROM questions WHERE 1=1` + 
          query.substring(query.indexOf('WHERE 1=1') + 8);
        
        console.log('Count query:', countQuery);
        
        const totalResult = db.prepare(countQuery).get(...queryParams);
        const total = totalResult ? (totalResult as any).total : 0;
        
        console.log('Total questions:', total);
        
        // Add pagination
        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, (page - 1) * limit);
        
        // Execute query
        const questions = db.prepare(query).all(...queryParams);
        
        console.log('Found questions:', questions.length);
        
        db.close();
        
        return NextResponse.json({
          questions,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }, { status: 200 });
      } catch (dbError) {
        console.error('Database error fetching questions:', dbError);
        try {
          db.close();
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
        return NextResponse.json({ 
          error: 'Database error: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
          questions: []
        }, { status: 500 });
      }
    } catch (dbConnectionError) {
      console.error('Failed to connect to database:', dbConnectionError);
      return NextResponse.json({ 
        error: 'Database connection error: ' + (dbConnectionError instanceof Error ? dbConnectionError.message : String(dbConnectionError)),
        questions: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch questions',
      questions: []
    }, { status: 500 });
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
