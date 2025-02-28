import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Helper function to get database path
function getDatabasePath() {
  const dbPath = path.resolve(process.cwd(), 'src/lib/database/wct.db');
  return dbPath;
}

// Function to check if we're in Vercel environment
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.VERCEL;
}

// Function to enable debug logging
function debugLog(...args: any[]): void {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const questionId = params.id;
  
  if (!questionId) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }
  
  console.log('Getting question with ID:', questionId);
  debugLog('Environment:', process.env.NODE_ENV, 'Vercel:', isVercelEnvironment());
  
  // If we're in Vercel environment, use a simplified approach
  if (isVercelEnvironment()) {
    debugLog('Using simplified question handling for Vercel environment');
    
    // In Vercel, we'll create a mock question
    const mockQuestion = {
      id: Number(questionId),
      Question: `Sample Question #${questionId}`,
      Answer: 'Sample Answer',
      Explanation: 'Sample Explanation',
      Subject: 'Sample Subject',
      ModuleName: 'Sample Module',
      Topic: 'Sample Topic',
      SubTopic: 'Sample SubTopic',
      DifficultyLevel: 'Medium',
      QuestionType: 'MCQ',
      NatureOfQuestion: 'Conceptual'
    };
    
    return NextResponse.json({ 
      question: mockQuestion,
      vercelMode: true
    }, { status: 200 });
  }
  
  console.log('Getting question with ID:', questionId);
  
  // Get database path
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file does not exist:', dbPath);
    return NextResponse.json({ 
      error: 'Database file does not exist'
    }, { status: 500 });
  }
  
  let db = null;
  
  try {
    db = new Database(dbPath, { readonly: true });
    
    // Get question by ID
    const question = db.prepare(`
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
        Question_Type as QuestionType,
        "Nature of Question" as NatureOfQuestion
      FROM questions
      WHERE id = ?
    `).get(questionId);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ 
      error: 'Error fetching question',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    if (db) {
      db.close();
    }
  }
}
