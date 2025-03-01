import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId } = body;
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
      return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Transform questions for Excel export
    const exportData = questions.map((q: any) => ({
      Question: q.text,
      Subject: q.subject,
      Topic: q.topic || 'N/A',
      Difficulty: q.difficulty_level,
      Answer: q.answer,
      Explanation: q.explanation || 'N/A',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Questions');

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=test_questions_${testId}.xlsx`,
      },
    });
  } catch (error) {
    console.error('Error exporting questions:', error);
    return NextResponse.json({ error: 'Failed to export questions' }, { status: 500 });
  }
}
