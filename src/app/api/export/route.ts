import { NextRequest, NextResponse } from 'next/server';
import getSupabaseClient, { supabaseAdmin } from '@/lib/database/supabaseClient';
import * as XLSX from 'xlsx';

// Define the export data interface
interface ExportDataItem {
  Question: string;
  Subject: string;
  Topic: string;
  'Sub Topic': string;
  'Micro Topic': string;
  Difficulty: string;
  Answer: string;
  Explanation: string;
}

export async function exportQuestions(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, questions, format = 'xlsx', testName, testBatch, testDate } = body;
    
    if (!testId && !questions) {
      return NextResponse.json({ error: 'Test ID or questions array is required' }, { status: 400 });
    }

    let exportData: ExportDataItem[] = [];
    
    // If questions array is provided directly, use it
    if (questions && Array.isArray(questions) && questions.length > 0) {
      exportData = questions.map((q: any) => ({
        Question: q.text || q.Question || '',
        Subject: q.subject || q.Subject || '',
        Topic: q.topic || q.Topic || 'N/A',
        'Sub Topic': q.subTopic || q['Sub Topic'] || '',
        'Micro Topic': q.microTopic || q['Micro Topic'] || '',
        Difficulty: q.difficultyLevel || q['Difficulty Level'] || 'Medium',
        Answer: q.answer || q.Answer || '',
        Explanation: q.explanation || q.Explanation || 'N/A',
      }));
    } 
    // Otherwise fetch questions from the database using testId
    else if (testId) {
      // Get the Supabase client
      const supabase = supabaseAdmin;
      
      if (!supabase) {
        return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
      }

      // First get the cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('test_id', testId)
        .maybeSingle();

      if (cartError) {
        console.error('Error fetching cart:', cartError);
        return NextResponse.json({ 
          error: 'Failed to export questions', 
          details: cartError.message 
        }, { status: 500 });
      }

      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      // Fetch cart items from Supabase
      const { data: cartItems, error: cartItemsError } = await supabase
        .from('cart_items')
        .select('question_id')
        .eq('cart_id', cart.id);

      if (cartItemsError) {
        console.error('Error fetching cart items:', cartItemsError);
        return NextResponse.json({ 
          error: 'Failed to export questions', 
          details: cartItemsError.message 
        }, { status: 500 });
      }

      // Extract question IDs from cart items
      const questionIds = cartItems.map((item: any) => Number(item.question_id));

      // Fetch questions from Supabase
      const { data: dbQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return NextResponse.json({ 
          error: 'Failed to export questions', 
          details: questionsError.message 
        }, { status: 500 });
      }

      // Transform questions for export
      exportData = dbQuestions.map((q: any) => ({
        Question: q.text || '',
        Subject: q.subject || '',
        Topic: q.topic || 'N/A',
        'Sub Topic': q.sub_topic || '',
        'Micro Topic': q.micro_topic || '',
        Difficulty: q.difficulty_level || 'Medium',
        Answer: q.answer || '',
        Explanation: q.explanation || 'N/A',
      }));
    }

    // Add metadata to the first row if provided
    if (testName || testBatch || testDate) {
      exportData.unshift({
        Question: `Test: ${testName || 'Untitled'}`,
        Subject: `Batch: ${testBatch || 'N/A'}`,
        Topic: `Date: ${testDate || new Date().toISOString().split('T')[0]}`,
        'Sub Topic': '',
        'Micro Topic': '',
        Difficulty: '',
        Answer: '',
        Explanation: '',
      });
    }

    // Determine export format
    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'xlsx') {
      // Create workbook and worksheet for XLSX
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Questions');

      // Convert workbook to buffer
      fileBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      // Convert to CSV
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      fileBuffer = Buffer.from(XLSX.utils.sheet_to_csv(worksheet));
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    // Return exported file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=test_questions_${testId || Date.now()}.${fileExtension}`,
      },
    });
  } catch (error) {
    console.error('Error exporting questions:', error);
    return NextResponse.json({ 
      error: 'Failed to export questions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return exportQuestions(request);
}
