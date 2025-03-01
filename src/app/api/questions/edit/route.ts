import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/types/question';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

function processField(field: string, value: any): any {
  // If value is null or undefined, return as is
  if (value === null || value === undefined) {
    // Special handling for Difficulty Level
    if (field === 'Difficulty Level') {
      return 'medium';
    }
    return value;
  }
  // Convert to string if not already a string
  const stringValue = String(value).trim();
  switch (field) {
    case 'Difficulty Level': {
      const validDifficultyLevels = ['easy', 'medium', 'difficult'];
      const lowercaseDifficulty = stringValue.toLowerCase();
      console.log('Processing Difficulty Level:', {
        input: stringValue,
        lowercased: lowercaseDifficulty,
        isValid: validDifficultyLevels.includes(lowercaseDifficulty),
      });
      return validDifficultyLevels.includes(lowercaseDifficulty) ? lowercaseDifficulty : 'medium';
    }
    case 'Question_Type':
    case 'Question Type': {
      const validQuestionTypes = [
        'Objective',
        'Subjective',
        'MCQ',
        'True/False',
        'Fill in the Blank',
      ];
      const capitalizedType = stringValue
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return validQuestionTypes.includes(capitalizedType) ? capitalizedType : 'Objective';
    }
    case 'Nature of Question': {
      const validNatureOfQuestions = ['Factual', 'Conceptual', 'Analytical'];
      const capitalizedNature =
        stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
      return validNatureOfQuestions.includes(capitalizedNature) ? capitalizedNature : 'Theoretical';
    }
    case 'Faculty Approved': {
      // Convert to boolean
      console.log('Processing Faculty Approved:', {
        input: stringValue,
        isValid: stringValue.toLowerCase() === 'true' || stringValue === '1',
      });
      return stringValue.toLowerCase() === 'true' || stringValue === '1';
    }
    default: {
      // For other fields, trim and return
      console.log('Processing default field:', {
        input: stringValue,
        output: stringValue || null,
      });
      return stringValue || null;
    }
  }
}

function isValidAnswer(answer: string): boolean {
  // Allow single letters a, b, c, d (case-insensitive)
  // Allow multiple letters/words for other types of questions
  if (!answer) return false;
  // Trim and convert to lowercase
  const trimmedAnswer = answer.trim().toLowerCase();
  // Single letter answers for multiple choice
  if (/^[a-d]$/.test(trimmedAnswer)) return true;
  // For other types of answers, require at least 2 characters
  return trimmedAnswer.length >= 2;
}

function isValidDifficultyLevel(level: string): boolean {
  const validLevels = ['easy', 'medium', 'difficult'];
  if (!level) return false;
  // Trim and convert to lowercase
  const formattedLevel = level.trim().toLowerCase();
  return validLevels.includes(formattedLevel);
}

function standardizeDifficultyLevel(level: string): string {
  if (!level) return 'medium';
  const lowercaseLevel = level.trim().toLowerCase();
  switch (lowercaseLevel) {
    case 'easy':
      return 'easy';
    case 'hard':
    case 'difficult':
      return 'difficult';
    case 'medium':
    default:
      return 'medium';
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.group('QUESTION EDIT API ROUTE');
    console.log('1. Request Received');
    // Parse and validate the request body
    const body = await request.json();
    const question = body;
    // CRITICAL: Log ENTIRE question object with ALL keys
    console.log(
      '2. FULL Question Object (ALL KEYS):',
      Object.keys(question).reduce((acc: Record<string, any>, key) => {
        acc[key] = question[key as keyof typeof question];
        return acc;
      }, {})
    );
    // Log ALL keys and their types
    console.log(
      '2b. Question Object Key Types:',
      Object.keys(question).reduce((acc: Record<string, string>, key) => {
        acc[key] = typeof question[key as keyof typeof question];
        return acc;
      }, {})
    );
    // Enhanced ID validation
    const questionId =
      typeof question.id === 'string' ? parseInt(question.id, 10) : Number(question.id);
    if (isNaN(questionId) || questionId <= 0) {
      console.error('5. Invalid question ID', {
        originalId: question.id,
        parsedId: questionId,
      });
      console.groupEnd();
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid question ID',
          details: {
            id: question.id,
            type: typeof question.id,
            parsedId: questionId,
          },
        }),
        { status: 400 }
      );
    }
    
    // Fetch the original question to use as a fallback
    const { data: originalQuestion, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();
      
    if (fetchError || !originalQuestion) {
      console.error('6. Original question not found', { questionId, error: fetchError });
      console.groupEnd();
      return new NextResponse(
        JSON.stringify({
          error: 'Question not found',
          details: { id: questionId },
        }),
        { status: 404 }
      );
    }
    
    // Log original question for comparison
    console.log(
      '6b. Original Question:',
      Object.keys(originalQuestion).reduce((acc: Record<string, any>, key) => {
        acc[key] = originalQuestion[key as keyof typeof originalQuestion];
        return acc;
      }, {})
    );
    
    // Process and validate fields
    const updatedQuestion: Record<string, any> = {};
    
    // Process each field with validation
    if (question.text !== undefined) {
      updatedQuestion.text = question.text || originalQuestion.text;
    }
    
    if (question.answer !== undefined) {
      const processedAnswer = processField('answer', question.answer);
      updatedQuestion.answer = isValidAnswer(processedAnswer) 
        ? processedAnswer 
        : originalQuestion.answer;
    }
    
    if (question.difficulty_level !== undefined) {
      const processedLevel = processField('Difficulty Level', question.difficulty_level);
      updatedQuestion.difficulty_level = isValidDifficultyLevel(processedLevel)
        ? standardizeDifficultyLevel(processedLevel)
        : originalQuestion.difficulty_level;
    }
    
    // Process other fields
    const fieldsToProcess = [
      'subject',
      'topic',
      'sub_topic',
      'module_name',
      'question_type',
      'nature_of_question',
      'faculty_approved',
      'explanation',
      'source',
      'tags',
      'year',
      'is_active'
    ];
    
    fieldsToProcess.forEach(field => {
      if (question[field] !== undefined) {
        updatedQuestion[field] = processField(field, question[field]);
      }
    });
    
    // Add updated_at timestamp
    updatedQuestion.updated_at = new Date().toISOString();
    
    console.log('7. Processed Question Fields:', updatedQuestion);
    
    // Update the question in Supabase
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('questions')
      .update(updatedQuestion)
      .eq('id', questionId)
      .select()
      .single();
      
    if (updateError) {
      console.error('8. Error updating question:', updateError);
      console.groupEnd();
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to update question',
          details: updateError.message,
        }),
        { status: 500 }
      );
    }
    
    console.log('9. Question updated successfully:', {
      id: questionId,
      updatedFields: Object.keys(updatedQuestion),
    });
    console.groupEnd();
    
    return new NextResponse(
      JSON.stringify({
        message: 'Question updated successfully',
        question: updatedData,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('10. Unexpected error:', error);
    console.groupEnd();
    return new NextResponse(
      JSON.stringify({
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Reuse the same implementation as PUT
  return PUT(request);
}
