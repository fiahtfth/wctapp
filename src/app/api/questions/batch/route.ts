import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const { questionIds } = await request.json();
    
    console.log('📦 Fetching batch questions:', questionIds);
    
    // Validate inputs
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid question IDs' 
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

    // Fetch questions by IDs
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch questions',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Fetched ${questions?.length || 0} questions`);

    // Map to consistent format
    const formattedQuestions = (questions || []).map(q => ({
      id: q.id,
      text: q.text,
      answer: q.answer,
      explanation: q.explanation || '',
      subject: q.subject,
      topic: q.topic,
      questionType: q.question_type,
      difficulty: q.difficulty_level,
      module: q.module_name || '',
      sub_topic: q.sub_topic || '',
      // Legacy format for compatibility
      Question: q.text,
      Answer: q.answer,
      Subject: q.subject,
      Topic: q.topic,
      'Module Name': q.module_name || '',
      'Sub Topic': q.sub_topic || '',
      'Difficulty Level': q.difficulty_level,
      Question_Type: q.question_type,
      FacultyApproved: q.faculty_approved || false
    }));

    return NextResponse.json({ 
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length
    });

  } catch (error) {
    console.error('❌ Error fetching batch questions:', error);
    return NextResponse.json({
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
