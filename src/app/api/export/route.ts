import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';
import * as XLSX from 'xlsx';

export async function exportQuestions(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, format = 'csv' } = body;
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Fetch cart items from Supabase
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('question_id')
      .eq('cart_id', testId);

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
    const { data: questions, error: questionsError } = await supabase
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
    const exportData = questions.map((q: any) => ({
      Question: q.text,
      Subject: q.subject,
      Topic: q.topic || 'N/A',
      Difficulty: q.difficulty_level,
      Answer: q.answer,
      Explanation: q.explanation || 'N/A',
    }));

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
        'Content-Disposition': `attachment; filename=test_questions_${testId}.${fileExtension}`,
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
