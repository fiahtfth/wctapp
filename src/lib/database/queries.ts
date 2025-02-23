'use server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Question as ImportedQuestion, isQuestion } from '@/types/question';
import { initializeDatabase } from './init';
import { APP_CONFIG } from '@/config';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';

// Use configuration for database path
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? path.join(process.cwd(), 'test-questions.db')
  : APP_CONFIG.DATABASE.PATH;

console.log('📂 Database Configuration:', {
  DB_PATH,
  NODE_ENV: process.env.NODE_ENV,
  CWD: process.cwd(),
  exists: fs.existsSync(DB_PATH)
});

export const openDatabase = async (): Promise<Database.Database> => {
  try {
    console.log('📂 Opening database at:', DB_PATH);
    
    // Ensure database directory exists
    const dbDirectory = path.dirname(APP_CONFIG.DATABASE.PATH);
    if (!fs.existsSync(dbDirectory)) {
      console.log('📝 Creating database directory:', dbDirectory);
      fs.mkdirSync(dbDirectory, { recursive: true });
    }

    // Create or open database
    const db = new Database(DB_PATH, { 
      // Add additional options for more robust database handling
      readonly: false,
      fileMustExist: false,
    });

    // Ensure tables are created if they don't exist
    createQuestionsTable(db);

    // Create cart tables
    db.prepare(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_test_id UNIQUE(test_id)
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id),
        FOREIGN KEY (question_id) REFERENCES questions(id),
        CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
      )
    `).run();

    console.log('✅ Database tables created successfully');
    return db;
  } catch (error) {
    console.error('Critical error opening database:', error);
    throw new AppError('Failed to open or create database', 500, error);
  }
};

const createQuestionsTable = (db: Database.Database) => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Question TEXT NOT NULL,
        Answer TEXT NOT NULL,
        Explanation TEXT,
        Subject TEXT NOT NULL,
        "Module Name" TEXT NOT NULL,
        Topic TEXT NOT NULL,
        "Sub Topic" TEXT,
        "Difficulty Level" TEXT NOT NULL,
        Question_Type TEXT NOT NULL,
        "Nature of Question" TEXT,
        CONSTRAINT unique_question UNIQUE(Question)
      )
    `).run();

    // Create performance indexes
    const indexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_subject ON questions(Subject)`,
      `CREATE INDEX IF NOT EXISTS idx_module ON questions("Module Name")`,
      `CREATE INDEX IF NOT EXISTS idx_topic ON questions(Topic)`,
      `CREATE INDEX IF NOT EXISTS idx_difficulty ON questions("Difficulty Level")`,
      `CREATE INDEX IF NOT EXISTS idx_question_type ON questions(Question_Type)`
    ];

    indexStatements.forEach(indexSQL => {
      try {
        db.prepare(indexSQL).run();
      } catch (indexError) {
        console.warn(`Could not create index: ${indexSQL}`, indexError);
      }
    });
  } catch (tableError) {
    console.error('Error creating questions table:', tableError);
    throw new AppError('Failed to create questions table', 500, tableError);
  }
};

export type Question = ImportedQuestion;

export interface QuestionsResult {
  questions: Question[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: null | Error;
}

export const getQuestions = asyncErrorHandler(async (params: {
  page?: number | string;
  pageSize?: number | string;
  subject?: string | string[];
  module?: string | string[];
  topic?: string | string[];
  sub_topic?: string | string[];
  question_type?: string | string[];
  search?: string;
}) => {
  console.log('🔍 Fetching Questions with Params:', JSON.stringify(params, null, 2));
  console.log('📂 Database Path:', DB_PATH);
  console.log('🗃️ Database Exists:', fs.existsSync(DB_PATH));

  // Validate input parameters
  if (!params) {
    throw new Error('No parameters provided for question retrieval');
  }

  const db = await openDatabase();

  try {
    // Sanitize and validate parameters
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.min(Math.max(1, Number(params.pageSize || 10)), 50); // Limit to 50 per page
    const offset = (page - 1) * pageSize;

    console.log('📄 Query pagination:', { page, pageSize, offset });

    console.log('📄 Pagination Details:', { page, pageSize, offset });

    // Prepare base query
    let baseQuery = `
      SELECT * FROM questions 
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    // Helper function to add filter conditions
    const addFilter = (column: string, filterValue?: string | string[]) => {
      if (!filterValue) return;

      const values = Array.isArray(filterValue) ? filterValue : [filterValue];
      const placeholders = values.map(() => '?').join(',');
      
      console.log(`🧩 Adding Filter: ${column} IN (${values.join(', ')})`);
      baseQuery += ` AND ${column} IN (${placeholders})`;
      queryParams.push(...values);
    };

    // Apply filters with NULL handling
    if (params.subject) {
      baseQuery += ` AND Subject IN (${Array(params.subject.length).fill('?').join(',')})`;      
      queryParams.push(...(Array.isArray(params.subject) ? params.subject : [params.subject]));
    }
    
    if (params.module) {
      baseQuery += ` AND "Module Name" IN (${Array(params.module.length).fill('?').join(',')})`;      
      queryParams.push(...(Array.isArray(params.module) ? params.module : [params.module]));
    }
    
    if (params.topic) {
      baseQuery += ` AND Topic IN (${Array(params.topic.length).fill('?').join(',')})`;      
      queryParams.push(...(Array.isArray(params.topic) ? params.topic : [params.topic]));
    }
    
    if (params.sub_topic) {
      baseQuery += ` AND ("Sub Topic" IN (${Array(params.sub_topic.length).fill('?').join(',')}) OR "Sub Topic" IS NULL)`;
      queryParams.push(...(Array.isArray(params.sub_topic) ? params.sub_topic : [params.sub_topic]));
    }
    
    if (params.question_type) {
      baseQuery += ` AND Question_Type IN (${Array(params.question_type.length).fill('?').join(',')})`;      
      queryParams.push(...(Array.isArray(params.question_type) ? params.question_type : [params.question_type]));
    }

    // Log current query state
    console.log('🔧 Current Query:', baseQuery);
    console.log('📊 Current Parameters:', queryParams);

    // Search filter (if applicable)
    if (params.search) {
      console.log(`🔍 Search Term: ${params.search}`);
      baseQuery += ` AND (
        Question LIKE ? OR 
        Answer LIKE ? OR 
        Explanation LIKE ? OR 
        Subject LIKE ? OR 
        Topic LIKE ?
      )`;
      const searchTerm = `%${params.search}%`;
      queryParams.push(
        searchTerm, searchTerm, searchTerm, 
        searchTerm, searchTerm
      );
    }

    console.log('📋 Base Query:', baseQuery);
    console.log('🔢 Query Parameters:', queryParams);

    // Count total matching questions
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
    let countResult;
    try {
      countResult = db.prepare(countQuery).get(...queryParams) as { total: number };
    } catch (countError) {
      console.error('❌ Count Query Error:', countError);
      throw new Error(`Failed to count questions: ${countError instanceof Error ? countError.message : String(countError)}`);
    }

    const total = countResult.total;
    console.log('📊 Total Matching Questions:', total);

    // Add pagination to base query
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(pageSize, offset);

    // Execute query
    let rawQuestions;
    try {
      rawQuestions = db.prepare(baseQuery).all(...queryParams);
    } catch (queryError) {
      console.error('❌ Query Execution Error:', queryError);
      throw new Error(`Failed to fetch questions: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
    }

    console.log('📝 Raw Questions Fetched:', rawQuestions.length);

    // Map raw questions to Question type
    const questions: Question[] = rawQuestions.map((q: any) => {
      console.log('🔍 Processing Question:', q.id);
      return {
        id: q.id,
        Question: q.Question,
        Answer: q.Answer,
        Explanation: q.Explanation,
        Subject: q.Subject,
        ModuleName: q['Module Name'],
        Topic: q.Topic,
        SubTopic: q['Sub Topic'],
        DifficultyLevel: q['Difficulty Level'],
        QuestionType: q.Question_Type || 'Objective',
        FacultyApproved: false, // Default value
        Objective: '', // Default value
        ModuleNumber: '', // Default value
        NatureOfQuestion: null, // Default value
        MicroTopic: null, // Default value
      };
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    console.log('✅ Questions Retrieval Successful', {
      totalQuestions: total,
      returnedQuestions: questions.length,
      page,
      pageSize,
      totalPages
    });

    return {
      questions,
      total,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('❌ Unexpected Error in getQuestions:', error);
    throw error; // Re-throw to be handled by the caller
  } finally {
    db.close();
  }
});

export async function sanitizeFilterValue(value?: string | string[]): Promise<string | string[] | null> {
  // If value is undefined or null, return null
  if (value === undefined || value === null) return null;

  // If value is an array, sanitize each element
  if (Array.isArray(value)) {
    const sanitizedArray = value
      .filter(v => v !== undefined && v !== null && v.trim() !== '')
      .map(v => v.trim());
    
    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  // If value is a string, sanitize it
  const sanitizedValue = value.trim();
  return sanitizedValue !== '' ? sanitizedValue : null;
}

export const addQuestion = asyncErrorHandler(async (questionData: Question) => {
  const db = await openDatabase();

  try {
    // Validate question data
    if (!isQuestion(questionData)) {
      throw new AppError('Invalid question data', 400);
    }

    const insertQuery = db.prepare(`
      INSERT INTO questions 
      (Question, Answer, Explanation, Subject, "Module Name", Topic, "Sub Topic", "Difficulty Level", Question_Type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertQuery.run(
      questionData.Question,
      questionData.Answer,
      questionData.Explanation || null,
      questionData.Subject,
      questionData.ModuleName || '',
      questionData.Topic,
      questionData.SubTopic || null,
      questionData.DifficultyLevel || null,
      questionData.QuestionType
    );

    return {
      ...questionData
    };
  } finally {
    db.close();
  }
});

export const saveDraftCart = async (
  userId: number | string, 
  testName: string, 
  batch: string, 
  date: string, 
  questionIds: number[]
) => {
  console.log('Saving draft cart:', { 
    userId: String(userId), 
    testName, 
    batch, 
    date, 
    questionIds 
  });
  
  // Placeholder implementation, replace with actual cart saving logic
  return `draft_${userId}_${testName}_${Date.now()}`;
};
